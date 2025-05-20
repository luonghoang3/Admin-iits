// fix-at-cost-prices.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const csv = require('csv-parser');

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
      console.error('Usage: node fix-at-cost-prices.js <invoices-csv-path>');
      process.exit(1);
    }

    // Tạo thư mục logs nếu chưa tồn tại
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    // Tạo file log
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = path.join(logsDir, `fix-at-cost-prices-${timestamp}.log`);
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });

    console.log(`Reading CSV file: ${csvFilePath}`);
    const invoiceData = await readCSV(csvFilePath);
    console.log(`Read ${invoiceData.length} rows from CSV.`);

    // Lấy ID của loại giá "At cost"
    console.log('Finding "At cost" pricing type...');
    const atCostPricingTypeId = executeSql(`SELECT id FROM pricing_types WHERE name = 'At cost' LIMIT 1;`);
    
    if (!atCostPricingTypeId) {
      console.error('Error: "At cost" pricing type not found in database.');
      process.exit(1);
    }
    
    console.log(`Found "At cost" pricing type with ID: ${atCostPricingTypeId}`);

    // Lấy danh sách chi tiết hóa đơn có loại giá "At cost" với giá trị 0
    console.log('Finding invoice details with "At cost" pricing type and zero amount...');
    const zeroAtCostDetails = [];
    try {
      const sqlCommand = `
        SELECT id, invoice_id, description, quantity, fixed_price, amount
        FROM invoice_details
        WHERE pricing_type_id = '${atCostPricingTypeId}'
        AND amount = 0;
      `;
      const result = executeSql(sqlCommand);
      
      result.split('\n').forEach(line => {
        if (!line.trim()) return;
        
        const parts = line.split('|');
        if (parts.length >= 6) {
          zeroAtCostDetails.push({
            id: parts[0].trim(),
            invoice_id: parts[1].trim(),
            description: parts[2].trim(),
            quantity: parseFloat(parts[3] || '1'),
            fixed_price: parseFloat(parts[4] || '0'),
            amount: parseFloat(parts[5] || '0')
          });
        }
      });
      
      console.log(`Found ${zeroAtCostDetails.length} invoice details with "At cost" pricing type and zero amount.`);
      logStream.write(`Found ${zeroAtCostDetails.length} invoice details with "At cost" pricing type and zero amount.\n`);
    } catch (error) {
      console.error('Error finding invoice details:', error.message);
      logStream.write(`Error finding invoice details: ${error.message}\n`);
    }

    // Nhóm dữ liệu theo số hóa đơn
    const invoiceGroups = new Map();
    invoiceData.forEach(row => {
      // Lấy tên cột Invoice No (có thể có khoảng trắng ở đầu hoặc cuối)
      const invoiceNoKey = Object.keys(row).find(key => key.trim() === 'Invoice No');
      
      if (invoiceNoKey && row[invoiceNoKey]) {
        const invoiceNo = row[invoiceNoKey].trim();
        if (!invoiceGroups.has(invoiceNo)) {
          invoiceGroups.set(invoiceNo, []);
        }
        invoiceGroups.get(invoiceNo).push(row);
      }
    });

    // Cập nhật chi tiết hóa đơn
    console.log('Updating invoice details...');
    let updatedCount = 0;
    let errorCount = 0;

    for (const detail of zeroAtCostDetails) {
      try {
        // Tìm hóa đơn tương ứng
        const invoiceNumberSql = `SELECT invoice_number FROM invoices WHERE id = '${detail.invoice_id}' LIMIT 1;`;
        const invoiceNumber = executeSql(invoiceNumberSql);
        
        if (!invoiceNumber) {
          logStream.write(`Invoice not found for detail ${detail.id}. Skipping.\n`);
          continue;
        }
        
        // Tìm dữ liệu gốc trong file CSV
        const invoiceRows = invoiceGroups.get(invoiceNumber);
        if (!invoiceRows) {
          logStream.write(`Invoice "${invoiceNumber}" not found in CSV. Skipping.\n`);
          continue;
        }
        
        // Tìm chi tiết tương ứng trong file CSV
        let matchingRow = null;
        for (const row of invoiceRows) {
          const descriptionKey = Object.keys(row).find(key => key.trim() === 'Description');
          if (descriptionKey && row[descriptionKey] && row[descriptionKey].includes(detail.description)) {
            matchingRow = row;
            break;
          }
        }
        
        if (!matchingRow) {
          logStream.write(`Matching detail not found in CSV for "${detail.description}". Skipping.\n`);
          continue;
        }
        
        // Lấy giá trị từ file CSV
        const amountKey = Object.keys(matchingRow).find(key => key.trim() === 'Amount');
        const unitPriceKey = Object.keys(matchingRow).find(key => key.trim() === 'Unit Price');
        const quantityKey = Object.keys(matchingRow).find(key => key.trim() === 'Quantity');
        
        let newAmount = 0;
        
        if (amountKey && matchingRow[amountKey]) {
          newAmount = parseFloat(matchingRow[amountKey].replace(/[^0-9.]/g, '')) || 0;
        } else if (unitPriceKey && matchingRow[unitPriceKey] && quantityKey && matchingRow[quantityKey]) {
          const unitPrice = parseFloat(matchingRow[unitPriceKey].replace(/[^0-9.]/g, '')) || 0;
          const quantity = parseFloat(matchingRow[quantityKey].replace(/[^0-9.]/g, '')) || 1;
          newAmount = unitPrice * quantity;
        }
        
        if (newAmount > 0) {
          // Cập nhật amount và fixed_price
          const updateSql = `
            UPDATE invoice_details
            SET amount = ${newAmount}, fixed_price = ${newAmount}
            WHERE id = '${detail.id}';
          `;
          
          executeSql(updateSql);
          
          updatedCount++;
          logStream.write(`Updated amount for invoice detail ${detail.id} from ${detail.amount} to ${newAmount}\n`);
        } else {
          logStream.write(`Could not determine new amount for detail ${detail.id}. Skipping.\n`);
        }
      } catch (error) {
        logStream.write(`Error updating invoice detail ${detail.id}: ${error.message}\n`);
        errorCount++;
      }
    }

    // Tổng kết
    const summary = `
Fix completed:
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
