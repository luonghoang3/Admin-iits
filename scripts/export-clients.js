// export-clients.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Hàm chính
async function main() {
  try {
    // Tạo file SQL để xuất danh sách khách hàng
    const sqlFilePath = path.join(__dirname, 'export-clients.sql');
    fs.writeFileSync(sqlFilePath, `
      SELECT id, name, trade_name
      FROM clients
      ORDER BY name;
    `);

    console.log('Created SQL file:', sqlFilePath);

    // Chạy lệnh SQL và lưu kết quả vào file CSV
    const outputPath = path.join(__dirname, 'db-clients.csv');
    console.log('Executing SQL query...');
    
    try {
      // Sử dụng Docker để kết nối đến PostgreSQL và xuất dữ liệu
      execSync(`docker exec -i admin-iits-db-1 psql -U postgres -d postgres -c "\\COPY (SELECT id, name, trade_name FROM clients ORDER BY name) TO STDOUT WITH CSV HEADER" > ${outputPath}`);
      console.log(`Clients list saved to: ${outputPath}`);
    } catch (error) {
      console.error('Error executing SQL query:', error.message);
      console.log('Trying alternative method...');
      
      // Phương pháp thay thế: Sử dụng psql trực tiếp nếu có
      try {
        execSync(`psql -h localhost -U postgres -d postgres -c "\\COPY (SELECT id, name, trade_name FROM clients ORDER BY name) TO STDOUT WITH CSV HEADER" > ${outputPath}`);
        console.log(`Clients list saved to: ${outputPath}`);
      } catch (error) {
        console.error('Error with alternative method:', error.message);
        console.log('Please export clients list manually using Supabase Studio or pgAdmin.');
      }
    }
  } catch (error) {
    console.error('Error during export process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
