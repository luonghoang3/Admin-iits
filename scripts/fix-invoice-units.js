// fix-invoice-units.js
require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// Hàm đọc file CSV
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Hàm thực thi SQL an toàn
function executeSql(sql) {
  try {
    const result = execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "${sql.replace(/"/g, '\\"')}" -t -A`).toString();
    return result.trim();
  } catch (error) {
    console.error('Error executing SQL:', error.message);
    return '';
  }
}

// Hàm chính
async function main() {
  try {
    // Kiểm tra đường dẫn file
    const csvFilePath = process.argv[2];

    if (!csvFilePath) {
      console.error('Usage: node fix-invoice-units.js <invoices-csv-path>');
      process.exit(1);
    }

    console.log(`Reading CSV file: ${csvFilePath}`);
    const invoiceData = await readCSV(csvFilePath);
    console.log(`Read ${invoiceData.length} rows from CSV.`);

    // Tạo thư mục logs nếu chưa tồn tại
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    // Tạo file log
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = path.join(logsDir, `fix-units-${timestamp}.log`);
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });

    // Lấy danh sách đơn vị tính hiện có
    console.log('Loading existing units...');
    const existingUnits = new Map();
    try {
      const sqlCommand = `SELECT id, name FROM units;`;
      const result = executeSql(sqlCommand);
      
      result.split('\n').forEach(line => {
        if (!line.trim()) return;
        
        const parts = line.split('|');
        if (parts.length >= 2) {
          const id = parts[0].trim();
          const name = parts[1].trim();
          if (id && name) {
            existingUnits.set(name.toLowerCase(), id);
          }
        }
      });
      
      console.log(`Loaded ${existingUnits.size} existing units.`);
      logStream.write(`Loaded ${existingUnits.size} existing units.\n`);
    } catch (error) {
      console.error('Error loading existing units:', error.message);
      logStream.write(`Error loading existing units: ${error.message}\n`);
    }

    // Tìm tất cả các đơn vị tính trong file CSV
    console.log('Analyzing units in CSV...');
    const unitCounts = new Map();
    
    invoiceData.forEach(row => {
      const unitKey = Object.keys(row).find(key => key.trim() === 'Unit');
      if (unitKey && row[unitKey]) {
        const unitName = row[unitKey].trim();
        if (unitName) {
          unitCounts.set(unitName, (unitCounts.get(unitName) || 0) + 1);
        }
      }
    });
    
    console.log(`Found ${unitCounts.size} unique units in CSV.`);
    logStream.write(`Found ${unitCounts.size} unique units in CSV.\n`);

    // Tạo các đơn vị tính mới nếu cần
    console.log('Creating missing units...');
    const newUnits = new Map();
    
    for (const [unitName, count] of unitCounts.entries()) {
      const unitNameLower = unitName.toLowerCase();
      
      if (!existingUnits.has(unitNameLower)) {
        // Tạo ID mới cho đơn vị tính
        const unitId = uuidv4();
        
        // Thêm đơn vị tính mới vào cơ sở dữ liệu
        const insertSql = `
          INSERT INTO units (id, name, created_at, updated_at)
          VALUES ('${unitId}', '${unitName.replace(/'/g, "''")}', NOW(), NOW())
          RETURNING id;
        `;
        
        const result = executeSql(insertSql);
        
        if (result) {
          newUnits.set(unitNameLower, unitId);
          existingUnits.set(unitNameLower, unitId);
          console.log(`Created new unit: ${unitName} (${unitId})`);
          logStream.write(`Created new unit: ${unitName} (${unitId})\n`);
        } else {
          console.error(`Failed to create unit: ${unitName}`);
          logStream.write(`Failed to create unit: ${unitName}\n`);
        }
      }
    }
    
    console.log(`Created ${newUnits.size} new units.`);
    logStream.write(`Created ${newUnits.size} new units.\n`);

    // Cập nhật unit_id cho các chi tiết hóa đơn
    console.log('Updating invoice details...');
    let updatedCount = 0;
    let errorCount = 0;

    // Nhóm dữ liệu theo số hóa đơn
    const invoiceGroups = new Map();
    invoiceData.forEach(row => {
      const invoiceNoKey = Object.keys(row).find(key => key.trim() === 'Invoice No');
      
      if (invoiceNoKey && row[invoiceNoKey]) {
        const invoiceNo = row[invoiceNoKey].trim();
        if (!invoiceGroups.has(invoiceNo)) {
          invoiceGroups.set(invoiceNo, []);
        }
        invoiceGroups.get(invoiceNo).push(row);
      }
    });

    // Cập nhật unit_id cho từng hóa đơn
    for (const [invoiceNo, invoiceRows] of invoiceGroups.entries()) {
      try {
        // Tìm ID của hóa đơn
        const invoiceIdSql = `SELECT id FROM invoices WHERE invoice_number = '${invoiceNo}' LIMIT 1;`;
        const invoiceId = executeSql(invoiceIdSql);

        if (!invoiceId) {
          logStream.write(`Invoice "${invoiceNo}" not found in database. Skipping.\n`);
          continue; // Bỏ qua hóa đơn này
        }

        // Lấy danh sách chi tiết hóa đơn
        const detailsSql = `SELECT id, sequence FROM invoice_details WHERE invoice_id = '${invoiceId}' ORDER BY sequence;`;
        const detailsResult = executeSql(detailsSql);
        
        const details = detailsResult.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const parts = line.split('|');
            return {
              id: parts[0],
              sequence: parseInt(parts[1])
            };
          });

        // Cập nhật unit_id cho từng chi tiết
        for (const row of invoiceRows) {
          const unitKey = Object.keys(row).find(key => key.trim() === 'Unit');
          const invoiceDetailsNoKey = Object.keys(row).find(key => key.trim() === 'Invoice Details No');
          
          if (!unitKey || !row[unitKey]) {
            continue; // Bỏ qua nếu không có đơn vị tính
          }

          // Tìm chi tiết hóa đơn tương ứng
          const sequence = invoiceDetailsNoKey && row[invoiceDetailsNoKey] ? 
                          parseInt(row[invoiceDetailsNoKey]) : 0;
          
          const detail = details.find(d => d.sequence === sequence);
          
          if (!detail) {
            logStream.write(`Detail with sequence ${sequence} not found for invoice ${invoiceNo}. Skipping.\n`);
            continue; // Bỏ qua nếu không tìm thấy chi tiết
          }

          // Tìm unit_id
          const unitName = row[unitKey].trim();
          const unitId = existingUnits.get(unitName.toLowerCase());
          
          if (!unitId) {
            logStream.write(`Unit "${unitName}" not found for invoice ${invoiceNo}, detail ${sequence}. Skipping.\n`);
            continue; // Bỏ qua nếu không tìm thấy đơn vị tính
          }

          // Cập nhật unit_id
          const updateSql = `UPDATE invoice_details SET unit_id = '${unitId}' WHERE id = '${detail.id}';`;
          executeSql(updateSql);
          
          updatedCount++;
          logStream.write(`Updated unit_id for invoice ${invoiceNo}, detail ${sequence} to ${unitName} (${unitId})\n`);
        }
      } catch (error) {
        logStream.write(`Error processing invoice ${invoiceNo}: ${error.message}\n`);
        errorCount++;
      }
    }

    // Tổng kết
    const summary = `
Fix completed:
- Created: ${newUnits.size} new units
- Updated: ${updatedCount} invoice details
- Errors: ${errorCount}
- Full log saved to: ${logPath}
    `;

    logStream.write(summary);
    logStream.end();

    console.log(summary);
  } catch (error) {
    console.error('Error during fix process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
