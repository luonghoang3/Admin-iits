// auto-map-clients.js
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

// Hàm tính độ tương đồng giữa hai chuỗi
function similarity(s1, s2) {
  if (!s1 || !s2) return 0;

  // Chuẩn hóa chuỗi
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  // Tính độ tương đồng đơn giản dựa trên số ký tự chung
  const set1 = new Set(s1);
  const set2 = new Set(s2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

// Hàm tìm khách hàng phù hợp nhất
function findBestMatchingClient(oldClientName, dbClients, threshold = 0.6) {
  if (!oldClientName) return null;

  // Chuẩn hóa tên khách hàng cũ
  const normalizedOldName = oldClientName.toLowerCase().trim();

  // Tạo danh sách tên để so sánh
  const clientNames = [];
  dbClients.forEach(client => {
    if (client.name) {
      clientNames.push({
        name: client.name.toLowerCase().trim(),
        id: client.id,
        originalName: client.name,
        tradeName: client.trade_name,
        source: 'name'
      });
    }

    if (client.trade_name) {
      clientNames.push({
        name: client.trade_name.toLowerCase().trim(),
        id: client.id,
        originalName: client.name,
        tradeName: client.trade_name,
        source: 'trade_name'
      });
    }
  });

  // Tìm độ tương đồng
  const matches = clientNames.map(client => {
    const similarityScore = similarity(normalizedOldName, client.name);
    return {
      ...client,
      similarity: similarityScore
    };
  });

  // Sắp xếp theo độ tương đồng giảm dần
  matches.sort((a, b) => b.similarity - a.similarity);

  // Lấy kết quả tốt nhất
  const bestMatch = matches[0];

  // Kiểm tra xem có kết quả nào vượt ngưỡng không
  if (bestMatch && bestMatch.similarity >= threshold) {
    return {
      id: bestMatch.id,
      name: bestMatch.originalName,
      similarity: bestMatch.similarity
    };
  }

  return null;
}

// Hàm tải danh sách khách hàng từ database
async function loadClientsFromDatabase() {
  try {
    // Thực thi lệnh SQL để lấy danh sách khách hàng
    const sqlCommand = `
      SELECT id, name, trade_name FROM clients ORDER BY name;
    `;

    const result = execSync(`docker exec -i supabase-db psql -U postgres -d postgres -c "${sqlCommand}" -t -A`).toString();

    const clients = [];
    result.split('\n').forEach(line => {
      if (!line.trim()) return;

      const parts = line.split('|');
      if (parts.length >= 3) {
        clients.push({
          id: parts[0],
          name: parts[1],
          trade_name: parts[2] === '\\N' ? null : parts[2]
        });
      }
    });

    return clients;
  } catch (error) {
    console.error('Error loading clients from database:', error);
    return [];
  }
}

// Hàm chính
async function main() {
  try {
    // Kiểm tra đường dẫn file
    const csvFilePath = process.argv[2];
    if (!csvFilePath) {
      console.error('Usage: node auto-map-clients.js <client-mapping-csv-path>');
      process.exit(1);
    }

    console.log(`Reading CSV file: ${csvFilePath}`);
    const data = await readCSV(csvFilePath);
    console.log(`Read ${data.length} clients from CSV.`);

    // Tải danh sách khách hàng từ database
    console.log('Loading clients from database...');
    const dbClients = await loadClientsFromDatabase();
    console.log(`Loaded ${dbClients.length} clients from database.`);

    // Tìm khách hàng phù hợp nhất cho mỗi khách hàng cũ
    console.log('Finding best matching clients...');
    let matchedCount = 0;

    // Tạo file CSV ánh xạ cuối cùng
    const outputPath = path.join(path.dirname(csvFilePath), 'client-mapping-auto.csv');
    const outputStream = fs.createWriteStream(outputPath);

    // Viết header
    outputStream.write('old_client_name,new_client_id,new_client_name,similarity\n');

    // Viết ánh xạ
    data.forEach(row => {
      const oldClientName = row.old_client_name;
      const bestMatch = findBestMatchingClient(oldClientName, dbClients);

      if (bestMatch) {
        outputStream.write(`"${oldClientName}","${bestMatch.id}","${bestMatch.name}",${bestMatch.similarity}\n`);
        matchedCount++;
      } else {
        outputStream.write(`"${oldClientName}","","",0\n`);
      }
    });

    outputStream.end();

    console.log(`Automatically mapped ${matchedCount} out of ${data.length} clients.`);
    console.log(`Client mapping saved to: ${outputPath}`);
    console.log('Please review the mapping before using it for import.');
  } catch (error) {
    console.error('Error during mapping process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
