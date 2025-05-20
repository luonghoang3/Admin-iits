// export-db-clients.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Hàm chính
async function main() {
  try {
    // Tạo file JSON với danh sách khách hàng từ database
    const outputPath = path.join(__dirname, 'db-clients.json');
    
    // Danh sách khách hàng từ database (đã lấy từ execute_sql_docker)
    const dbClients = [
      // Danh sách khách hàng sẽ được thêm vào đây
    ];
    
    // Ghi danh sách khách hàng vào file JSON
    fs.writeFileSync(outputPath, JSON.stringify(dbClients, null, 2));
    
    console.log(`Database clients saved to: ${outputPath}`);
    console.log(`Found ${dbClients.length} clients in database.`);
  } catch (error) {
    console.error('Error during export process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
