// fix-vietnamese-descriptions.js
require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { execSync } = require('child_process');

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
      console.error('Usage: node fix-vietnamese-descriptions.js <invoices-csv-path>');
      process.exit(1);
    }

    console.log(`Reading CSV file: ${csvFilePath}`);
    const invoiceData = await readCSV(csvFilePath);
    console.log(`Read ${invoiceData.length} rows from CSV.`);

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

    console.log(`Found ${invoiceGroups.size} unique invoices in CSV.`);

    // Tạo thư mục logs nếu chưa tồn tại
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    // Tạo file log
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = path.join(logsDir, `fix-descriptions-${timestamp}.log`);
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });

    // Biến đếm
    let updatedCount = 0;
    let errorCount = 0;

    // Cập nhật mô tả cho từng hóa đơn
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

        // Cập nhật mô tả cho từng chi tiết
        for (const row of invoiceRows) {
          const descriptionKey = Object.keys(row).find(key => key.trim() === 'Description');
          const invoiceDetailsNoKey = Object.keys(row).find(key => key.trim() === 'Invoice Details No');
          
          if (!descriptionKey || !row[descriptionKey]) {
            continue; // Bỏ qua nếu không có mô tả
          }

          // Tìm chi tiết hóa đơn tương ứng
          const sequence = invoiceDetailsNoKey && row[invoiceDetailsNoKey] ? 
                          parseInt(row[invoiceDetailsNoKey]) : 0;
          
          const detail = details.find(d => d.sequence === sequence);
          
          if (!detail) {
            logStream.write(`Detail with sequence ${sequence} not found for invoice ${invoiceNo}. Skipping.\n`);
            continue; // Bỏ qua nếu không tìm thấy chi tiết
          }

          // Chuẩn bị mô tả an toàn cho SQL
          const description = row[descriptionKey]
            .replace(/'/g, "''")
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ')
            .replace(/\t/g, ' ');

          // Cập nhật mô tả
          const updateSql = `UPDATE invoice_details SET description = E'${description}' WHERE id = '${detail.id}';`;
          executeSql(updateSql);
          
          updatedCount++;
          logStream.write(`Updated description for invoice ${invoiceNo}, detail ${sequence}\n`);
        }
      } catch (error) {
        logStream.write(`Error processing invoice ${invoiceNo}: ${error.message}\n`);
        errorCount++;
      }
    }

    // Tổng kết
    const summary = `
Fix completed:
- Updated: ${updatedCount} descriptions
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
