// fix-csv-commas.js
// Script để sửa các dấu phẩy không chính xác trong file CSV
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Đường dẫn đến file CSV
const inputFilePath = path.join(__dirname, 'CG INVOICE.csv');
const outputFilePath = path.join(__dirname, 'CG INVOICE-fixed.csv');

// Hàm chính
async function main() {
  try {
    console.log(`Reading CSV file: ${inputFilePath}`);
    
    // Đọc file CSV
    const fileContent = fs.readFileSync(inputFilePath, 'utf8');
    
    // Xử lý BOM (Byte Order Mark) nếu có
    const contentWithoutBOM = fileContent.charCodeAt(0) === 0xFEFF
      ? fileContent.slice(1)
      : fileContent;
    
    // Phân tích CSV với các tùy chọn để xử lý dấu ngoặc kép và dấu phẩy
    const records = parse(contentWithoutBOM, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      escape: '"',
      quote: '"',
      delimiter: ',',
      trim: true
    });
    
    console.log(`Successfully parsed ${records.length} records from CSV.`);
    
    // Xử lý các dấu phẩy trong cột VAT
    records.forEach(record => {
      // Xử lý dấu phẩy trong số tiền VAT
      if (record['VAT'] && typeof record['VAT'] === 'string') {
        record['VAT'] = record['VAT'].replace(/,/g, '');
      }
      
      // Xử lý dấu phẩy trong số tiền Amount
      if (record['Amount'] && typeof record['Amount'] === 'string') {
        record['Amount'] = record['Amount'].replace(/,/g, '');
      }
      
      // Xử lý dấu phẩy trong số tiền Unit Price
      if (record['Unit Price'] && typeof record['Unit Price'] === 'string') {
        record['Unit Price'] = record['Unit Price'].replace(/,/g, '');
      }
      
      // Đảm bảo các cột quan trọng có giá trị
      if (!record['Invoice No']) record['Invoice No'] = '';
      if (!record['Invoice Date']) record['Invoice Date'] = '';
      if (!record['Client ID']) record['Client ID'] = '';
      if (!record['Description']) record['Description'] = '';
      if (!record['Unit']) record['Unit'] = '';
      if (!record['Currency']) record['Currency'] = '';
      if (!record['Order No']) record['Order No'] = '';
    });
    
    // Chuyển đổi dữ liệu đã xử lý thành chuỗi CSV
    const output = stringify(records, {
      header: true,
      quoted: true, // Đặt tất cả các giá trị trong dấu ngoặc kép
      quoted_empty: true, // Đặt cả các giá trị rỗng trong dấu ngoặc kép
      quoted_string: true, // Đặt các chuỗi trong dấu ngoặc kép
      quoted_number: true, // Đặt các số trong dấu ngoặc kép
      delimiter: ',',
      escape: '"'
    });
    
    // Ghi file CSV mới
    fs.writeFileSync(outputFilePath, output);
    console.log(`Fixed CSV saved to: ${outputFilePath}`);
    
    // Kiểm tra file đã sửa
    const fixedFileStats = fs.statSync(outputFilePath);
    console.log(`Fixed file size: ${(fixedFileStats.size / 1024).toFixed(2)} KB`);
    
    console.log('CSV fix completed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Chạy script
main();
