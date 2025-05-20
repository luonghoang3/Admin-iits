// generate-unit-mapping-cg.js
// Script để tạo file mapping cho unit từ file CG INVOICE.csv
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

    // Lấy danh sách unit từ file CSV
    const unitsFromCSV = new Set();
    const unitKey = Object.keys(invoiceData[0]).find(key => key.trim() === 'Unit');
    
    invoiceData.forEach(row => {
      if (unitKey && row[unitKey] && row[unitKey].trim()) {
        unitsFromCSV.add(row[unitKey].trim());
      }
    });

    console.log(`Found ${unitsFromCSV.size} unique units in CSV.`);

    // Lấy danh sách unit từ database
    console.log('Loading units from database...');
    const unitsFromDB = new Map();
    const sqlCommand = `SELECT id, name FROM units;`;
    const result = executeSql(sqlCommand);

    result.split('\n').forEach(line => {
      if (!line.trim()) return;

      const parts = line.split('|');
      if (parts.length >= 2) {
        const id = parts[0].trim();
        const name = parts[1].trim();
        if (id && name) {
          unitsFromDB.set(name.toLowerCase(), { id, name });
        }
      }
    });

    console.log(`Loaded ${unitsFromDB.size} units from database.`);

    // Tạo mapping
    const mappings = [];
    mappings.push('old_unit_name,new_unit_id,new_unit_name,similarity,source');

    // Mapping cơ bản cho các đơn vị phổ biến
    const basicMappings = {
      'cont(s)': 'Cont(s)',
      'cont': 'Cont(s)',
      'conts': 'Cont(s)',
      'container(s)': 'Cont(s)',
      'containers': 'Cont(s)',
      'visit(s)': 'Visit(s)',
      'visit': 'Visit(s)',
      'manday(s)': 'Manday(s)',
      'mandays': 'Manday(s)',
      'day(s)': 'Day(s)',
      'days': 'Day(s)',
      'day': 'Day(s)',
      'hour(s)': 'Hour(s)',
      'hour': 'Hour(s)',
      'hours': 'Hour(s)',
      'sample(s)': 'Sample(s)',
      'sample': 'Sample(s)',
      'lần': 'Lần',
      'ngày công': 'Ngày công',
      'ngày': 'Ngày',
      'giờ': 'Giờ'
    };

    for (const csvUnit of unitsFromCSV) {
      // Bỏ qua header hoặc giá trị rỗng
      if (!csvUnit || csvUnit === 'Unit') continue;

      // Kiểm tra mapping cơ bản
      const lowerCsvUnit = csvUnit.toLowerCase();
      let mappedUnit = null;
      
      for (const [key, value] of Object.entries(basicMappings)) {
        if (lowerCsvUnit === key) {
          const dbUnit = unitsFromDB.get(value.toLowerCase());
          if (dbUnit) {
            mappedUnit = { unit: dbUnit, similarity: 1.0, source: 'basic_mapping' };
            break;
          }
        }
      }

      // Nếu không có trong mapping cơ bản, tìm kiếm chính xác
      if (!mappedUnit) {
        const exactMatch = unitsFromDB.get(csvUnit.toLowerCase());
        if (exactMatch) {
          mappedUnit = { unit: exactMatch, similarity: 1.0, source: 'exact_match' };
        }
      }

      // Nếu vẫn không tìm thấy, tìm kiếm tương đối
      if (!mappedUnit) {
        let bestMatch = null;
        let bestSimilarity = 0;
        const threshold = 0.7; // Ngưỡng tương đồng (70%)

        for (const [dbUnitName, dbUnit] of unitsFromDB.entries()) {
          const similarity = calculateSimilarity(csvUnit.toLowerCase(), dbUnitName);
          if (similarity > threshold && similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatch = dbUnit;
          }
        }

        if (bestMatch) {
          mappedUnit = { unit: bestMatch, similarity: bestSimilarity, source: 'fuzzy_match' };
        }
      }

      // Thêm vào danh sách mapping
      if (mappedUnit) {
        mappings.push(`"${csvUnit}",${mappedUnit.unit.id},"${mappedUnit.unit.name}",${mappedUnit.similarity.toFixed(2)},${mappedUnit.source}`);
      } else {
        console.log(`No match found for unit: ${csvUnit}`);
      }
    }

    // Ghi file mapping
    const mappingFilePath = path.join(__dirname, 'unit-mapping-cg-full.csv');
    fs.writeFileSync(mappingFilePath, mappings.join('\n'));
    console.log(`Unit mapping saved to: ${mappingFilePath}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Chạy script
main();
