// generate-client-mapping-cg.js
// Script để tạo file mapping cho client từ file CG INVOICE.csv
require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const { execSync } = require('child_process');
const path = require('path');

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
    // Đường dẫn file CSV
    const csvFilePath = path.join(__dirname, 'CG INVOICE.csv');
    
    // Đọc dữ liệu từ file CSV
    console.log(`Reading CSV file: ${csvFilePath}`);
    const invoiceData = await readCSV(csvFilePath);
    console.log(`Read ${invoiceData.length} rows from CSV.`);

    // Lấy danh sách khách hàng từ file CSV
    const clientsFromCSV = new Set();
    const clientIdKey = Object.keys(invoiceData[0]).find(key => key.trim() === 'Client ID');
    
    invoiceData.forEach(row => {
      if (clientIdKey && row[clientIdKey] && row[clientIdKey].trim()) {
        clientsFromCSV.add(row[clientIdKey].trim());
      }
    });

    console.log(`Found ${clientsFromCSV.size} unique clients in CSV.`);

    // Lấy danh sách khách hàng từ database
    console.log('Loading clients from database...');
    const clientsFromDB = new Map();
    const sqlCommand = `SELECT id, name FROM clients;`;
    const result = executeSql(sqlCommand);

    result.split('\n').forEach(line => {
      if (!line.trim()) return;

      const parts = line.split('|');
      if (parts.length >= 2) {
        const id = parts[0].trim();
        const name = parts[1].trim();
        if (id && name) {
          clientsFromDB.set(name.toLowerCase(), { id, name });
        }
      }
    });

    console.log(`Loaded ${clientsFromDB.size} clients from database.`);

    // Tạo mapping
    const mappings = [];
    mappings.push('old_client_name,new_client_id,new_client_name,similarity,source');

    for (const csvClient of clientsFromCSV) {
      // Bỏ qua header hoặc giá trị rỗng
      if (!csvClient || csvClient === 'Client ID') continue;

      // Tìm kiếm chính xác
      const exactMatch = clientsFromDB.get(csvClient.toLowerCase());
      if (exactMatch) {
        mappings.push(`"${csvClient}",${exactMatch.id},"${exactMatch.name}",1.0,exact_match`);
        continue;
      }

      // Tìm kiếm tương đối
      let bestMatch = null;
      let bestSimilarity = 0;
      const threshold = 0.7; // Ngưỡng tương đồng (70%)

      for (const [dbClientName, dbClient] of clientsFromDB.entries()) {
        const similarity = calculateSimilarity(csvClient.toLowerCase(), dbClientName);
        if (similarity > threshold && similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = dbClient;
        }
      }

      if (bestMatch) {
        mappings.push(`"${csvClient}",${bestMatch.id},"${bestMatch.name}",${bestSimilarity.toFixed(2)},fuzzy_match`);
      } else {
        console.log(`No match found for client: ${csvClient}`);
      }
    }

    // Ghi file mapping
    const mappingFilePath = path.join(__dirname, 'client-mapping-cg-full.csv');
    fs.writeFileSync(mappingFilePath, mappings.join('\n'));
    console.log(`Client mapping saved to: ${mappingFilePath}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Chạy script
main();
