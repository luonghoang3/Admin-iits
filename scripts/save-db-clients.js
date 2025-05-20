// save-db-clients.js
const fs = require('fs');
const path = require('path');

// Hàm chính
async function main() {
  try {
    // Tạo thư mục data nếu chưa tồn tại
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    // Đường dẫn file JSON
    const outputPath = path.join(dataDir, 'db-clients.json');
    
    // Danh sách khách hàng từ database (sẽ được điền thủ công)
    const dbClients = [];
    
    // Ghi danh sách khách hàng vào file JSON
    fs.writeFileSync(outputPath, JSON.stringify(dbClients, null, 2));
    
    console.log(`Database clients template saved to: ${outputPath}`);
    console.log(`Please fill in the client data manually.`);
  } catch (error) {
    console.error('Error during export process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
