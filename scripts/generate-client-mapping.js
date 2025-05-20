// generate-client-mapping.js
require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

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
function findBestMatchingClient(oldClientName, dbClients, threshold = 0.5) {
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
  
  // Lấy 3 kết quả tốt nhất
  const bestMatches = matches.slice(0, 3);
  
  // Kiểm tra xem có kết quả nào vượt ngưỡng không
  const goodMatches = bestMatches.filter(match => match.similarity >= threshold);
  
  return {
    oldClientName,
    bestMatch: bestMatches[0] || null,
    isGoodMatch: goodMatches.length > 0,
    alternatives: bestMatches.slice(1)
  };
}

// Hàm chính
async function main() {
  try {
    // Kiểm tra đường dẫn file
    const csvFilePath = process.argv[2];
    const dbClientsFilePath = process.argv[3];
    
    if (!csvFilePath || !dbClientsFilePath) {
      console.error('Usage: node generate-client-mapping.js <unique-clients-csv-path> <db-clients-json-path>');
      process.exit(1);
    }

    console.log(`Reading CSV file: ${csvFilePath}`);
    const data = await readCSV(csvFilePath);
    console.log(`Read ${data.length} clients from CSV.`);

    // Đọc danh sách khách hàng từ database
    console.log(`Reading database clients from: ${dbClientsFilePath}`);
    const dbClientsJson = fs.readFileSync(dbClientsFilePath, 'utf8');
    const dbClients = JSON.parse(dbClientsJson);
    console.log(`Loaded ${dbClients.length} clients from database.`);

    // Tìm khách hàng phù hợp nhất cho mỗi khách hàng cũ
    console.log('Finding best matching clients...');
    const mappingSuggestions = [];
    
    for (const row of data) {
      const oldClientName = row.old_client_name;
      if (!oldClientName) continue;
      
      const suggestion = findBestMatchingClient(oldClientName, dbClients);
      mappingSuggestions.push(suggestion);
    }

    // Tạo file CSV gợi ý ánh xạ
    const outputPath = path.join(path.dirname(csvFilePath), 'client-mapping-suggestions.csv');
    const outputStream = fs.createWriteStream(outputPath);
    
    // Viết header
    outputStream.write('old_client_name,suggested_client_id,suggested_client_name,similarity,is_good_match,alternative1_id,alternative1_name,alternative1_similarity,alternative2_id,alternative2_name,alternative2_similarity\n');
    
    // Viết gợi ý ánh xạ
    mappingSuggestions.forEach(suggestion => {
      const bestMatch = suggestion.bestMatch || { id: '', originalName: '', similarity: 0 };
      const alt1 = suggestion.alternatives[0] || { id: '', originalName: '', similarity: 0 };
      const alt2 = suggestion.alternatives[1] || { id: '', originalName: '', similarity: 0 };
      
      outputStream.write(`"${suggestion.oldClientName}","${bestMatch.id}","${bestMatch.originalName}",${bestMatch.similarity},${suggestion.isGoodMatch},"${alt1.id}","${alt1.originalName}",${alt1.similarity},"${alt2.id}","${alt2.originalName}",${alt2.similarity}\n`);
    });
    
    outputStream.end();
    
    console.log(`Client mapping suggestions saved to: ${outputPath}`);
    
    // Tạo file CSV ánh xạ cuối cùng
    const finalMappingPath = path.join(path.dirname(csvFilePath), 'client-mapping-final.csv');
    const finalMappingStream = fs.createWriteStream(finalMappingPath);
    
    // Viết header
    finalMappingStream.write('old_client_name,new_client_id\n');
    
    // Viết gợi ý ánh xạ (chỉ những gợi ý tốt)
    mappingSuggestions.forEach(suggestion => {
      if (suggestion.isGoodMatch) {
        finalMappingStream.write(`"${suggestion.oldClientName}","${suggestion.bestMatch.id}"\n`);
      } else {
        finalMappingStream.write(`"${suggestion.oldClientName}",""\n`);
      }
    });
    
    finalMappingStream.end();
    
    console.log(`Final client mapping template saved to: ${finalMappingPath}`);
    console.log('Please review and complete the final mapping file before importing invoices.');
  } catch (error) {
    console.error('Error during mapping process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
