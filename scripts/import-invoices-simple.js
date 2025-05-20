// import-invoices-simple.js
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

// Hàm tải bảng ánh xạ khách hàng
async function loadClientMapping(filePath) {
  try {
    console.log(`Loading client mapping from: ${filePath}`);
    const data = await readCSV(filePath);
    
    const mapping = new Map();
    data.forEach(row => {
      if (row.old_client_name && row.new_client_id) {
        mapping.set(row.old_client_name.trim(), row.new_client_id.trim());
      }
    });
    
    console.log(`Loaded ${mapping.size} client mappings`);
    return mapping;
  } catch (error) {
    console.error('Error loading client mapping:', error);
    return new Map();
  }
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
    const clientMappingPath = process.argv[3];

    if (!csvFilePath || !clientMappingPath) {
      console.error('Usage: node import-invoices-simple.js <invoices-csv-path> <client-mapping-csv-path>');
      process.exit(1);
    }

    console.log(`Reading CSV file: ${csvFilePath}`);
    const invoiceData = await readCSV(csvFilePath);
    console.log(`Read ${invoiceData.length} rows from CSV.`);

    // Tải bảng ánh xạ khách hàng
    const clientMapping = await loadClientMapping(clientMappingPath);

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
    const logPath = path.join(logsDir, `invoice-import-${timestamp}.log`);
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });

    // Tạo file báo cáo khách hàng không tìm thấy
    const missingClientsPath = path.join(logsDir, `missing-clients-${timestamp}.csv`);
    const missingClientsStream = fs.createWriteStream(missingClientsPath, { flags: 'a' });
    missingClientsStream.write('old_client_name\n');

    // Biến đếm
    let importedCount = 0;
    let errorCount = 0;
    let missingClientCount = 0;
    const missingClients = new Set();

    // Import từng hóa đơn
    for (const [invoiceNo, invoiceRows] of invoiceGroups.entries()) {
      try {
        // Lấy thông tin hóa đơn từ dòng đầu tiên
        const firstRow = invoiceRows[0];

        // Tìm các key cho các trường dữ liệu
        const clientIdKey = Object.keys(firstRow).find(key => key.trim() === 'Client ID');
        const invoiceDateKey = Object.keys(firstRow).find(key => key.trim() === 'Invoice Date');
        const orderNoKey = Object.keys(firstRow).find(key => key.trim() === 'Order No');
        const referenceKey = Object.keys(firstRow).find(key => key.trim() === 'Reference');
        const vatPercentageKey = Object.keys(firstRow).find(key => key.trim() === 'VAT %');

        // Tìm client_id
        const clientName = clientIdKey ? firstRow[clientIdKey] : null;
        const clientId = clientName ? clientMapping.get(clientName) : null;

        if (!clientId) {
          logStream.write(`Client not found: ${clientName}\n`);
          if (!missingClients.has(clientName)) {
            missingClients.add(clientName);
            missingClientsStream.write(`${clientName}\n`);
            missingClientCount++;
          }
          continue; // Bỏ qua hóa đơn này
        }

        // Parse ngày hóa đơn
        const invoiceDate = invoiceDateKey ? firstRow[invoiceDateKey] : null;
        let formattedInvoiceDate = null;
        
        if (invoiceDate) {
          const invoiceDateParts = invoiceDate.split('/');
          if (invoiceDateParts.length === 3) {
            formattedInvoiceDate = `${invoiceDateParts[2]}-${invoiceDateParts[1]}-${invoiceDateParts[0]}`; // YYYY-MM-DD
          }
        }

        // Tính tổng số tiền và VAT
        let totalAmount = 0;
        let vatAmount = 0;

        invoiceRows.forEach(row => {
          const amountKey = Object.keys(row).find(key => key.trim() === 'Amount');
          const vatKey = Object.keys(row).find(key => key.trim() === 'VAT');
          
          const amount = amountKey ? parseFloat(row[amountKey] || 0) : 0;
          const vat = vatKey ? parseFloat(row[vatKey] || 0) : 0;
          
          totalAmount += amount;
          vatAmount += vat;
        });

        // Kiểm tra xem hóa đơn đã tồn tại chưa
        const checkSql = `SELECT id FROM invoices WHERE invoice_number = '${invoiceNo}' LIMIT 1;`;
        const existingInvoiceId = executeSql(checkSql);

        if (existingInvoiceId) {
          logStream.write(`Invoice "${invoiceNo}" already exists with ID: ${existingInvoiceId}\n`);
          continue; // Bỏ qua hóa đơn này
        }

        // Tạo ID mới cho hóa đơn
        const invoiceId = uuidv4();

        // Tạo hóa đơn mới
        const insertSql = `
          INSERT INTO invoices (
            id, invoice_number, invoice_date, client_id, reference, vat_percentage, vat_amount,
            status, total_amount_with_vat, created_at, updated_at
          ) VALUES (
            '${invoiceId}',
            '${invoiceNo}',
            ${formattedInvoiceDate ? `'${formattedInvoiceDate}'` : 'NULL'},
            '${clientId}',
            NULL,
            ${vatPercentageKey ? parseFloat(firstRow[vatPercentageKey] || 0) : 0},
            ${vatAmount},
            'paid',
            ${totalAmount + vatAmount},
            NOW(),
            NOW()
          );
        `;

        executeSql(insertSql);
        logStream.write(`Created invoice "${invoiceNo}" with ID: ${invoiceId}\n`);
        importedCount++;

        // Thêm chi tiết hóa đơn
        let detailCount = 0;
        for (const row of invoiceRows) {
          try {
            const descriptionKey = Object.keys(row).find(key => key.trim() === 'Description');
            const quantityKey = Object.keys(row).find(key => key.trim() === 'Quantity');
            const unitPriceKey = Object.keys(row).find(key => key.trim() === 'Unit Price');
            const amountKey = Object.keys(row).find(key => key.trim() === 'Amount');
            const invoiceDetailsNoKey = Object.keys(row).find(key => key.trim() === 'Invoice Details No');
            
            // Tạo ID mới cho chi tiết hóa đơn
            const detailId = uuidv4();
            
            // Tạo chi tiết hóa đơn mới
            const insertDetailSql = `
              INSERT INTO invoice_details (
                id, invoice_id, description, quantity, is_fixed_price, unit_price, 
                currency, amount, sequence, created_at, updated_at
              ) VALUES (
                '${detailId}',
                '${invoiceId}',
                'Invoice detail ${detailCount + 1}',
                ${quantityKey ? parseFloat(row[quantityKey] || 1) : 1},
                false,
                ${unitPriceKey ? parseFloat(row[unitPriceKey] || 0) : 0},
                'VND',
                ${amountKey ? parseFloat(row[amountKey] || 0) : 0},
                ${invoiceDetailsNoKey ? parseInt(row[invoiceDetailsNoKey] || 0) : detailCount + 1},
                NOW(),
                NOW()
              );
            `;
            
            executeSql(insertDetailSql);
            detailCount++;
          } catch (error) {
            logStream.write(`Error inserting invoice detail for invoice ${invoiceId}: ${error.message}\n`);
          }
        }
        
        logStream.write(`Added ${detailCount} details for invoice ${invoiceId}\n`);
      } catch (error) {
        logStream.write(`Error processing invoice ${invoiceNo}: ${error.message}\n`);
        errorCount++;
      }
    }

    // Tổng kết
    const summary = `
Import completed:
- Imported: ${importedCount} invoices
- Errors: ${errorCount}
- Missing clients: ${missingClientCount}
- Missing clients list saved to: ${missingClientsPath}
- Full log saved to: ${logPath}
    `;

    logStream.write(summary);
    logStream.end();
    missingClientsStream.end();

    console.log(summary);
  } catch (error) {
    console.error('Error during import process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
