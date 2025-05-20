// fix-unit-mapping.js
// Script để cập nhật file unit-mapping-cg-full.csv với các unit từ file CSV đã sửa
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Đường dẫn đến file CSV và file mapping
const csvFilePath = path.join(__dirname, 'CG INVOICE-fixed.csv');
const unitMappingPath = path.join(__dirname, 'unit-mapping-cg-full.csv');
const outputMappingPath = path.join(__dirname, 'unit-mapping-cg-full-updated.csv');

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

// Hàm chính
async function main() {
  try {
    console.log(`Reading CSV file: ${csvFilePath}`);
    
    // Đọc file CSV
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    const csvRecords = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      escape: '"',
      quote: '"',
      delimiter: ',',
      trim: true
    });
    
    console.log(`Successfully parsed ${csvRecords.length} records from CSV.`);
    
    // Đọc file mapping
    console.log(`Reading unit mapping file: ${unitMappingPath}`);
    const mappingContent = fs.readFileSync(unitMappingPath, 'utf8');
    const mappingRecords = parse(mappingContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      escape: '"',
      quote: '"',
      delimiter: ',',
      trim: true
    });
    
    console.log(`Successfully parsed ${mappingRecords.length} records from mapping file.`);
    
    // Lấy danh sách unit từ file CSV
    const unitsFromCSV = new Set();
    csvRecords.forEach(record => {
      const unit = record.Unit;
      if (unit && unit.trim() !== '') {
        // Loại bỏ dấu ngoặc kép ở đầu và cuối
        const cleanUnit = unit.replace(/^"|"$/g, '');
        if (cleanUnit.trim() !== '') {
          unitsFromCSV.add(cleanUnit);
        }
      }
    });
    
    console.log(`Found ${unitsFromCSV.size} unique units in CSV.`);
    
    // Lấy danh sách unit từ file mapping
    const unitsFromMapping = new Set();
    const unitMapping = {};
    mappingRecords.forEach(record => {
      const oldUnit = record.old_unit_name.replace(/^"|"$/g, '');
      unitsFromMapping.add(oldUnit);
      unitMapping[oldUnit.toLowerCase()] = {
        id: record.new_unit_id,
        name: record.new_unit_name.replace(/^"|"$/g, ''),
        similarity: parseFloat(record.similarity),
        source: record.source
      };
    });
    
    console.log(`Found ${unitsFromMapping.size} unique units in mapping file.`);
    
    // Tìm các unit chưa được mapping
    const unmappedUnits = [];
    unitsFromCSV.forEach(unit => {
      if (!unitsFromMapping.has(unit) && !unitMapping[unit.toLowerCase()]) {
        // Tìm unit tương tự
        let bestMatch = null;
        let bestSimilarity = 0;
        const threshold = 0.7; // Ngưỡng tương đồng (70%)
        
        for (const mappedUnit of unitsFromMapping) {
          const similarity = calculateSimilarity(unit.toLowerCase(), mappedUnit.toLowerCase());
          if (similarity > threshold && similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatch = mappedUnit;
          }
        }
        
        if (bestMatch) {
          unmappedUnits.push({
            unit,
            bestMatch,
            similarity: bestSimilarity,
            mapping: unitMapping[bestMatch.toLowerCase()]
          });
        } else {
          unmappedUnits.push({
            unit,
            bestMatch: null,
            similarity: 0,
            mapping: null
          });
        }
      }
    });
    
    console.log(`Found ${unmappedUnits.length} unmapped units.`);
    
    // Tạo file mapping mới
    const newMappingRecords = [...mappingRecords];
    
    // Thêm các unit chưa được mapping
    unmappedUnits.forEach(item => {
      if (item.bestMatch && item.similarity > 0.7) {
        // Nếu có unit tương tự, sử dụng mapping của unit đó
        newMappingRecords.push({
          old_unit_name: `"${item.unit}"`,
          new_unit_id: item.mapping.id,
          new_unit_name: `"${item.mapping.name}"`,
          similarity: item.similarity.toFixed(2),
          source: 'fuzzy_match'
        });
      } else {
        // Nếu không có unit tương tự, đánh dấu cần mapping thủ công
        newMappingRecords.push({
          old_unit_name: `"${item.unit}"`,
          new_unit_id: '',
          new_unit_name: '"NEED MAPPING"',
          similarity: '0.0',
          source: 'manual_mapping'
        });
      }
    });
    
    // Ghi file mapping mới
    const output = stringify(newMappingRecords, {
      header: true,
      quoted: false,
      delimiter: ',',
      escape: '"'
    });
    
    fs.writeFileSync(outputMappingPath, output);
    console.log(`Updated unit mapping saved to: ${outputMappingPath}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Chạy script
main();
