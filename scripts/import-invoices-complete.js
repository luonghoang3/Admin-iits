// import-invoices-complete.js
// Script toàn diện để import hóa đơn từ file CSV, xử lý đúng đơn vị tính và giá cố định
require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

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
    console.log(`Executing SQL: ${sql.substring(0, 100)}...`);
    const result = execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "${sql.replace(/"/g, '\\"')}" -t -A`).toString();
    return result.trim();
  } catch (error) {
    console.error('Error executing SQL:', error.message);
    return '';
  }
}

// Hàm tạo đơn vị tính mới
async function createUnit(unitName) {
  if (!unitName) return null;

  try {
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
      console.log(`Created new unit: ${unitName} (${unitId})`);
      return unitId;
    }
  } catch (error) {
    console.error(`Failed to create unit: ${unitName}`, error);
  }

  return null;
}

// Hàm tạo pricing_type mới
async function createPricingType(name, code, description) {
  if (!name || !code) return null;

  try {
    // Tạo ID mới cho pricing_type
    const pricingTypeId = uuidv4();

    // Thêm pricing_type mới vào cơ sở dữ liệu
    const insertSql = `
      INSERT INTO pricing_types (id, name, code, description, is_active, created_at, updated_at)
      VALUES ('${pricingTypeId}', '${name.replace(/'/g, "''")}', '${code.replace(/'/g, "''")}', '${(description || '').replace(/'/g, "''")}', true, NOW(), NOW())
      RETURNING id;
    `;

    const result = executeSql(insertSql);

    if (result) {
      console.log(`Created new pricing_type: ${name} (${pricingTypeId})`);
      return pricingTypeId;
    }
  } catch (error) {
    console.error(`Failed to create pricing_type: ${name}`, error);
  }

  return null;
}

// Hàm xác định pricing_type dựa trên đơn vị tính hoặc fixed price
function determinePricingType(unitName, fixedPriceValue) {
  if (!unitName && !fixedPriceValue) return null;

  // Nếu có unitName, kiểm tra unitName trước
  if (unitName) {
    const lowerUnitName = unitName.toLowerCase();

    if (lowerUnitName.includes('mincharge') || lowerUnitName.includes('phí tối thiểu')) {
      return 'Mincharge';
    } else if (lowerUnitName.includes('lumpsum') || lowerUnitName.includes('phí trọn gói')) {
      return 'Lumpsum';
    } else if (lowerUnitName.includes('at cost') || lowerUnitName.includes('phí cố định')) {
      return 'At cost';
    }
  }

  // Nếu có fixedPriceValue, kiểm tra fixedPriceValue
  if (fixedPriceValue) {
    const lowerFixedPrice = fixedPriceValue.toLowerCase();

    if (lowerFixedPrice.includes('mincharge') || lowerFixedPrice.includes('phí tối thiểu')) {
      return 'Mincharge';
    } else if (lowerFixedPrice.includes('lumpsum') || lowerFixedPrice.includes('phí trọn gói')) {
      return 'Lumpsum';
    } else if (lowerFixedPrice.includes('at cost') || lowerFixedPrice.includes('phí cố định')) {
      return 'At cost';
    } else if (lowerFixedPrice.includes('standard')) {
      return 'Standard';
    }
  }

  // Mặc định nếu không xác định được
  return 'Standard';
}

// Hàm xác định giá trị fixed_price dựa trên pricing_type
function determineFixedPrice(pricingType, csvFixedPrice, csvAmount) {
  if (csvFixedPrice && parseFloat(csvFixedPrice) > 0) {
    return parseFloat(csvFixedPrice);
  }

  if (csvAmount && parseFloat(csvAmount) > 0) {
    return parseFloat(csvAmount);
  }

  if (pricingType) {
    switch (pricingType.toLowerCase()) {
      case 'mincharge':
        return 300.00;
      case 'lumpsum':
        return 100.00;
      case 'at_cost':
        return 50.00;
      default:
        return 100.00;
    }
  }

  return 0.00;
}

// Hàm chính
async function main() {
  try {
    // Kiểm tra đường dẫn file
    const csvFilePath = process.argv[2];
    const teamCode = process.argv[3] || 'MR'; // Mặc định là MR nếu không có
    const deleteExisting = process.argv[4] === 'true'; // Xóa dữ liệu cũ nếu tham số = true

    if (!csvFilePath) {
      console.error('Usage: node import-invoices-complete.js <invoices-csv-path> [team-code] [delete-existing]');
      console.error('Example: node import-invoices-complete.js "MR INVOICE.csv" MR true');
      process.exit(1);
    }

    // Tạo thư mục logs nếu chưa tồn tại
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    // Tạo file log
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = path.join(logsDir, `import-invoices-${timestamp}.log`);
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });

    console.log(`Reading CSV file: ${csvFilePath}`);
    const invoiceData = await readCSV(csvFilePath);
    console.log(`Read ${invoiceData.length} rows from CSV.`);
    logStream.write(`Read ${invoiceData.length} rows from CSV.\n`);

    // Xóa dữ liệu cũ nếu cần
    if (deleteExisting) {
      console.log(`Deleting existing invoices for team ${teamCode}...`);
      logStream.write(`Deleting existing invoices for team ${teamCode}...\n`);

      try {
        // Lấy danh sách ID hóa đơn cần xóa
        const invoiceIdsSql = `
          SELECT id FROM invoices
          WHERE invoice_number LIKE '${teamCode}%';
        `;
        const invoiceIdsResult = executeSql(invoiceIdsSql);
        const invoiceIds = invoiceIdsResult.split('\n').filter(id => id.trim());

        if (invoiceIds.length > 0) {
          // Xóa chi tiết hóa đơn
          const deleteDetailsSql = `
            DELETE FROM invoice_details
            WHERE invoice_id IN ('${invoiceIds.join("','")}');
          `;
          executeSql(deleteDetailsSql);

          // Xóa hóa đơn
          const deleteInvoicesSql = `
            DELETE FROM invoices
            WHERE id IN ('${invoiceIds.join("','")}');
          `;
          executeSql(deleteInvoicesSql);

          console.log(`Deleted ${invoiceIds.length} existing invoices.`);
          logStream.write(`Deleted ${invoiceIds.length} existing invoices.\n`);
        } else {
          console.log(`No existing invoices found for team ${teamCode}.`);
          logStream.write(`No existing invoices found for team ${teamCode}.\n`);
        }
      } catch (error) {
        console.error('Error deleting existing invoices:', error.message);
        logStream.write(`Error deleting existing invoices: ${error.message}\n`);
      }
    }

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
            existingUnits.set(name, id); // Thêm cả phiên bản có phân biệt chữ hoa/thường
          }
        }
      });

      console.log(`Loaded ${existingUnits.size / 2} existing units.`);
      logStream.write(`Loaded ${existingUnits.size / 2} existing units.\n`);
    } catch (error) {
      console.error('Error loading existing units:', error.message);
      logStream.write(`Error loading existing units: ${error.message}\n`);
    }

    // Lấy danh sách pricing_types hiện có
    console.log('Loading pricing types...');
    const pricingTypes = new Map();
    try {
      const sqlCommand = `SELECT id, code, name FROM pricing_types;`;
      const result = executeSql(sqlCommand);

      result.split('\n').forEach(line => {
        if (!line.trim()) return;

        const parts = line.split('|');
        if (parts.length >= 3) {
          const id = parts[0].trim();
          const code = parts[1].trim();
          const name = parts[2].trim();
          if (id && name) {
            pricingTypes.set(name.toLowerCase(), { id, code, name });
            pricingTypes.set(code.toLowerCase(), { id, code, name });
          }
        }
      });

      console.log(`Loaded ${pricingTypes.size / 2} pricing types.`);
      logStream.write(`Loaded ${pricingTypes.size / 2} pricing types.\n`);
    } catch (error) {
      console.error('Error loading pricing types:', error.message);
      logStream.write(`Error loading pricing types: ${error.message}\n`);
    }

    // Lấy danh sách khách hàng hiện có
    console.log('Loading clients...');
    const clients = new Map();
    try {
      const sqlCommand = `SELECT id, name FROM clients;`;
      const result = executeSql(sqlCommand);

      result.split('\n').forEach(line => {
        if (!line.trim()) return;

        const parts = line.split('|');
        if (parts.length >= 2) {
          const id = parts[0].trim();
          const name = parts[1].trim();
          if (id && name) {
            clients.set(name.toLowerCase(), id);
          }
        }
      });

      console.log(`Loaded ${clients.size} clients.`);
      logStream.write(`Loaded ${clients.size} clients.\n`);
    } catch (error) {
      console.error('Error loading clients:', error.message);
      logStream.write(`Error loading clients: ${error.message}\n`);
    }

    // Lấy danh sách đơn hàng hiện có
    console.log('Loading orders...');
    const orders = new Map();
    try {
      const sqlCommand = `SELECT id, order_number FROM orders;`;
      const result = executeSql(sqlCommand);

      result.split('\n').forEach(line => {
        if (!line.trim()) return;

        const parts = line.split('|');
        if (parts.length >= 2) {
          const id = parts[0].trim();
          const orderNumber = parts[1].trim();
          if (id && orderNumber) {
            orders.set(orderNumber.toLowerCase(), id);
          }
        }
      });

      console.log(`Loaded ${orders.size} orders.`);
      logStream.write(`Loaded ${orders.size} orders.\n`);
    } catch (error) {
      console.error('Error loading orders:', error.message);
      logStream.write(`Error loading orders: ${error.message}\n`);
    }

    // Tìm tất cả các đơn vị tính trong file CSV
    console.log('Analyzing units in CSV...');
    const unitCounts = new Map();

    invoiceData.forEach(row => {
      const unitKey = Object.keys(row).find(key => key.trim() === 'Unit');
      const fixedPriceKey = Object.keys(row).find(key => key.trim() === 'Fixed Price');

      if (unitKey && row[unitKey]) {
        const unitName = row[unitKey].trim();
        if (unitName) {
          unitCounts.set(unitName, (unitCounts.get(unitName) || 0) + 1);
        }
      } else if (fixedPriceKey && row[fixedPriceKey]) {
        // Nếu không có Unit nhưng có Fixed Price, sử dụng Fixed Price làm đơn vị tính
        const fixedPrice = row[fixedPriceKey].trim();
        if (fixedPrice) {
          unitCounts.set(fixedPrice, (unitCounts.get(fixedPrice) || 0) + 1);
        }
      }
    });

    console.log(`Found ${unitCounts.size} unique units in CSV.`);
    logStream.write(`Found ${unitCounts.size} unique units in CSV.\n`);

    // Tạo các đơn vị tính mới nếu cần
    console.log('Creating missing units...');
    const newUnits = new Map();

    for (const [unitName, count] of unitCounts.entries()) {
      if (!existingUnits.has(unitName) && !existingUnits.has(unitName.toLowerCase())) {
        // Tạo đơn vị tính mới
        const unitId = await createUnit(unitName);

        if (unitId) {
          newUnits.set(unitName, unitId);
          existingUnits.set(unitName, unitId);
          existingUnits.set(unitName.toLowerCase(), unitId);
          logStream.write(`Created new unit: ${unitName} (${unitId})\n`);
        }
      }
    }

    console.log(`Created ${newUnits.size} new units.`);
    logStream.write(`Created ${newUnits.size} new units.\n`);

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

    // Import hóa đơn
    console.log('Importing invoices...');
    let importedInvoiceCount = 0;
    let importedDetailCount = 0;
    let errorCount = 0;

    for (const [invoiceNo, invoiceRows] of invoiceGroups.entries()) {
      try {
        if (!invoiceNo.startsWith(teamCode)) {
          logStream.write(`Skipping invoice ${invoiceNo} - not matching team code ${teamCode}\n`);
          continue;
        }

        // Lấy thông tin hóa đơn từ dòng đầu tiên
        const firstRow = invoiceRows[0];
        const invoiceDateKey = Object.keys(firstRow).find(key => key.trim() === 'Invoice Date');
        const clientIdKey = Object.keys(firstRow).find(key => key.trim() === 'Client ID');
        const vatPercentageKey = Object.keys(firstRow).find(key => key.trim() === 'VAT %');
        const orderNoKey = Object.keys(firstRow).find(key => key.trim() === 'Order No');

        // Xử lý ngày hóa đơn
        let invoiceDate = null;
        if (invoiceDateKey && firstRow[invoiceDateKey]) {
          const dateStr = firstRow[invoiceDateKey].trim();
          invoiceDate = moment(dateStr, ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD');
        } else {
          invoiceDate = moment().format('YYYY-MM-DD');
        }

        // Xử lý khách hàng
        let clientId = null;
        if (clientIdKey && firstRow[clientIdKey]) {
          const clientName = firstRow[clientIdKey].trim();
          clientId = clients.get(clientName.toLowerCase());

          if (!clientId) {
            logStream.write(`Client "${clientName}" not found for invoice ${invoiceNo}. Using default client.\n`);
            // Sử dụng client mặc định nếu không tìm thấy
            clientId = clients.get('default client');
          }
        }

        // Nếu vẫn không tìm thấy client, lấy client đầu tiên trong danh sách
        if (!clientId) {
          const firstClientId = executeSql(`SELECT id FROM clients LIMIT 1;`);
          if (firstClientId) {
            clientId = firstClientId;
            logStream.write(`Using first client in database for invoice ${invoiceNo}.\n`);
          } else {
            logStream.write(`No clients found in database. Skipping invoice ${invoiceNo}.\n`);
            continue; // Bỏ qua hóa đơn này nếu không tìm thấy client nào
          }
        }

        // Xử lý VAT
        let vatPercentage = 10.0; // Mặc định 10%
        if (vatPercentageKey && firstRow[vatPercentageKey]) {
          const vatStr = firstRow[vatPercentageKey].trim();
          if (vatStr && !isNaN(parseFloat(vatStr))) {
            vatPercentage = parseFloat(vatStr);
          }
        }

        // Xử lý Order
        let orderId = null;
        if (orderNoKey && firstRow[orderNoKey]) {
          const orderNo = firstRow[orderNoKey].trim();
          orderId = orders.get(orderNo.toLowerCase());

          if (!orderId) {
            logStream.write(`Order "${orderNo}" not found for invoice ${invoiceNo}. Skipping order reference.\n`);
          }
        }

        // Tạo hóa đơn mới
        const invoiceId = uuidv4();
        const createInvoiceSql = `
          INSERT INTO invoices (
            id, invoice_number, invoice_date, client_id, vat_percentage,
            order_id, status, created_at, updated_at
          ) VALUES (
            '${invoiceId}', '${invoiceNo}', '${invoiceDate}', ${clientId ? `'${clientId}'` : 'NULL'},
            ${vatPercentage}, ${orderId ? `'${orderId}'` : 'NULL'}, 'draft', NOW(), NOW()
          ) RETURNING id;
        `;

        const result = executeSql(createInvoiceSql);

        if (!result) {
          throw new Error(`Failed to create invoice ${invoiceNo}`);
        }

        importedInvoiceCount++;
        logStream.write(`Created invoice ${invoiceNo} (${invoiceId})\n`);

        // Import chi tiết hóa đơn
        let totalAmount = 0;

        for (let i = 0; i < invoiceRows.length; i++) {
          const row = invoiceRows[i];
          const descriptionKey = Object.keys(row).find(key => key.trim() === 'Description');
          const quantityKey = Object.keys(row).find(key => key.trim() === 'Quantity');
          const unitKey = Object.keys(row).find(key => key.trim() === 'Unit');
          const fixedPriceKey = Object.keys(row).find(key => key.trim() === 'Fixed Price');
          const unitPriceKey = Object.keys(row).find(key => key.trim() === 'Unit Price');
          const currencyKey = Object.keys(row).find(key => key.trim() === 'Currency');
          const amountKey = Object.keys(row).find(key => key.trim() === 'Amount');
          const invoiceDetailsNoKey = Object.keys(row).find(key => key.trim() === 'Invoice Details No');

          // Xử lý mô tả
          let description = '';
          if (descriptionKey && row[descriptionKey]) {
            description = row[descriptionKey].trim();
          }

          if (!description) {
            logStream.write(`Skipping detail with empty description for invoice ${invoiceNo}\n`);
            continue;
          }

          // Xử lý số lượng
          let quantity = 1.0;
          if (quantityKey && row[quantityKey] && !isNaN(parseFloat(row[quantityKey]))) {
            quantity = parseFloat(row[quantityKey]);
          }

          // Xử lý đơn vị tính
          let unitId = null;
          let unitName = null;
          if (unitKey && row[unitKey]) {
            unitName = row[unitKey].trim();
            unitId = existingUnits.get(unitName) || existingUnits.get(unitName.toLowerCase());

            if (!unitId) {
              // Tạo đơn vị tính mới nếu cần
              unitId = await createUnit(unitName);
              if (unitId) {
                existingUnits.set(unitName, unitId);
                existingUnits.set(unitName.toLowerCase(), unitId);
              }
            }
          }

          // Xác định pricing_type
          let isFixedPrice = false;
          let fixedPrice = null;
          let unitPrice = null;
          let pricingTypeId = null;

          // Xác định loại giá (pricing_type) từ dữ liệu CSV
          let pricingTypeCode = null;

          // Kiểm tra nếu có cột pricing_type trong CSV
          const pricingTypeKey = Object.keys(row).find(key => key.trim() === 'Pricing Type');
          if (pricingTypeKey && row[pricingTypeKey] && row[pricingTypeKey].trim() !== '') {
            // Sử dụng giá trị pricing_type từ CSV
            pricingTypeCode = row[pricingTypeKey].trim();
          } else {
            // Nếu không có cột pricing_type, xác định từ unit hoặc fixed_price
            pricingTypeCode = determinePricingType(unitName, row[fixedPriceKey]);
          }

          // Xác định xem có phải là fixed_price hay không
          if (fixedPriceKey && row[fixedPriceKey] && row[fixedPriceKey].trim() !== '') {
            // Nếu có giá trị fixed_price, đây là fixed_price
            isFixedPrice = true;

            // Tìm pricing_type_id từ pricingTypeCode
            if (pricingTypeCode) {
              const pricingType = pricingTypes.get(pricingTypeCode.toLowerCase());
              if (pricingType) {
                pricingTypeId = pricingType.id;
              } else {
                // Tạo pricing_type mới nếu cần
                const newPricingTypeId = await createPricingType(
                  pricingTypeCode,
                  pricingTypeCode.toLowerCase().replace(/\s+/g, '_'),
                  `Auto-created pricing type for ${pricingTypeCode}`
                );
                if (newPricingTypeId) {
                  pricingTypeId = newPricingTypeId;
                }
              }
            }

            // Xác định giá trị fixed_price
            if (row[fixedPriceKey].trim().toLowerCase() === 'mincharge' ||
                row[fixedPriceKey].trim().toLowerCase() === 'at cost' ||
                row[fixedPriceKey].trim().toLowerCase() === 'lumpsum' ||
                row[fixedPriceKey].trim().toLowerCase() === 'phí tối thiểu') {
              // Nếu fixed_price là text (mincharge, at cost, lumpsum), sử dụng giá trị mặc định
              fixedPrice = determineFixedPrice(pricingTypeCode, null, row[amountKey]);
            } else {
              // Nếu fixed_price là số, sử dụng giá trị đó
              fixedPrice = parseFloat(row[fixedPriceKey]) || 0;
            }
          } else if (unitPriceKey && row[unitPriceKey] && row[unitPriceKey].trim() !== '') {
            // Nếu có unit_price, đây không phải fixed_price
            isFixedPrice = false;
            unitPrice = parseFloat(row[unitPriceKey]) || 0;
          } else {
            // Nếu không có fixed_price và unit_price, mặc định là fixed_price
            isFixedPrice = true;

            // Mặc định sử dụng Standard nếu không xác định được
            if (!pricingTypeCode) {
              pricingTypeCode = 'Standard';
            }

            // Tìm pricing_type_id
            const pricingType = pricingTypes.get(pricingTypeCode.toLowerCase());
            if (pricingType) {
              pricingTypeId = pricingType.id;
            } else {
              // Tạo pricing_type mới nếu cần
              const newPricingTypeId = await createPricingType(
                pricingTypeCode,
                pricingTypeCode.toLowerCase().replace(/\s+/g, '_'),
                `Auto-created pricing type for ${pricingTypeCode}`
              );
              if (newPricingTypeId) {
                pricingTypeId = newPricingTypeId;
              }
            }

            // Mặc định giá trị fixed_price = 100 nếu không có giá trị nào khác
            fixedPrice = 100.00;

            // Nếu có amount, sử dụng amount làm fixed_price
            if (amountKey && row[amountKey] && row[amountKey].trim() !== '' && !isNaN(parseFloat(row[amountKey]))) {
              fixedPrice = parseFloat(row[amountKey]) || 0;
            }
          }

          // Xử lý tiền tệ
          let currency = 'USD';
          if (currencyKey && row[currencyKey]) {
            currency = row[currencyKey].trim() || 'USD';
          }

          // Xử lý số tiền
          let amount = 0;
          if (amountKey && row[amountKey] && !isNaN(parseFloat(row[amountKey]))) {
            amount = parseFloat(row[amountKey]);
          } else if (isFixedPrice && fixedPrice) {
            amount = fixedPrice;
          } else if (!isFixedPrice && unitPrice) {
            amount = quantity * unitPrice;
          }

          // Xử lý sequence
          let sequence = i + 1;
          if (invoiceDetailsNoKey && row[invoiceDetailsNoKey] && !isNaN(parseInt(row[invoiceDetailsNoKey]))) {
            sequence = parseInt(row[invoiceDetailsNoKey]);
          }

          // Tạo chi tiết hóa đơn
          const detailId = uuidv4();
          const createDetailSql = `
            INSERT INTO invoice_details (
              id, invoice_id, description, quantity, unit_id, is_fixed_price,
              fixed_price, unit_price, currency, amount, sequence,
              pricing_type_id, created_at, updated_at
            ) VALUES (
              '${detailId}', '${invoiceId}', '${description.replace(/'/g, "''")}', ${quantity},
              ${unitId ? `'${unitId}'` : 'NULL'}, ${isFixedPrice},
              ${fixedPrice || 'NULL'}, ${unitPrice || 'NULL'}, '${currency}', ${amount}, ${sequence},
              ${pricingTypeId ? `'${pricingTypeId}'` : 'NULL'}, NOW(), NOW()
            );
          `;

          executeSql(createDetailSql);

          importedDetailCount++;
          totalAmount += amount;
          logStream.write(`Created invoice detail for invoice ${invoiceNo}, sequence ${sequence}\n`);
        }

        // Cập nhật tổng tiền cho hóa đơn
        const vatAmount = totalAmount * (vatPercentage / 100);
        const totalWithVat = totalAmount + vatAmount;

        const updateInvoiceSql = `
          UPDATE invoices
          SET vat_amount = ${vatAmount}, total_amount_with_vat = ${totalWithVat}
          WHERE id = '${invoiceId}';
        `;
        executeSql(updateInvoiceSql);

        logStream.write(`Updated totals for invoice ${invoiceNo}: total=${totalAmount}, vat=${vatAmount}, total_with_vat=${totalWithVat}\n`);
      } catch (error) {
        console.error(`Error importing invoice ${invoiceNo}:`, error.message);
        logStream.write(`Error importing invoice ${invoiceNo}: ${error.message}\n`);
        errorCount++;
      }
    }

    // Tổng kết
    const summary = `
Import completed:
- Imported: ${importedInvoiceCount} invoices
- Imported: ${importedDetailCount} invoice details
- Created: ${newUnits.size} new units
- Errors: ${errorCount}
- Full log saved to: ${logPath}
    `;

    logStream.write(summary);
    logStream.end();

    console.log(summary);
  } catch (error) {
    console.error('Error during import process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
