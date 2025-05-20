// fix-client-mapping.js
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

// Hàm chính
async function main() {
  try {
    // Kiểm tra đường dẫn file
    const csvFilePath = process.argv[2];
    if (!csvFilePath) {
      console.error('Usage: node fix-client-mapping.js <client-mapping-auto-csv-path>');
      process.exit(1);
    }

    console.log(`Reading CSV file: ${csvFilePath}`);
    const data = await readCSV(csvFilePath);
    console.log(`Read ${data.length} mappings from CSV.`);

    // Sửa lại các ánh xạ không chính xác
    const fixedMappings = [];
    let fixedCount = 0;
    
    // Danh sách các ánh xạ cần sửa
    const fixMappings = {
      // Format: 'old_client_name': { id: 'new_client_id', name: 'new_client_name' }
      'Agri Commodities & Finance FZE': { id: '', name: '' },
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
    
    // Sửa lại các ánh xạ
    data.forEach(row => {
      const oldClientName = row.old_client_name;
      
      if (fixMappings[oldClientName]) {
        const fix = fixMappings[oldClientName];
        
        if (fix.id) {
          // Sửa lại ánh xạ
          row.new_client_id = fix.id;
          row.new_client_name = fix.name;
          row.similarity = '1.0'; // Đặt độ tương đồng là 1.0 (ánh xạ thủ công)
          fixedCount++;
        } else {
          // Xóa ánh xạ không chính xác
          row.new_client_id = '';
          row.new_client_name = '';
          row.similarity = '0';
          fixedCount++;
        }
      }
      
      fixedMappings.push(row);
    });
    
    // Tạo file CSV ánh xạ đã sửa
    const outputPath = path.join(path.dirname(csvFilePath), 'client-mapping-fixed.csv');
    const outputStream = fs.createWriteStream(outputPath);
    
    // Viết header
    outputStream.write('old_client_name,new_client_id,new_client_name,similarity\n');
    
    // Viết ánh xạ
    fixedMappings.forEach(row => {
      outputStream.write(`"${row.old_client_name}","${row.new_client_id}","${row.new_client_name}",${row.similarity}\n`);
    });
    
    outputStream.end();
    
    console.log(`Fixed ${fixedCount} mappings.`);
    console.log(`Fixed client mapping saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error during fixing process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
