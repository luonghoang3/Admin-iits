// import-invoices.js
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
    const sqlCommand = `
      SELECT id, name FROM units ORDER BY name;
    `;

    const result = execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "${sqlCommand}" -t -A`).toString();

    const mapping = new Map();
    result.split('\n').forEach(line => {
      const parts = line.trim().split('|');
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

    // Trả về một số ánh xạ mặc định
    const defaultMapping = new Map();
    defaultMapping.set('ton', '00000000-0000-0000-0000-000000000001');
    defaultMapping.set('container', '00000000-0000-0000-0000-000000000002');
    defaultMapping.set('case', '00000000-0000-0000-0000-000000000003');
    defaultMapping.set('manday', '00000000-0000-0000-0000-000000000004');
    defaultMapping.set('km', '00000000-0000-0000-0000-000000000005');

    return defaultMapping;
  }
}

// Hàm tải bảng ánh xạ loại giá
async function loadPricingTypeMapping() {
  try {
    // Thực thi lệnh SQL để lấy danh sách loại giá
    const sqlCommand = `
      SELECT id, name, code FROM pricing_types ORDER BY name;
    `;

    const result = execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "${sqlCommand}" -t -A`).toString();

    const mapping = new Map();
    result.split('\n').forEach(line => {
      const parts = line.trim().split('|');
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

    // Trả về một số ánh xạ mặc định
    const defaultMapping = new Map();
    defaultMapping.set('lumpsum', '00000000-0000-0000-0000-000000000001');
    defaultMapping.set('at_cost', '00000000-0000-0000-0000-000000000002');
    defaultMapping.set('mincharge', '00000000-0000-0000-0000-000000000003');

    return defaultMapping;
  }
}

// Hàm import hóa đơn
async function importInvoices(invoiceData, clientMapping, unitMapping, pricingTypeMapping) {
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

  // Kiểm tra cấu trúc dữ liệu
  console.log('Sample data row:', JSON.stringify(invoiceData[0]));

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
  logStream.write(`Found ${invoiceGroups.size} unique invoices in CSV.\n`);

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

      // Tìm order_id nếu có
      let orderId = null;
      const orderNo = orderNoKey ? firstRow[orderNoKey] : null;
      if (orderNo) {
        try {
          const sqlCommand = `
            SELECT id FROM orders WHERE order_number = '${orderNo}' LIMIT 1;
          `;

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

      // Tạo dữ liệu hóa đơn mới
      const newInvoice = {
        invoice_number: invoiceNo,
        invoice_date: formattedInvoiceDate,
        client_id: clientId,
        reference: referenceKey ? firstRow[referenceKey] || null : null,
        vat_percentage: vatPercentageKey ? parseFloat(firstRow[vatPercentageKey] || 0) : 0,
        vat_amount: vatAmount,
        order_id: orderId,
        status: 'paid', // Giả định hóa đơn cũ đều đã thanh toán
        total_amount_with_vat: totalAmount + vatAmount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Kiểm tra xem hóa đơn đã tồn tại chưa
      try {
        const sqlCommand = `
          SELECT id, invoice_number FROM invoices WHERE invoice_number = '${invoiceNo}' LIMIT 1;
        `;

        const result = execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "${sqlCommand}" -t -A`).toString().trim();

        let invoiceId;

        if (result) {
          // Hóa đơn đã tồn tại, sử dụng ID hiện có
          invoiceId = result.split('|')[0].trim();
          logStream.write(`Invoice "${invoiceNo}" already exists with ID: ${invoiceId}\n`);

          // Cập nhật hóa đơn hiện có
          const updateCommand = `
            UPDATE invoices
            SET invoice_date = '${newInvoice.invoice_date}',
                client_id = '${newInvoice.client_id}',
                reference = ${newInvoice.reference ? `'${newInvoice.reference}'` : 'NULL'},
                vat_percentage = ${newInvoice.vat_percentage},
                vat_amount = ${newInvoice.vat_amount},
                order_id = ${newInvoice.order_id ? `'${newInvoice.order_id}'` : 'NULL'},
                status = '${newInvoice.status}',
                total_amount_with_vat = ${newInvoice.total_amount_with_vat},
                updated_at = '${newInvoice.updated_at}'
            WHERE id = '${invoiceId}';
          `;

          execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "${updateCommand}"`);
          logStream.write(`Updated invoice "${invoiceNo}"\n`);
        } else {
          // Tạo hóa đơn mới
          const insertCommand = `
            INSERT INTO invoices (
              invoice_number, invoice_date, client_id, reference, vat_percentage, vat_amount,
              order_id, status, total_amount_with_vat, created_at, updated_at
            ) VALUES (
              '${newInvoice.invoice_number}',
              '${newInvoice.invoice_date}',
              '${newInvoice.client_id}',
              ${newInvoice.reference ? `'${newInvoice.reference}'` : 'NULL'},
              ${newInvoice.vat_percentage},
              ${newInvoice.vat_amount},
              ${newInvoice.order_id ? `'${newInvoice.order_id}'` : 'NULL'},
              '${newInvoice.status}',
              ${newInvoice.total_amount_with_vat},
              '${newInvoice.created_at}',
              '${newInvoice.updated_at}'
            ) RETURNING id;
          `;

          const rawResult = execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "${insertCommand}" -t -A`).toString().trim();
          // Lấy UUID từ kết quả trả về (UUID thường có dạng xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
          const uuidMatch = rawResult.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
          invoiceId = uuidMatch ? uuidMatch[1] : null;

          if (!invoiceId) {
            throw new Error(`Failed to extract UUID from result: ${rawResult}`);
          }
          logStream.write(`Created invoice "${invoiceNo}" with ID: ${invoiceId}\n`);
          importedCount++;
        }

        // Import chi tiết hóa đơn
        await importInvoiceDetails(invoiceRows, invoiceId, unitMapping, pricingTypeMapping, logStream);
      } catch (error) {
        logStream.write(`Error processing invoice ${invoiceNo}: ${error.message}\n`);
        errorCount++;
      }
    } catch (error) {
      logStream.write(`Unexpected error processing invoice ${invoiceNo}: ${error.message}\n`);
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
}

// Hàm import chi tiết hóa đơn
async function importInvoiceDetails(invoiceRows, invoiceId, unitMapping, pricingTypeMapping, logStream) {
  let importedCount = 0;
  let errorCount = 0;

  // Xóa chi tiết hóa đơn cũ
  try {
    const deleteCommand = `
      DELETE FROM invoice_details WHERE invoice_id = '${invoiceId}';
    `;

    execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "${deleteCommand}"`);
    logStream.write(`Deleted existing details for invoice ${invoiceId}\n`);
  } catch (error) {
    logStream.write(`Error deleting existing details for invoice ${invoiceId}: ${error.message}\n`);
  }

  // Import từng dòng chi tiết
  for (const row of invoiceRows) {
    try {
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

      // Tạo dữ liệu chi tiết hóa đơn mới
      const newDetail = {
        invoice_id: invoiceId,
        description: descriptionKey && row[descriptionKey] ? row[descriptionKey].replace(/'/g, "''") : 'No description',
        quantity: quantityKey ? parseFloat(row[quantityKey] || 1) : 1,
        unit_id: unitId,
        is_fixed_price: isFixedPrice,
        fixed_price: isFixedPrice && unitPriceKey ? parseFloat(row[unitPriceKey] || 0) : null,
        unit_price: !isFixedPrice && unitPriceKey ? parseFloat(row[unitPriceKey] || 0) : null,
        currency: currencyKey && row[currencyKey] ? (row[currencyKey].toUpperCase() === 'USD' ? 'USD' : 'VND') : 'VND',
        amount: amountKey ? parseFloat(row[amountKey] || 0) : 0,
        sequence: invoiceDetailsNoKey ? parseInt(row[invoiceDetailsNoKey] || 0) : 0,
        pricing_type_id: pricingTypeId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Chèn chi tiết hóa đơn mới
      // Chuẩn bị mô tả an toàn cho SQL
      let safeDescription = 'No description';
      if (newDetail.description) {
        // Giới hạn độ dài mô tả để tránh lỗi
        safeDescription = newDetail.description.substring(0, 500);
        // Xử lý các ký tự đặc biệt
        safeDescription = safeDescription.replace(/'/g, "''").replace(/\\/g, "\\\\");
      }

      const insertCommand = `
        INSERT INTO invoice_details (
          invoice_id, description, quantity, unit_id, is_fixed_price, fixed_price,
          unit_price, currency, amount, sequence, pricing_type_id, created_at, updated_at
        ) VALUES (
          '${newDetail.invoice_id}',
          '${safeDescription}',
          ${newDetail.quantity},
          ${newDetail.unit_id ? `'${newDetail.unit_id}'` : 'NULL'},
          ${newDetail.is_fixed_price},
          ${newDetail.fixed_price !== null ? newDetail.fixed_price : 'NULL'},
          ${newDetail.unit_price !== null ? newDetail.unit_price : 'NULL'},
          '${newDetail.currency}',
          ${newDetail.amount},
          ${newDetail.sequence},
          ${newDetail.pricing_type_id ? `'${newDetail.pricing_type_id}'` : 'NULL'},
          '${newDetail.created_at}',
          '${newDetail.updated_at}'
        );
      `;

      execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "${insertCommand}"`);
      importedCount++;
    } catch (error) {
      logStream.write(`Error inserting invoice detail for invoice ${invoiceId}: ${error.message}\n`);
      errorCount++;
    }
  }

  logStream.write(`Imported ${importedCount} details for invoice ${invoiceId}, Errors: ${errorCount}\n`);
}

// Hàm chính
async function main() {
  try {
    // Kiểm tra đường dẫn file
    const csvFilePath = process.argv[2];
    const clientMappingPath = process.argv[3];

    if (!csvFilePath || !clientMappingPath) {
      console.error('Usage: node import-invoices.js <invoices-csv-path> <client-mapping-csv-path>');
      process.exit(1);
    }

    console.log(`Reading CSV file: ${csvFilePath}`);
    const invoiceData = await readCSV(csvFilePath);
    console.log(`Read ${invoiceData.length} rows from CSV.`);

    // Tải các bảng ánh xạ
    const clientMapping = await loadClientMapping(clientMappingPath);
    const unitMapping = await loadUnitMapping();
    const pricingTypeMapping = await loadPricingTypeMapping();

    // Import hóa đơn
    await importInvoices(invoiceData, clientMapping, unitMapping, pricingTypeMapping);

    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Error during import process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
