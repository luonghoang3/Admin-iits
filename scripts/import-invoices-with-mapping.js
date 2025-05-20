// import-invoices-with-mapping.js
// Script toàn diện để import hóa đơn từ file CSV, với mapping chính xác cho pricing_type
require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// Hàm tính độ tương đồng giữa hai chuỗi (sử dụng thuật toán Levenshtein distance)
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  // Tính Levenshtein distance
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }

  const distance = track[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);

  // Trả về độ tương đồng (1 - distance/maxLength)
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

// Mapping cho pricing_type
const PRICING_TYPE_MAPPING = {
  // Tiếng Việt
  'phí tối thiểu': 'Mincharge',
  'phí cố định': 'At cost',
  'phí trọn gói': 'Lumpsum',
  'tiêu chuẩn': 'Standard',

  // Tiếng Anh
  'mincharge': 'Mincharge',
  'at cost': 'At cost',
  'lumpsum': 'Lumpsum',
  'standard': 'Standard',

  // Các biến thể khác
  'min charge': 'Mincharge',
  'minimum charge': 'Mincharge',
  'minimum fee': 'Mincharge',
  'fixed fee': 'At cost',
  'fixed price': 'At cost',
  'lump sum': 'Lumpsum',
  'trọn gói': 'Lumpsum',
  'tối thiểu': 'Mincharge',
  'cố định': 'At cost'
};

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

// Hàm xác định pricing_type từ text
function determinePricingType(text) {
  if (!text) return 'Standard';

  const lowerText = text.toLowerCase().trim();

  // Kiểm tra trong mapping
  for (const [key, value] of Object.entries(PRICING_TYPE_MAPPING)) {
    if (lowerText.includes(key)) {
      return value;
    }
  }

  // Nếu không tìm thấy, trả về Standard
  return 'Standard';
}

// Hàm xác định giá trị fixed_price dựa trên pricing_type
function determineFixedPrice(pricingType, csvFixedPrice, csvAmount) {
  if (csvFixedPrice && !isNaN(parseFloat(csvFixedPrice)) && parseFloat(csvFixedPrice) > 0) {
    return parseFloat(csvFixedPrice);
  }

  if (csvAmount && !isNaN(parseFloat(csvAmount)) && parseFloat(csvAmount) > 0) {
    return parseFloat(csvAmount);
  }

  if (pricingType) {
    switch (pricingType) {
      case 'Mincharge':
        return 300.00;
      case 'Lumpsum':
        return 100.00;
      case 'At cost':
        return 50.00;
      default:
        return 100.00;
    }
  }

  return 100.00;
}

// Hàm chính
async function main() {
  try {
    // Kiểm tra đường dẫn file
    const csvFilePath = process.argv[2];
    const teamCode = process.argv[3] || 'MR'; // Mặc định là MR nếu không có
    const deleteExisting = process.argv[4] === 'true'; // Xóa dữ liệu cũ nếu tham số = true

    // Danh sách hóa đơn không được import
    const notImportedInvoices = [];

    if (!csvFilePath) {
      console.error('Usage: node import-invoices-with-mapping.js <invoices-csv-path> [team-code] [delete-existing]');
      console.error('Example: node import-invoices-with-mapping.js "MR INVOICE.csv" MR true');
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
          }
        }
      });

      console.log(`Loaded ${existingUnits.size} existing units.`);
      logStream.write(`Loaded ${existingUnits.size} existing units.\n`);
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

    // Tải file mapping client nếu có
    const clientMappingPath = process.argv[4];
    const clientMapping = new Map();

    if (clientMappingPath) {
      try {
        console.log(`Loading client mapping from: ${clientMappingPath}`);
        logStream.write(`Loading client mapping from: ${clientMappingPath}\n`);

        const mappingData = fs.readFileSync(clientMappingPath, 'utf8');
        const mappingRows = mappingData.split('\n');

        // Bỏ qua header
        for (let i = 1; i < mappingRows.length; i++) {
          const row = mappingRows[i];
          if (!row.trim()) continue;

          // Xử lý CSV đơn giản (không xử lý trường hợp có dấu phẩy trong chuỗi được bao bởi dấu ngoặc kép)
          const parts = row.split(',');
          if (parts.length >= 2) {
            const oldClientName = parts[0].replace(/^"|"$/g, '').trim();
            const newClientId = parts[1].replace(/^"|"$/g, '').trim();

            if (oldClientName && newClientId) {
              clientMapping.set(oldClientName.toLowerCase(), newClientId);
            }
          }
        }

        console.log(`Loaded ${clientMapping.size} client mappings.`);
        logStream.write(`Loaded ${clientMapping.size} client mappings.\n`);
      } catch (error) {
        console.error('Error loading client mapping:', error.message);
        logStream.write(`Error loading client mapping: ${error.message}\n`);
      }
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

          // Thêm vào danh sách hóa đơn không được import
          notImportedInvoices.push({
            invoiceNo,
            reason: `Not matching team code ${teamCode}`
          });

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

          // Kiểm tra trong file mapping trước
          if (clientMappingPath && clientMapping.has(clientName.toLowerCase())) {
            clientId = clientMapping.get(clientName.toLowerCase());
            logStream.write(`Client "${clientName}" found in mapping file for invoice ${invoiceNo}.\n`);
          } else {
            // Nếu không có trong mapping, tìm trong database
            clientId = clients.get(clientName.toLowerCase());

            if (!clientId) {
              // Tìm kiếm khách hàng với tên tương tự
              let bestMatch = null;
              let bestSimilarity = 0;
              const threshold = 0.7; // Ngưỡng tương đồng (70%)

              for (const [dbClientName, dbClientId] of clients.entries()) {
                // Tính độ tương đồng giữa tên khách hàng trong CSV và tên trong DB
                const similarity = calculateSimilarity(clientName.toLowerCase(), dbClientName);

                if (similarity > threshold && similarity > bestSimilarity) {
                  bestSimilarity = similarity;
                  bestMatch = { name: dbClientName, id: dbClientId };
                }
              }

              if (bestMatch) {
                clientId = bestMatch.id;
                logStream.write(`Client "${clientName}" not found exactly, using similar client "${bestMatch.name}" (similarity: ${bestSimilarity.toFixed(2)}) for invoice ${invoiceNo}.\n`);
              } else {
                logStream.write(`Client "${clientName}" not found for invoice ${invoiceNo}. Using default client.\n`);
                // Sử dụng client mặc định nếu không tìm thấy
                clientId = clients.get('default client');
              }
            }
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
            '${invoiceId}', '${invoiceNo}', '${invoiceDate}', '${clientId}',
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

          // Kiểm tra xem record có chỉ chứa mô tả và các mục khác đều rỗng không
          // Hoặc mô tả bắt đầu bằng dấu ngoặc đơn "(" và kết thúc bằng dấu ngoặc đơn ")" (mô tả tiếng Anh)
          const hasOnlyDescription = (descriptionKey && row[descriptionKey] && row[descriptionKey].trim() !== '' &&
            (!quantityKey || !row[quantityKey] || row[quantityKey].trim() === '') &&
            (!unitKey || !row[unitKey] || row[unitKey].trim() === '') &&
            (!fixedPriceKey || !row[fixedPriceKey] || row[fixedPriceKey].trim() === '') &&
            (!unitPriceKey || !row[unitPriceKey] || row[unitPriceKey].trim() === '') &&
            (!amountKey || !row[amountKey] || row[amountKey].trim() === '')) ||
            (descriptionKey && row[descriptionKey] && row[descriptionKey].trim().startsWith('(') && row[descriptionKey].trim().endsWith(')'));

          // Xử lý số lượng
          let quantity = null;
          if (hasOnlyDescription) {
            // Nếu chỉ có mô tả, để quantity = null
            quantity = null;
          } else if (quantityKey && row[quantityKey] && !isNaN(parseFloat(row[quantityKey]))) {
            // Nếu có giá trị số lượng trong CSV, sử dụng giá trị đó
            quantity = parseFloat(row[quantityKey]);
          } else {
            // Nếu không có giá trị số lượng trong CSV và không phải trường hợp chỉ có mô tả, đặt mặc định là 1
            quantity = 1.0;
          }

          // Xử lý đơn vị tính
          let unitId = null;
          let unitName = null;
          if (unitKey && row[unitKey]) {
            unitName = row[unitKey].trim();

            // Nếu đơn vị tính là rỗng hoặc chỉ chứa khoảng trắng, để unitId = null
            if (unitName === '') {
              unitId = null;
            } else {
              unitId = existingUnits.get(unitName.toLowerCase());

              if (!unitId) {
                // Tạo đơn vị tính mới nếu cần
                unitId = await createUnit(unitName);
                if (unitId) {
                  existingUnits.set(unitName.toLowerCase(), unitId);
                }
              }
            }
          }

          // Biến hasOnlyDescription đã được khai báo ở trên

          // Xác định pricing_type và fixed_price
          let isFixedPrice = false;
          let fixedPrice = null;
          let unitPrice = null;
          let pricingTypeId = null;
          let pricingTypeName = null;

          if (hasOnlyDescription) {
            // Nếu chỉ có mô tả, để các mục khác rỗng
            isFixedPrice = true; // Mặc định là fixed_price để tránh lỗi check_price_type
            fixedPrice = 0; // Giá = 0
            pricingTypeName = null; // Không gán pricing_type
            pricingTypeId = null; // Không gán pricing_type_id
          } else if (fixedPriceKey && row[fixedPriceKey] && row[fixedPriceKey].trim() !== '') {
            // Nếu có fixed_price, đây là fixed_price
            isFixedPrice = true;

            // Xác định pricing_type từ fixed_price hoặc unit
            if (isNaN(parseFloat(row[fixedPriceKey]))) {
              // Nếu fixed_price không phải là số, đó là tên của pricing_type
              pricingTypeName = determinePricingType(row[fixedPriceKey]);
            } else {
              // Nếu fixed_price là số, xác định pricing_type từ unit
              pricingTypeName = determinePricingType(unitName);
            }

            // Tìm pricing_type_id
            const pricingType = pricingTypes.get(pricingTypeName.toLowerCase());
            if (pricingType) {
              pricingTypeId = pricingType.id;
            }

            // Xác định giá trị fixed_price
            fixedPrice = determineFixedPrice(pricingTypeName, row[fixedPriceKey], row[amountKey]);
          } else if (unitPriceKey && row[unitPriceKey] && row[unitPriceKey].trim() !== '') {
            // Nếu có unit_price, đây không phải fixed_price
            isFixedPrice = false;
            unitPrice = parseFloat(row[unitPriceKey]) || 0;
          } else {
            // Nếu không có fixed_price và unit_price, mặc định là fixed_price
            isFixedPrice = true;

            // Xác định pricing_type từ unit
            pricingTypeName = determinePricingType(unitName);

            // Tìm pricing_type_id
            const pricingType = pricingTypes.get(pricingTypeName.toLowerCase());
            if (pricingType) {
              pricingTypeId = pricingType.id;
            }

            // Xác định giá trị fixed_price
            fixedPrice = determineFixedPrice(pricingTypeName, null, row[amountKey]);
          }

          // Xử lý tiền tệ
          let currency = 'USD';
          if (currencyKey && row[currencyKey]) {
            currency = row[currencyKey].trim() || 'USD';
          }

          // Xử lý số tiền
          let amount = 0;

          // Nếu chỉ có mô tả, để amount = 0
          if (hasOnlyDescription) {
            amount = 0;
          } else if (amountKey && row[amountKey] && !isNaN(parseFloat(row[amountKey]))) {
            amount = parseFloat(row[amountKey]);
          } else if (isFixedPrice && fixedPrice) {
            // Nếu là giá cố định và có giá trị fixed_price, sử dụng giá trị đó làm amount
            amount = fixedPrice;
          } else if (!isFixedPrice && unitPrice) {
            // Nếu không phải giá cố định và có unit_price, tính amount = quantity * unit_price
            // Nếu quantity là null, sử dụng giá trị 1 để tính amount
            amount = (quantity !== null ? quantity : 1) * unitPrice;
          }

          // Nếu amount vẫn bằng 0 sau khi xử lý và không phải trường hợp chỉ có mô tả,
          // kiểm tra xem có nên sử dụng giá mặc định không
          if (amount === 0 && isFixedPrice && pricingTypeName && !hasOnlyDescription) {
            // Nếu trong CSV có giá trị amount = 0 rõ ràng, giữ nguyên giá trị 0
            const hasExplicitZeroAmount = amountKey && row[amountKey] && parseFloat(row[amountKey]) === 0;

            if (!hasExplicitZeroAmount) {
              // Nếu không có giá trị amount = 0 rõ ràng, sử dụng giá mặc định theo pricing_type
              switch (pricingTypeName.toLowerCase()) {
                case 'mincharge':
                  amount = 300.00;
                  break;
                case 'lumpsum':
                  amount = 100.00;
                  break;
                case 'at cost':
                  amount = 50.00;
                  break;
                case 'standard':
                  amount = 100.00;
                  break;
                default:
                  amount = 100.00;
              }
            }
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
              '${detailId}', '${invoiceId}', '${description.replace(/'/g, "''")}', ${quantity !== null ? quantity : 'NULL'},
              ${unitId ? `'${unitId}'` : 'NULL'}, ${isFixedPrice},
              ${isFixedPrice ? fixedPrice : '0'}, ${!isFixedPrice ? unitPrice : '0'}, '${currency}', ${amount}, ${sequence},
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

        // Thêm vào danh sách hóa đơn không được import
        notImportedInvoices.push({
          invoiceNo,
          reason: error.message
        });
      }
    }

    // Tổng kết
    const summary = `
Import completed:
- Imported: ${importedInvoiceCount} invoices
- Imported: ${importedDetailCount} invoice details
- Errors: ${errorCount}
- Full log saved to: ${logPath}
    `;

    logStream.write(summary);
    logStream.end();

    console.log(summary);

    // Báo cáo các hóa đơn chưa được import
    if (notImportedInvoices.length > 0) {
      console.log(`\nInvoices not imported (${notImportedInvoices.length}):`);
      notImportedInvoices.forEach(invoice => {
        console.log(`- ${invoice.invoiceNo}: ${invoice.reason}`);
      });

      // Ghi danh sách hóa đơn chưa được import vào file
      const notImportedFilePath = path.join(__dirname, 'logs', `not-imported-invoices-${timestamp}.csv`);
      const notImportedStream = fs.createWriteStream(notImportedFilePath);
      notImportedStream.write('invoice_number,reason\n');
      notImportedInvoices.forEach(invoice => {
        notImportedStream.write(`"${invoice.invoiceNo}","${invoice.reason.replace(/"/g, '""')}"\n`);
      });
      notImportedStream.end();

      console.log(`- List of not imported invoices saved to: ${notImportedFilePath}`);
    } else {
      console.log(`\nAll invoices were imported successfully.`);
    }
  } catch (error) {
    console.error('Error during import process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
