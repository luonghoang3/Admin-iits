// run-standardize-units.js
// Script để chạy file SQL chuẩn hóa bảng Units
// Tác giả: Admin IITS
// Ngày tạo: 2023-11-15

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Hàm thực thi SQL từ file
function executeSqlFile(filePath) {
  try {
    console.log(`Executing SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Tạo file tạm thời để chứa SQL
    const tempFilePath = path.join(__dirname, 'temp-sql.sql');
    fs.writeFileSync(tempFilePath, sql);
    
    // Thực thi SQL bằng Docker
    const result = execSync(`docker exec -i supabase-db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/temp-sql.sql`, {
      stdio: 'inherit'
    });
    
    // Xóa file tạm thời
    fs.unlinkSync(tempFilePath);
    
    console.log('SQL execution completed successfully.');
    return true;
  } catch (error) {
    console.error('Error executing SQL file:', error.message);
    return false;
  }
}

// Hàm chính
async function main() {
  try {
    // Đường dẫn file SQL
    const sqlFilePath = path.join(__dirname, 'standardize-units.sql');
    
    // Kiểm tra file tồn tại
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`SQL file not found: ${sqlFilePath}`);
      process.exit(1);
    }
    
    // Tạo bản sao lưu bảng units trước khi chuẩn hóa
    console.log('Creating backup of units table...');
    const backupSql = `
      CREATE TABLE IF NOT EXISTS units_backup AS
      SELECT * FROM units;
    `;
    
    const backupFilePath = path.join(__dirname, 'backup-units.sql');
    fs.writeFileSync(backupFilePath, backupSql);
    
    execSync(`docker exec -i supabase-db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/backup-units.sql`, {
      stdio: 'inherit'
    });
    
    fs.unlinkSync(backupFilePath);
    console.log('Backup created successfully.');
    
    // Thực thi file SQL chuẩn hóa
    const success = executeSqlFile(sqlFilePath);
    
    if (success) {
      console.log('Units standardization completed successfully.');
      
      // Tạo file log
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logPath = path.join(__dirname, `standardize-units-${timestamp}.log`);
      
      // Lấy số lượng đơn vị trước và sau khi chuẩn hóa
      const countBeforeSql = `SELECT COUNT(*) FROM units_backup;`;
      const countAfterSql = `SELECT COUNT(*) FROM units;`;
      
      const countBeforeFilePath = path.join(__dirname, 'count-before.sql');
      const countAfterFilePath = path.join(__dirname, 'count-after.sql');
      
      fs.writeFileSync(countBeforeFilePath, countBeforeSql);
      fs.writeFileSync(countAfterFilePath, countAfterSql);
      
      const countBefore = execSync(`docker exec -i supabase-db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/count-before.sql -t -A`).toString().trim();
      const countAfter = execSync(`docker exec -i supabase-db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/count-after.sql -t -A`).toString().trim();
      
      fs.unlinkSync(countBeforeFilePath);
      fs.unlinkSync(countAfterFilePath);
      
      // Ghi log
      const logContent = `
Standardization of Units table completed at ${new Date().toISOString()}
--------------------------------------------------------------
Number of units before standardization: ${countBefore}
Number of units after standardization: ${countAfter}
Number of units removed: ${countBefore - countAfter}
Percentage reduction: ${((countBefore - countAfter) / countBefore * 100).toFixed(2)}%
--------------------------------------------------------------
SQL file used: ${sqlFilePath}
Backup table: units_backup
      `;
      
      fs.writeFileSync(logPath, logContent);
      console.log(`Log saved to: ${logPath}`);
      console.log(logContent);
    } else {
      console.error('Units standardization failed.');
    }
  } catch (error) {
    console.error('Error during standardization process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
