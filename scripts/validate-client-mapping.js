// validate-client-mapping.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Kết nối đến Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    const mappingFilePath = process.argv[2];
    if (!mappingFilePath) {
      console.error('Usage: node validate-client-mapping.js <client-mapping-final-csv-path>');
      process.exit(1);
    }

    console.log(`Reading mapping file: ${mappingFilePath}`);
    const mappingData = await readCSV(mappingFilePath);
    console.log(`Read ${mappingData.length} mappings from CSV.`);

    // Kiểm tra tính đầy đủ
    const missingMappings = mappingData.filter(row => !row.new_client_id);
    console.log(`Found ${missingMappings.length} missing mappings.`);

    if (missingMappings.length > 0) {
      console.log('Missing mappings:');
      missingMappings.forEach(row => {
        console.log(`- ${row.old_client_name}`);
      });
    }

    // Kiểm tra tính hợp lệ của client_id
    const clientIds = mappingData
      .filter(row => row.new_client_id)
      .map(row => row.new_client_id);
    
    if (clientIds.length > 0) {
      console.log(`Validating ${clientIds.length} client IDs...`);
      
      const { data: validClients, error } = await supabase
        .from('clients')
        .select('id')
        .in('id', clientIds);
      
      if (error) {
        console.error('Error validating client IDs:', error);
      } else {
        const validClientIds = validClients.map(client => client.id);
        const invalidClientIds = clientIds.filter(id => !validClientIds.includes(id));
        
        console.log(`Found ${invalidClientIds.length} invalid client IDs.`);
        
        if (invalidClientIds.length > 0) {
          console.log('Invalid client IDs:');
          invalidClientIds.forEach(id => {
            const mapping = mappingData.find(row => row.new_client_id === id);
            console.log(`- ${id} (mapped from "${mapping.old_client_name}")`);
          });
        }
      }
    }

    console.log('Validation completed.');
  } catch (error) {
    console.error('Error during validation process:', error);
    process.exit(1);
  }
}

// Chạy hàm chính
main();
