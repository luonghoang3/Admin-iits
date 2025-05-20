// fix-invoice-prices.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    // Tạo thư mục logs nếu chưa tồn tại
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    // Tạo file log
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = path.join(logsDir, `fix-prices-${timestamp}.log`);
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });

    // Lấy danh sách pricing_types
    console.log('Loading pricing types...');
    const pricingTypes = new Map();
    try {
      const sqlCommand = `SELECT id, name FROM pricing_types;`;
      const result = executeSql(sqlCommand);
      
      result.split('\n').forEach(line => {
        if (!line.trim()) return;
        
        const parts = line.split('|');
        if (parts.length >= 2) {
          const id = parts[0].trim();
          const name = parts[1].trim();
          if (id && name) {
            pricingTypes.set(id, name);
            pricingTypes.set(name.toLowerCase(), id);
          }
        }
      });
      
      console.log(`Loaded ${pricingTypes.size / 2} pricing types.`);
      logStream.write(`Loaded ${pricingTypes.size / 2} pricing types.\n`);
    } catch (error) {
      console.error('Error loading pricing types:', error.message);
      logStream.write(`Error loading pricing types: ${error.message}\n`);
    }

    // Lấy danh sách chi tiết hóa đơn có giá cố định
    console.log('Finding invoice details with fixed prices...');
    const fixedPriceDetails = [];
    try {
      const sqlCommand = `
        SELECT id, invoice_id, description, quantity, is_fixed_price, fixed_price, unit_price, currency, amount, pricing_type_id
        FROM invoice_details
        WHERE is_fixed_price = true;
      `;
      const result = executeSql(sqlCommand);
      
      result.split('\n').forEach(line => {
        if (!line.trim()) return;
        
        const parts = line.split('|');
        if (parts.length >= 10) {
          fixedPriceDetails.push({
            id: parts[0].trim(),
            invoice_id: parts[1].trim(),
            description: parts[2].trim(),
            quantity: parseFloat(parts[3] || '1'),
            is_fixed_price: parts[4] === 't',
            fixed_price: parseFloat(parts[5] || '0'),
            unit_price: parts[6] ? parseFloat(parts[6]) : null,
            currency: parts[7].trim(),
            amount: parseFloat(parts[8] || '0'),
            pricing_type_id: parts[9].trim()
          });
        }
      });
      
      console.log(`Found ${fixedPriceDetails.length} invoice details with fixed prices.`);
      logStream.write(`Found ${fixedPriceDetails.length} invoice details with fixed prices.\n`);
    } catch (error) {
      console.error('Error finding invoice details:', error.message);
      logStream.write(`Error finding invoice details: ${error.message}\n`);
    }

    // Cập nhật chi tiết hóa đơn
    console.log('Updating invoice details...');
    let updatedCount = 0;
    let errorCount = 0;

    for (const detail of fixedPriceDetails) {
      try {
        // Kiểm tra pricing_type_id
        const pricingTypeName = detail.pricing_type_id ? pricingTypes.get(detail.pricing_type_id) : null;
        const isLumpsum = pricingTypeName && 
                         (pricingTypeName.toLowerCase() === 'lumpsum' || 
                          pricingTypeName.toLowerCase() === 'phí trọn gói');

        // Nếu là Lumpsum, fixed_price phải bằng amount
        if (isLumpsum && detail.fixed_price !== detail.amount) {
          const updateSql = `
            UPDATE invoice_details
            SET fixed_price = ${detail.amount}
            WHERE id = '${detail.id}';
          `;
          
          executeSql(updateSql);
          
          updatedCount++;
          logStream.write(`Updated fixed_price for invoice detail ${detail.id} from ${detail.fixed_price} to ${detail.amount}\n`);
        }
        // Nếu không phải Lumpsum, amount phải bằng quantity * fixed_price
        else if (!isLumpsum && detail.is_fixed_price && detail.amount !== detail.quantity * detail.fixed_price) {
          const newAmount = detail.quantity * detail.fixed_price;
          
          const updateSql = `
            UPDATE invoice_details
            SET amount = ${newAmount}
            WHERE id = '${detail.id}';
          `;
          
          executeSql(updateSql);
          
          updatedCount++;
          logStream.write(`Updated amount for invoice detail ${detail.id} from ${detail.amount} to ${newAmount}\n`);
        }
      } catch (error) {
        logStream.write(`Error updating invoice detail ${detail.id}: ${error.message}\n`);
        errorCount++;
      }
    }

    // Tổng kết
    const summary = `
Fix completed:
- Updated: ${updatedCount} invoice details
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
