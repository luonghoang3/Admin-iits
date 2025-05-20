// optimal-client-mapping.js
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
  
  // Tính độ tương đồng dựa trên khoảng cách Levenshtein
  const m = s1.length;
  const n = s2.length;
  
  // Tạo ma trận khoảng cách
  const d = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  // Khởi tạo giá trị ban đầu
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  
  // Tính khoảng cách
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // Xóa
        d[i][j - 1] + 1,      // Chèn
        d[i - 1][j - 1] + cost // Thay thế
      );
    }
  }
  
  // Tính độ tương đồng từ khoảng cách
  return 1 - d[m][n] / Math.max(m, n);
}

// Hàm tìm khách hàng phù hợp nhất
function findBestMatchingClient(oldClientName, dbClients, manualMappings, threshold = 0.7) {
  if (!oldClientName) return null;
  
  // Kiểm tra ánh xạ thủ công
  if (manualMappings[oldClientName]) {
    const mapping = manualMappings[oldClientName];
    return {
      id: mapping.id,
      name: mapping.name,
      similarity: 1.0,
      source: 'manual'
    };
  }
  
  // Chuẩn hóa tên khách hàng cũ
  const normalizedOldName = oldClientName.toLowerCase().trim();
  
  // Tìm kiếm khớp chính xác
  for (const client of dbClients) {
    if (client.name && client.name.toLowerCase().trim() === normalizedOldName) {
      return {
        id: client.id,
        name: client.name,
        similarity: 1.0,
        source: 'exact_name'
      };
    }
    
    if (client.trade_name && client.trade_name.toLowerCase().trim() === normalizedOldName) {
      return {
        id: client.id,
        name: client.name,
        similarity: 1.0,
        source: 'exact_trade_name'
      };
    }
  }
  
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
      similarity: bestMatch.similarity,
      source: 'fuzzy_match'
    };
  }
  
  // Tìm kiếm theo từ khóa
  const keywords = normalizedOldName.split(/\s+/);
  const keywordMatches = [];
  
  for (const client of clientNames) {
    let keywordCount = 0;
    for (const keyword of keywords) {
      if (keyword.length >= 4 && client.name.includes(keyword)) {
        keywordCount++;
      }
    }
    
    if (keywordCount >= 2) {
      keywordMatches.push({
        id: client.id,
        name: client.originalName,
        similarity: keywordCount / keywords.length,
        source: 'keyword_match'
      });
    }
  }
  
  // Sắp xếp theo số từ khóa khớp
  keywordMatches.sort((a, b) => b.similarity - a.similarity);
  
  // Nếu có kết quả từ khóa tốt
  if (keywordMatches.length > 0 && keywordMatches[0].similarity >= 0.5) {
    return keywordMatches[0];
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

// Danh sách ánh xạ thủ công
const manualMappings = {
  // Format: 'old_client_name': { id: 'new_client_id', name: 'new_client_name' }
  'Agri Commodities & Finance FZE': { id: '', name: '' },
  'Al Ghurair Resources International LLC': { id: '4bd3bcd0-2b49-45ec-baeb-8cd4dc0024f6', name: 'Al Ghurair Resources LLC' },
  'Al Ghurair Resources Oils & Proteins (L.L.C)': { id: '4bd3bcd0-2b49-45ec-baeb-8cd4dc0024f6', name: 'Al Ghurair Resources LLC' },
  'Anna METAProfit Maritime Limitedc/oBlumenthal Asia Pte. Ltd.': { id: 'ca390dda-0996-47c4-b995-2a435212795f', name: 'BLUMENTHAL ASIA PTE LTD.' },
  'CAO THANG MACHINERY AND SPARE PARTS JOINT STOCK COMPANY': { id: '9284aa59-9793-42af-9365-6dc28308f374', name: 'CÔNG TY CỔ PHẦN XUẤT NHẬP KHẨU CAO THĂNG' },
  'CCIC South America': { id: '34bb4cf6-40c9-4213-99ec-3ee3185046b8', name: 'CCIC SA' },
  'CÔNG TY TNHH CDL PRECISION TECHNOLOGY (VIETNAM)': { id: '', name: '' },
  'CÔNG TY TNHH GBC ViỆT NAM': { id: '', name: '' },
  'Dr. Amin Controllers (Singapore) Pte. Ltd': { id: '8e60d6ab-6f5a-4eaa-b975-0e74296aae02', name: 'Dr. Amin Controllers Pvt. Ltd' },
  'EMMSONS ASIA PTE LTD': { id: '0b4e9416-a855-4600-85e9-2c761cfc2428', name: 'EMMSONS INTERNATIONAL LTD' },
  'FPG Insurance (Thailand) Public Company Limitedc/o Dolphin Claims Services (Singapore) Pte Ltd': { id: 'beab09a2-7b24-41b2-bc1b-b1290c22ad52', name: 'DOLPHIN CLAIMS SERVICES (SINGAPORE) PTE LTD' },
  'GREAT OCEAN OILS AND GRAINS INDUSTRIES (FANGCHENGGANG) CO., LTD': { id: '', name: '' },
  'IAR AGRICULTURAL RESOURSES AG': { id: '', name: '' },
  'JY-CSL CHARTERING PTE.LTD.': { id: '', name: '' },
  'KANEMATSU CORPORATION (TFR4)': { id: 'f3eef5e1-f6e3-4d8a-a810-d371dcb8cfe0', name: 'KANEMATSU CORPORATION (HCMC Ref office)' },
  'LEON INSPECTION & TESTING VIETNAM PVT COMPANY LIMITED': { id: '130508a4-34f2-4de5-9c51-51721d612aed', name: 'CÔNG TY TNHH LEON INSPECTION & TESTING VIETNAM PVT' },
  'LONGULF TRADING (INDIA) PVT. LTD.': { id: '', name: '' },
  'MAA Takaful Berhad': { id: '', name: '' },
  'Merchant Agri India Pvt. Ltd.': { id: '', name: '' },
  'NEW SNS LOGISTICS (SINGAPORE) PTE LTD': { id: '', name: '' },
  'RUCHI AGRITRADING PTE LTD': { id: '9b47e373-6229-41ed-af2a-3177eec465dc', name: 'RUCHI SOYA INDUSTRIES LIMITED' },
  'RUCHI SOYA INDUSTRIES LTD': { id: '9b47e373-6229-41ed-af2a-3177eec465dc', name: 'RUCHI SOYA INDUSTRIES LIMITED' },
  'Representations International Pte Ltd': { id: '', name: '' },
  'SHANGHAI YIHAI COMMERCIAL CO.,LTD': { id: '', name: '' },
  'Sierentz Global Merchants India Private Limited': { id: '', name: '' },
  'Sri Ayudhya General Insurance Public Company Limited C/o: Dolphin Claims Services (Singapore) Pte Ltd': { id: 'beab09a2-7b24-41b2-bc1b-b1290c22ad52', name: 'DOLPHIN CLAIMS SERVICES (SINGAPORE) PTE LTD' },
  'T&T INTERNATIONAL TRADE LLC': { id: '', name: '' },
  'ThaiSri Insurance Public Company LimitedC/o: Dolphin Claims Services (Singapore) Pte Ltd': { id: 'beab09a2-7b24-41b2-bc1b-b1290c22ad52', name: 'DOLPHIN CLAIMS SERVICES (SINGAPORE) PTE LTD' },
  'The Straits International Pte.  Ltd.': { id: '23c569e5-cd57-48e5-be07-e2076610f7a3', name: 'THE STRAITS INTERNATIONAL PTE LTD' },
  'TROPICAL GRAINS & FEEDS INDUSTRIES PTE LTD': { id: '', name: '' },
  'Viking Marine Services FZE': { id: 'e79eb249-1a87-4ec8-a4b3-1fe3a41127d0', name: 'Viking Marine Services Pte. Ltd.' },
  'WILMAR PTE LTD': { id: 'e1d25caa-1598-422d-ab0a-ed8ad8676da1', name: 'WILMAR TRADING PTE LTD' },
  'WILMAR TRADING (CHINA) PTE LTD., SINGAPORE': { id: 'e1d25caa-1598-422d-ab0a-ed8ad8676da1', name: 'WILMAR TRADING PTE LTD' },
  'Wilmar Trading (China) Pte LtdCo. Reg. No. 198901130Z': { id: 'e1d25caa-1598-422d-ab0a-ed8ad8676da1', name: 'WILMAR TRADING PTE LTD' },
  '华泰财产保险有限公司青岛分公司Huatai Property & Casualty Insurance Co., Ltd. Qingdao Branch': { id: '422a3777-c4c4-460e-8609-c7e86e3da626', name: '华泰财产保险有限公司' }
};

// Hàm chính
async function main() {
  try {
    // Kiểm tra đường dẫn file
    const csvFilePath = process.argv[2];
    if (!csvFilePath) {
      console.error('Usage: node optimal-client-mapping.js <unique-clients-csv-path>');
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
    const mappingSuggestions = [];
    let exactMatchCount = 0;
    let fuzzyMatchCount = 0;
    let keywordMatchCount = 0;
    let manualMatchCount = 0;
    let noMatchCount = 0;
    
    for (const row of data) {
      const oldClientName = row.old_client_name;
      if (!oldClientName) continue;
      
      const bestMatch = findBestMatchingClient(oldClientName, dbClients, manualMappings);
      
      if (bestMatch) {
        if (bestMatch.source === 'exact_name' || bestMatch.source === 'exact_trade_name') {
          exactMatchCount++;
        } else if (bestMatch.source === 'fuzzy_match') {
          fuzzyMatchCount++;
        } else if (bestMatch.source === 'keyword_match') {
          keywordMatchCount++;
        } else if (bestMatch.source === 'manual') {
          manualMatchCount++;
        }
        
        mappingSuggestions.push({
          oldClientName,
          newClientId: bestMatch.id,
          newClientName: bestMatch.name,
          similarity: bestMatch.similarity,
          source: bestMatch.source
        });
      } else {
        noMatchCount++;
        
        mappingSuggestions.push({
          oldClientName,
          newClientId: '',
          newClientName: '',
          similarity: 0,
          source: 'no_match'
        });
      }
    }
    
    // Tạo file CSV ánh xạ cuối cùng
    const outputPath = path.join(path.dirname(csvFilePath), 'client-mapping-optimal.csv');
    const outputStream = fs.createWriteStream(outputPath);
    
    // Viết header
    outputStream.write('old_client_name,new_client_id,new_client_name,similarity,source\n');
    
    // Viết ánh xạ
    mappingSuggestions.forEach(mapping => {
      outputStream.write(`"${mapping.oldClientName}","${mapping.newClientId}","${mapping.newClientName}",${mapping.similarity},"${mapping.source}"\n`);
    });
    
    outputStream.end();
    
    console.log(`
Mapping statistics:
- Exact matches: ${exactMatchCount}
- Fuzzy matches: ${fuzzyMatchCount}
- Keyword matches: ${keywordMatchCount}
- Manual matches: ${manualMatchCount}
- No matches: ${noMatchCount}
- Total: ${mappingSuggestions.length}
    `);
    
    console.log(`Client mapping saved to: ${outputPath}`);
    
    // Tạo file CSV ánh xạ đơn giản (chỉ old_client_name và new_client_id)
    const simpleMappingPath = path.join(path.dirname(csvFilePath), 'client-mapping-simple.csv');
    const simpleMappingStream = fs.createWriteStream(simpleMappingPath);
    
    // Viết header
    simpleMappingStream.write('old_client_name,new_client_id\n');
    
    // Viết ánh xạ
    mappingSuggestions.forEach(mapping => {
      simpleMappingStream.write(`"${mapping.oldClientName}","${mapping.newClientId}"\n`);
    });
    
    simpleMappingStream.end();
    
    console.log(`Simple client mapping saved to: ${simpleMappingPath}`);
  } catch (error) {
    console.error('Error during mapping process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
