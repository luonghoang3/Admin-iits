// create-client-mapping-manual.js
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
      console.error('Usage: node create-client-mapping-manual.js <unique-clients-csv-path>');
      process.exit(1);
    }

    console.log(`Reading CSV file: ${csvFilePath}`);
    const data = await readCSV(csvFilePath);
    console.log(`Read ${data.length} clients from CSV.`);

    // Tạo file CSV ánh xạ cuối cùng
    const finalMappingPath = path.join(path.dirname(csvFilePath), 'client-mapping-final.csv');
    const finalMappingStream = fs.createWriteStream(finalMappingPath);
    
    // Viết header
    finalMappingStream.write('old_client_name,new_client_id\n');
    
    // Viết danh sách khách hàng
    data.forEach(row => {
      finalMappingStream.write(`"${row.old_client_name}",""\n`);
    });
    
    finalMappingStream.end();
    
    console.log(`Final client mapping template saved to: ${finalMappingPath}`);
    console.log('Please fill in the new_client_id column manually.');
  } catch (error) {
    console.error('Error during mapping process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
