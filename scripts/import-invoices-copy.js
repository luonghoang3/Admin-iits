// import-invoices-copy.js
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

// Hàm tải bảng ánh xạ đơn vị tính
async function loadUnitMapping() {
  try {
    // Thực thi lệnh SQL để lấy danh sách đơn vị tính
    const sqlCommand = `SELECT id, name FROM units ORDER BY name;`;
    const result = execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "${sqlCommand}" -t -A`).toString();

    const mapping = new Map();
    result.split('\n').forEach(line => {
      if (!line.trim()) return;

      const parts = line.split('|');
      if (parts.length >= 2) {
        const id = parts[0].trim();
        const name = parts[1].trim();
        if (id && name) {
          mapping.set(name.toLowerCase(), id);
        }
      }
    });

    // Thêm một số ánh xạ phổ biến
    mapping.set('tấn', mapping.get('ton') || null);
    mapping.set('cont', mapping.get('container') || null);
    mapping.set('cont(s)', mapping.get('container') || null);
    mapping.set('vụ', mapping.get('case') || null);
    mapping.set('case(s)', mapping.get('case') || null);
    mapping.set('ngày', mapping.get('day') || null);
    mapping.set('ngày công', mapping.get('manday') || null);
    mapping.set('manday(s)', mapping.get('manday') || null);
    mapping.set('km(s)', mapping.get('km') || null);
    mapping.set('mts', mapping.get('ton') || null);

    console.log(`Loaded ${mapping.size} unit mappings`);
    return mapping;
  } catch (error) {
    console.error('Error loading unit mapping:', error);
    return new Map();
  }
}

// Hàm tải bảng ánh xạ loại giá
async function loadPricingTypeMapping() {
  try {
    // Thực thi lệnh SQL để lấy danh sách loại giá
    const sqlCommand = `SELECT id, name, code FROM pricing_types ORDER BY name;`;
    const result = execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "${sqlCommand}" -t -A`).toString();

    const mapping = new Map();
    result.split('\n').forEach(line => {
      if (!line.trim()) return;

      const parts = line.split('|');
      if (parts.length >= 3) {
        const id = parts[0].trim();
        const name = parts[1].trim();
        const code = parts[2].trim();
        if (id && name) {
          mapping.set(name.toLowerCase(), id);
          if (code) {
            mapping.set(code.toLowerCase(), id);
          }
        }
      }
    });

    // Thêm một số ánh xạ phổ biến
    mapping.set('lumpsum', mapping.get('lumpsum') || null);
    mapping.set('phí trọn gói', mapping.get('lumpsum') || null);
    mapping.set('at cost', mapping.get('at_cost') || null);
    mapping.set('phí cố định', mapping.get('lumpsum') || null);
    mapping.set('mincharge', mapping.get('mincharge') || null);
    mapping.set('phí tối thiểu', mapping.get('mincharge') || null);

    console.log(`Loaded ${mapping.size} pricing type mappings`);
    return mapping;
  } catch (error) {
    console.error('Error loading pricing type mapping:', error);
    return new Map();
  }
}

// Hàm chính
async function main() {
  try {
    // Kiểm tra đường dẫn file
    const csvFilePath = process.argv[2];
    const clientMappingPath = process.argv[3];

    if (!csvFilePath || !clientMappingPath) {
      console.error('Usage: node import-invoices-copy.js <invoices-csv-path> <client-mapping-csv-path>');
      process.exit(1);
    }

    console.log(`Reading CSV file: ${csvFilePath}`);
    const invoiceData = await readCSV(csvFilePath);
    console.log(`Read ${invoiceData.length} rows from CSV.`);

    // Tải các bảng ánh xạ
    const clientMapping = await loadClientMapping(clientMappingPath);
    const unitMapping = await loadUnitMapping();
    const pricingTypeMapping = await loadPricingTypeMapping();

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

    // Tạo thư mục temp nếu chưa tồn tại
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Tạo file log
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = path.join(logsDir, `invoice-import-${timestamp}.log`);
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });

    // Tạo file báo cáo khách hàng không tìm thấy
    const missingClientsPath = path.join(logsDir, `missing-clients-${timestamp}.csv`);
    const missingClientsStream = fs.createWriteStream(missingClientsPath, { flags: 'a' });
    missingClientsStream.write('old_client_name\n');

    // Tạo file CSV tạm thời cho hóa đơn với BOM để hỗ trợ UTF-8
    const invoicesCsvPath = path.join(tempDir, `invoices-${timestamp}.csv`);
    const invoicesCsvStream = fs.createWriteStream(invoicesCsvPath, { flags: 'a' });
    // Thêm BOM (Byte Order Mark) để đánh dấu file là UTF-8
    invoicesCsvStream.write('\ufeff');
    invoicesCsvStream.write('id,invoice_number,invoice_date,client_id,reference,vat_percentage,vat_amount,order_id,status,total_amount_with_vat,created_at,updated_at\n');

    // Tạo file CSV tạm thời cho chi tiết hóa đơn với BOM để hỗ trợ UTF-8
    const detailsCsvPath = path.join(tempDir, `invoice-details-${timestamp}.csv`);
    const detailsCsvStream = fs.createWriteStream(detailsCsvPath, { flags: 'a' });
    // Thêm BOM (Byte Order Mark) để đánh dấu file là UTF-8
    detailsCsvStream.write('\ufeff');
    detailsCsvStream.write('id,invoice_id,description,quantity,unit_id,is_fixed_price,fixed_price,unit_price,currency,amount,sequence,pricing_type_id,created_at,updated_at\n');

    // Biến đếm
    let importedCount = 0;
    let errorCount = 0;
    let missingClientCount = 0;
    const missingClients = new Set();
    const now = new Date().toISOString();

    // Lấy danh sách hóa đơn đã tồn tại
    console.log('Checking existing invoices...');
    const existingInvoices = new Set();
    try {
      const sqlCommand = `SELECT invoice_number FROM invoices;`;
      const result = execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "${sqlCommand}" -t -A`).toString();

      result.split('\n').forEach(line => {
        if (line.trim()) {
          existingInvoices.add(line.trim());
        }
      });

      console.log(`Found ${existingInvoices.size} existing invoices in database.`);
      logStream.write(`Found ${existingInvoices.size} existing invoices in database.\n`);
    } catch (error) {
      console.error('Error checking existing invoices:', error.message);
      logStream.write(`Error checking existing invoices: ${error.message}\n`);
    }

    // Chuẩn bị dữ liệu cho từng hóa đơn
    for (const [invoiceNo, invoiceRows] of invoiceGroups.entries()) {
      try {
        // Kiểm tra xem hóa đơn đã tồn tại chưa
        if (existingInvoices.has(invoiceNo)) {
          logStream.write(`Invoice "${invoiceNo}" already exists in database. Skipping.\n`);
          continue; // Bỏ qua hóa đơn này
        }

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

        // Tìm order_id nếu có
        let orderId = null;
        const orderNo = orderNoKey ? firstRow[orderNoKey] : null;
        if (orderNo) {
          try {
            const sqlCommand = `SELECT id FROM orders WHERE order_number = '${orderNo}' LIMIT 1;`;
            const result = execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "${sqlCommand}" -t -A`).toString().trim();

            if (result) {
              orderId = result;
            }
          } catch (error) {
            logStream.write(`Error finding order_id for ${orderNo}: ${error.message}\n`);
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

        // Tạo ID mới cho hóa đơn
        const invoiceId = uuidv4();

        // Chuẩn bị dữ liệu cho CSV
        const vatPercentage = vatPercentageKey && firstRow[vatPercentageKey] ?
                             parseFloat(firstRow[vatPercentageKey].replace(/[^0-9.]/g, '')) || 0 : 0;

        const reference = referenceKey && firstRow[referenceKey] ?
                         firstRow[referenceKey].replace(/,/g, ' ').replace(/"/g, ' ').replace(/'/g, ' ') : '';

        // Thêm dòng vào file CSV hóa đơn - đảm bảo không có trường nào bị bỏ trống
        invoicesCsvStream.write(`${invoiceId},${invoiceNo},${formattedInvoiceDate || '2023-01-01'},${clientId},"${reference}",${vatPercentage},${vatAmount || 0},${orderId || ''},paid,${totalAmount + vatAmount},${now},${now}\n`);

        importedCount++;
        logStream.write(`Prepared invoice "${invoiceNo}" with ID: ${invoiceId}\n`);

        // Chuẩn bị dữ liệu cho từng chi tiết hóa đơn
        for (let i = 0; i < invoiceRows.length; i++) {
          const row = invoiceRows[i];

          // Tìm các key cho các trường dữ liệu
          const unitKey = Object.keys(row).find(key => key.trim() === 'Unit');
          const fixedPriceKey = Object.keys(row).find(key => key.trim() === 'Fixed Price');
          const descriptionKey = Object.keys(row).find(key => key.trim() === 'Description');
          const quantityKey = Object.keys(row).find(key => key.trim() === 'Quantity');
          const unitPriceKey = Object.keys(row).find(key => key.trim() === 'Unit Price');
          const currencyKey = Object.keys(row).find(key => key.trim() === 'Currency');
          const amountKey = Object.keys(row).find(key => key.trim() === 'Amount');
          const invoiceDetailsNoKey = Object.keys(row).find(key => key.trim() === 'Invoice Details No');

          // Xác định unit_id
          let unitId = null;
          const unitName = unitKey ? row[unitKey] : null;
          if (unitName) {
            unitId = unitMapping.get(unitName.toLowerCase());
          }

          // Xác định pricing_type_id
          let pricingTypeId = null;
          const fixedPriceValue = fixedPriceKey ? row[fixedPriceKey] : null;
          if (fixedPriceValue) {
            pricingTypeId = pricingTypeMapping.get(fixedPriceValue.toLowerCase());
          }

          // Xác định is_fixed_price
          const isFixedPrice = !!fixedPriceValue;

          // Chuẩn bị mô tả an toàn cho CSV
          let safeDescription = 'No description';
          if (descriptionKey && row[descriptionKey]) {
            // Giữ nguyên các ký tự tiếng Việt, chỉ thay thế các ký tự đặc biệt
            safeDescription = row[descriptionKey]
              .replace(/,/g, ' ')
              .replace(/"/g, ' ')
              .replace(/'/g, ' ')
              .replace(/\n/g, ' ')
              .replace(/\r/g, ' ')
              .replace(/\t/g, ' ');
          }

          // Xác định currency
          let currency = 'VND';
          if (currencyKey && row[currencyKey]) {
            const currencyValue = row[currencyKey].trim().toUpperCase();
            if (currencyValue === 'USD') {
              currency = 'USD';
            }
          }

          // Tạo ID mới cho chi tiết hóa đơn
          const detailId = uuidv4();

          // Chuẩn bị dữ liệu cho CSV
          const quantity = quantityKey && row[quantityKey] ? parseFloat(row[quantityKey].replace(/[^0-9.]/g, '')) || 1 : 1;
          const fixedPrice = isFixedPrice && unitPriceKey && row[unitPriceKey] ? parseFloat(row[unitPriceKey].replace(/[^0-9.]/g, '')) || 0 : 0;
          const unitPrice = !isFixedPrice && unitPriceKey && row[unitPriceKey] ? parseFloat(row[unitPriceKey].replace(/[^0-9.]/g, '')) || 0 : 0;
          const amount = amountKey && row[amountKey] ? parseFloat(row[amountKey].replace(/[^0-9.]/g, '')) || 0 : 0;
          const sequence = invoiceDetailsNoKey && row[invoiceDetailsNoKey] ? parseInt(row[invoiceDetailsNoKey].replace(/[^0-9]/g, '')) || i + 1 : i + 1;

          // Thêm dòng vào file CSV chi tiết hóa đơn
          detailsCsvStream.write(`${detailId},${invoiceId},"${safeDescription}",${quantity},${unitId || ''},${isFixedPrice},${isFixedPrice ? fixedPrice : ''},${!isFixedPrice ? unitPrice : ''},${currency},${amount},${sequence},${pricingTypeId || ''},${now},${now}\n`);
        }
      } catch (error) {
        logStream.write(`Error processing invoice ${invoiceNo}: ${error.message}\n`);
        errorCount++;
      }
    }

    // Đóng các file CSV
    invoicesCsvStream.end();
    detailsCsvStream.end();

    // Đợi các file CSV được ghi xong
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Sao chép các file CSV vào container Docker
    execSync(`docker cp ${invoicesCsvPath} supabase-db:/tmp/invoices.csv`);
    execSync(`docker cp ${detailsCsvPath} supabase-db:/tmp/invoice-details.csv`);

    // Import dữ liệu từ file CSV vào cơ sở dữ liệu với encoding UTF-8
    console.log('Importing invoices...');
    execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "\\COPY invoices(id, invoice_number, invoice_date, client_id, reference, vat_percentage, vat_amount, order_id, status, total_amount_with_vat, created_at, updated_at) FROM '/tmp/invoices.csv' WITH CSV HEADER DELIMITER ',' ENCODING 'UTF8';"`);

    console.log('Importing invoice details...');
    execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "\\COPY invoice_details(id, invoice_id, description, quantity, unit_id, is_fixed_price, fixed_price, unit_price, currency, amount, sequence, pricing_type_id, created_at, updated_at) FROM '/tmp/invoice-details.csv' WITH CSV HEADER DELIMITER ',' ENCODING 'UTF8';"`);

    // Xóa các file tạm
    fs.unlinkSync(invoicesCsvPath);
    fs.unlinkSync(detailsCsvPath);

    // Tổng kết
    const summary = `
Import completed:
- Imported: ${importedCount} invoices
- Skipped (already exist): ${existingInvoices.size} invoices
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
