// create-client-mapping.js
require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { execSync } = require('child_process');
const { createObjectCsvWriter } = require('csv-writer');

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

// Hàm tính độ tương đồng giữa hai chuỗi (sử dụng thuật toán Levenshtein distance)
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  // Chuẩn hóa chuỗi
  str1 = str1.toLowerCase().trim();
  str2 = str2.toLowerCase().trim();

  if (str1 === str2) return 1.0;

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

// Hàm chính
async function main() {
  try {
    // Kiểm tra đường dẫn file
    const csvFilePath = process.argv[2];
    const outputFilePath = process.argv[3] || path.join(__dirname, 'client-mapping.csv');

    if (!csvFilePath) {
      console.error('Usage: node create-client-mapping.js <invoices-csv-path> [output-csv-path]');
      console.error('Example: node create-client-mapping.js "AG INVOICEFN.csv" "client-mapping.csv"');
      process.exit(1);
    }

    console.log(`Reading CSV file: ${csvFilePath}`);
    const invoiceData = await readCSV(csvFilePath);
    console.log(`Read ${invoiceData.length} rows from CSV.`);

    // Lấy danh sách khách hàng hiện có
    console.log('Loading existing clients...');
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
            clients.set(name.toLowerCase(), { id, name });
          }
        }
      });

      console.log(`Loaded ${clients.size} clients.`);
    } catch (error) {
      console.error('Error loading clients:', error.message);
    }

    // Lấy danh sách tên khách hàng từ file CSV
    const csvClientNames = new Set();
    invoiceData.forEach(row => {
      const clientIdKey = Object.keys(row).find(key => key.trim() === 'Client ID');
      if (clientIdKey && row[clientIdKey]) {
        csvClientNames.add(row[clientIdKey].trim());
      }
    });

    console.log(`Found ${csvClientNames.size} unique client names in CSV.`);

    // Tạo mapping
    const mapping = [];
    const threshold = 0.7; // Ngưỡng tương đồng (70%)

    for (const csvClientName of csvClientNames) {
      // Tìm kiếm khách hàng chính xác
      const exactMatch = clients.get(csvClientName.toLowerCase());
      if (exactMatch) {
        mapping.push({
          old_client_name: csvClientName,
          new_client_id: exactMatch.id,
          new_client_name: exactMatch.name,
          similarity: 1.0,
          source: 'exact_match'
        });
        continue;
      }

      // Tìm kiếm khách hàng tương tự
      let bestMatch = null;
      let bestSimilarity = 0;

      for (const [dbClientNameLower, dbClient] of clients.entries()) {
        // Tính độ tương đồng giữa tên khách hàng trong CSV và tên trong DB
        const similarity = calculateSimilarity(csvClientName.toLowerCase(), dbClientNameLower);

        if (similarity > threshold && similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = dbClient;
        }
      }

      if (bestMatch) {
        mapping.push({
          old_client_name: csvClientName,
          new_client_id: bestMatch.id,
          new_client_name: bestMatch.name,
          similarity: bestSimilarity,
          source: 'similar_match'
        });
      } else {
        mapping.push({
          old_client_name: csvClientName,
          new_client_id: '',
          new_client_name: '',
          similarity: 0,
          source: 'no_match'
        });
      }
    }

    // Ghi file mapping
    const csvWriter = createObjectCsvWriter({
      path: outputFilePath,
      header: [
        { id: 'old_client_name', title: 'old_client_name' },
        { id: 'new_client_id', title: 'new_client_id' },
        { id: 'new_client_name', title: 'new_client_name' },
        { id: 'similarity', title: 'similarity' },
        { id: 'source', title: 'source' }
      ]
    });

    await csvWriter.writeRecords(mapping);
    console.log(`Mapping saved to ${outputFilePath}`);

    // Thống kê
    const exactMatches = mapping.filter(m => m.source === 'exact_match').length;
    const similarMatches = mapping.filter(m => m.source === 'similar_match').length;
    const noMatches = mapping.filter(m => m.source === 'no_match').length;

    console.log(`Statistics:`);
    console.log(`- Exact matches: ${exactMatches} (${(exactMatches / mapping.length * 100).toFixed(2)}%)`);
    console.log(`- Similar matches: ${similarMatches} (${(similarMatches / mapping.length * 100).toFixed(2)}%)`);
    console.log(`- No matches: ${noMatches} (${(noMatches / mapping.length * 100).toFixed(2)}%)`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Chạy hàm chính
main();
