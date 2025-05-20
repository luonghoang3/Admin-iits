// fix-fixed-price-values.js
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
      console.error('Usage: node fix-fixed-price-values.js <invoices-csv-path>');
      process.exit(1);
    }

    // Tạo thư mục logs nếu chưa tồn tại
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    // Tạo file log
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = path.join(logsDir, `fix-fixed-price-${timestamp}.log`);
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });

    console.log(`Reading CSV file: ${csvFilePath}`);
    const invoiceData = await readCSV(csvFilePath);
    console.log(`Read ${invoiceData.length} rows from CSV.`);

    // Lấy danh sách các pricing_types
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

    // Lấy danh sách các chi tiết hóa đơn có giá cố định nhưng giá trị = 0
    console.log('Finding invoice details with fixed price = 0...');
    const zeroFixedPriceDetails = [];
    try {
      const sqlCommand = `
        SELECT id.id, i.invoice_number, id.description, id.quantity, id.unit_id, u.name as unit_name,
               id.is_fixed_price, id.fixed_price, id.amount, id.pricing_type_id, pt.name as pricing_type_name,
               id.sequence, i.id as invoice_id
        FROM invoice_details id
        JOIN invoices i ON id.invoice_id = i.id
        LEFT JOIN units u ON id.unit_id = u.id
        LEFT JOIN pricing_types pt ON id.pricing_type_id = pt.id
        WHERE id.is_fixed_price = true AND id.fixed_price = 0.00;
      `;
      const result = executeSql(sqlCommand);

      result.split('\n').forEach(line => {
        if (!line.trim()) return;

        const parts = line.split('|');
        if (parts.length >= 12) {
          zeroFixedPriceDetails.push({
            id: parts[0].trim(),
            invoiceNumber: parts[1].trim(),
            description: parts[2].trim(),
            quantity: parseFloat(parts[3].trim()),
            unitId: parts[4].trim(),
            unitName: parts[5].trim(),
            isFixedPrice: parts[6].trim() === 'true',
            fixedPrice: parseFloat(parts[7].trim()),
            amount: parseFloat(parts[8].trim()),
            pricingTypeId: parts[9].trim(),
            pricingTypeName: parts[10].trim(),
            sequence: parseInt(parts[11].trim()),
            invoiceId: parts[12].trim()
          });
        }
      });

      console.log(`Found ${zeroFixedPriceDetails.length} invoice details with fixed price = 0.`);
      logStream.write(`Found ${zeroFixedPriceDetails.length} invoice details with fixed price = 0.\n`);
    } catch (error) {
      console.error('Error finding invoice details:', error.message);
      logStream.write(`Error finding invoice details: ${error.message}\n`);
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

    // Cập nhật giá trị fixed_price cho các chi tiết hóa đơn
    console.log('Updating fixed price values...');
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const detail of zeroFixedPriceDetails) {
      try {
        // Tìm dữ liệu tương ứng trong CSV
        const invoiceRows = invoiceGroups.get(detail.invoiceNumber) || [];

        if (invoiceRows.length === 0) {
          logStream.write(`Invoice "${detail.invoiceNumber}" not found in CSV. Skipping.\n`);
          skippedCount++;
          continue;
        }

        // Tìm chi tiết tương ứng trong CSV
        let matchingRow = null;
        for (const row of invoiceRows) {
          const invoiceDetailsNoKey = Object.keys(row).find(key => key.trim() === 'Invoice Details No');
          const sequence = invoiceDetailsNoKey && row[invoiceDetailsNoKey] ?
                          parseInt(row[invoiceDetailsNoKey]) : 0;

          if (sequence === detail.sequence) {
            matchingRow = row;
            break;
          }
        }

        if (!matchingRow) {
          // Thử tìm theo mô tả
          for (const row of invoiceRows) {
            const descriptionKey = Object.keys(row).find(key => key.trim() === 'Description');
            if (descriptionKey && row[descriptionKey] &&
                row[descriptionKey].trim().includes(detail.description.substring(0, 30))) {
              matchingRow = row;
              break;
            }
          }
        }

        if (!matchingRow) {
          logStream.write(`Detail with sequence ${detail.sequence} not found for invoice ${detail.invoiceNumber}. Skipping.\n`);
          skippedCount++;
          continue;
        }

        // Tìm giá trị fixed_price từ CSV
        const fixedPriceKey = Object.keys(matchingRow).find(key => key.trim() === 'Fixed Price');
        const amountKey = Object.keys(matchingRow).find(key => key.trim() === 'Amount');
        const unitPriceKey = Object.keys(matchingRow).find(key => key.trim() === 'Unit Price');

        let newFixedPrice = 0;
        let newAmount = 0;

        // Nếu không tìm thấy giá trị nào, sử dụng giá trị mặc định dựa trên pricing_type
        if (detail.pricingTypeName) {
          switch (detail.pricingTypeName.toLowerCase()) {
            case 'mincharge':
              newFixedPrice = 300.00;
              break;
            case 'lumpsum':
              newFixedPrice = 100.00;
              break;
            case 'at cost':
              newFixedPrice = 50.00;
              break;
            default:
              newFixedPrice = 100.00;
          }
        } else {
          newFixedPrice = 100.00;
        }

        // Nếu có giá trị trong CSV, ưu tiên sử dụng
        if (fixedPriceKey && matchingRow[fixedPriceKey] && matchingRow[fixedPriceKey].trim() !== '') {
          // Nếu có giá trị Fixed Price trong CSV
          const csvFixedPrice = parseFloat(matchingRow[fixedPriceKey].trim()) || 0;
          if (csvFixedPrice > 0) {
            newFixedPrice = csvFixedPrice;
          }
        } else if (amountKey && matchingRow[amountKey] && matchingRow[amountKey].trim() !== '') {
          // Nếu không có Fixed Price nhưng có Amount
          const csvAmount = parseFloat(matchingRow[amountKey].trim()) || 0;
          if (csvAmount > 0) {
            newAmount = csvAmount;
            newFixedPrice = csvAmount;
          }
        } else if (unitPriceKey && matchingRow[unitPriceKey] && matchingRow[unitPriceKey].trim() !== '') {
          // Nếu không có Fixed Price và Amount nhưng có Unit Price
          const unitPrice = parseFloat(matchingRow[unitPriceKey].trim()) || 0;
          if (unitPrice > 0) {
            newFixedPrice = unitPrice;
            newAmount = unitPrice * detail.quantity;
          }
        }

        // Đảm bảo amount được cập nhật
        if (newAmount === 0) {
          newAmount = newFixedPrice;
        }

        // Cập nhật fixed_price và amount
        if (newFixedPrice > 0) {
          const updateSql = `
            UPDATE invoice_details
            SET fixed_price = ${newFixedPrice}, amount = ${newAmount}
            WHERE id = '${detail.id}';
          `;
          executeSql(updateSql);

          updatedCount++;
          logStream.write(`Updated fixed_price for invoice ${detail.invoiceNumber}, detail ${detail.sequence} from 0.00 to ${newFixedPrice}\n`);
        } else {
          skippedCount++;
          logStream.write(`Skipped update for invoice ${detail.invoiceNumber}, detail ${detail.sequence} - could not determine a valid fixed_price\n`);
        }
      } catch (error) {
        logStream.write(`Error processing invoice ${detail.invoiceNumber}, detail ${detail.sequence}: ${error.message}\n`);
        errorCount++;
      }
    }

    // Cập nhật tổng tiền cho các hóa đơn
    console.log('Updating invoice totals...');
    const updatedInvoices = new Set();

    for (const detail of zeroFixedPriceDetails) {
      if (!updatedInvoices.has(detail.invoiceId)) {
        try {
          // Tính tổng tiền mới
          const totalSql = `
            SELECT SUM(amount) as total_amount
            FROM invoice_details
            WHERE invoice_id = '${detail.invoiceId}';
          `;
          const totalResult = executeSql(totalSql);

          if (totalResult) {
            const totalAmount = parseFloat(totalResult) || 0;
            const vatPercentageSql = `
              SELECT vat_percentage FROM invoices WHERE id = '${detail.invoiceId}';
            `;
            const vatPercentageResult = executeSql(vatPercentageSql);
            const vatPercentage = parseFloat(vatPercentageResult) || 0;

            const vatAmount = totalAmount * (vatPercentage / 100);
            const totalWithVat = totalAmount + vatAmount;

            // Cập nhật hóa đơn
            const updateInvoiceSql = `
              UPDATE invoices
              SET vat_amount = ${vatAmount}, total_amount_with_vat = ${totalWithVat}
              WHERE id = '${detail.invoiceId}';
            `;
            executeSql(updateInvoiceSql);

            updatedInvoices.add(detail.invoiceId);
            logStream.write(`Updated totals for invoice ${detail.invoiceNumber}: total=${totalAmount}, vat=${vatAmount}, total_with_vat=${totalWithVat}\n`);
          }
        } catch (error) {
          logStream.write(`Error updating totals for invoice ${detail.invoiceNumber}: ${error.message}\n`);
        }
      }
    }

    // Tổng kết
    const summary = `
Fix completed:
- Updated: ${updatedCount} invoice details with fixed price
- Skipped: ${skippedCount} invoice details
- Updated totals for: ${updatedInvoices.size} invoices
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
