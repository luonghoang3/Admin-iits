// import-cg-invoices.js
// Script để import hóa đơn team CG từ file CSV, với mapping chính xác cho client và unit
require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

// Đường dẫn đến file CSV và file mapping
const csvFilePath = path.join(__dirname, 'CG INVOICE-fixed.csv');
const clientMappingPath = path.join(__dirname, 'client-mapping-cg-full.csv');
const unitMappingPath = path.join(__dirname, 'unit-mapping-cg-full.csv');
const teamCode = 'CG';
const deleteExisting = true; // Xóa dữ liệu cũ trước khi import

// Hàm chạy script import-invoices-with-mapping.js với các tham số
function runImportScript() {
  console.log('Starting import process...');
  console.log(`CSV File: ${csvFilePath}`);
  console.log(`Client Mapping: ${clientMappingPath}`);
  console.log(`Unit Mapping: ${unitMappingPath}`);
  console.log(`Team Code: ${teamCode}`);
  console.log(`Delete Existing: ${deleteExisting}`);

  const args = [
    'import-invoices-with-mapping.js',
    csvFilePath,
    teamCode,
    deleteExisting.toString(),
    clientMappingPath,
    unitMappingPath
  ];

  const importProcess = spawn('node', args, {
    cwd: __dirname,
    stdio: 'inherit'
  });

  importProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Import completed successfully.');
    } else {
      console.error(`Import process exited with code ${code}`);
    }
  });
}

// Chạy script import
runImportScript();
