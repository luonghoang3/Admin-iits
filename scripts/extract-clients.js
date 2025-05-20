// extract-clients.js
require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

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

// Hàm chính
async function main() {
  try {
    // Kiểm tra đường dẫn file
    const csvFilePath = process.argv[2];
    if (!csvFilePath) {
      console.error('Usage: node extract-clients.js <invoices-csv-path>');
      process.exit(1);
    }

    console.log(`Reading CSV file: ${csvFilePath}`);
    const data = await readCSV(csvFilePath);
    console.log(`Read ${data.length} rows from CSV.`);

    // Trích xuất danh sách khách hàng duy nhất
    const uniqueClients = new Set();
    data.forEach(row => {
      if (row['Client ID']) {
        uniqueClients.add(row['Client ID']);
      }
    });

    console.log(`Found ${uniqueClients.size} unique clients in CSV.`);

    // Tạo file CSV danh sách khách hàng
    const outputPath = path.join(path.dirname(csvFilePath), 'unique-clients.csv');
    const outputStream = fs.createWriteStream(outputPath);
    
    // Viết header
    outputStream.write('old_client_name,new_client_id\n');
    
    // Viết danh sách khách hàng
    Array.from(uniqueClients).sort().forEach(clientName => {
      outputStream.write(`"${clientName}",\n`);
    });
    
    outputStream.end();
    
    console.log(`Unique clients list saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error during extraction process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
