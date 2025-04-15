/**
 * Script để cập nhật cột inspection_place trong bảng orders
 * dựa trên dữ liệu từ file CSV, sử dụng trực tiếp PostgreSQL
 */
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Function to read CSV file
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath, { encoding: 'utf8' })
      .pipe(csv({
        // Handle BOM character in CSV file
        skipLines: 0
      }))
      .on('data', (data) => {
        // Normalize data to handle potential encoding issues
        const normalizedData = {};
        for (const [key, value] of Object.entries(data)) {
          // Remove BOM character if present
          const cleanKey = key.replace(/^\ufeff/, '');
          normalizedData[cleanKey] = value ? value.trim() : value;
        }
        results.push(normalizedData);
      })
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Function to escape single quotes in SQL
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Function to update inspection_place for orders
async function updateInspectionPlace(data) {
  console.log('Updating inspection_place for orders...');
  
  // Create a map of order numbers to inspection places
  const orderMap = new Map();
  
  data.forEach(row => {
    // Check if we have both order number and inspection place
    // Handle possible BOM character and different column names
    let orderNumber = '';
    let inspectionPlace = '';
    
    // Check all possible column names for order number
    if (row['Work Order No'] !== undefined) {
      orderNumber = row['Work Order No'];
    } else if (row['\ufeffWork Order No'] !== undefined) {
      orderNumber = row['\ufeffWork Order No'];
    } else if (row['order_number'] !== undefined) {
      orderNumber = row['order_number'];
    }
    
    // Check all possible column names for inspection place
    if (row['Inspection Place'] !== undefined) {
      inspectionPlace = row['Inspection Place'];
    } else if (row['inspection_place'] !== undefined) {
      inspectionPlace = row['inspection_place'];
    }
    
    if (orderNumber && inspectionPlace) {
      orderMap.set(orderNumber, inspectionPlace);
    }
  });
  
  console.log(`Found ${orderMap.size} orders with inspection_place in CSV.`);
  
  // Process order numbers in batches to avoid command line length limits
  const orderNumbers = Array.from(orderMap.keys());
  const batchSize = 50; // Process 50 orders at a time
  const existingOrderSet = new Set();
  
  console.log(`Processing ${orderNumbers.length} orders in batches of ${batchSize}...`);
  
  // Process orders in batches
  for (let i = 0; i < orderNumbers.length; i += batchSize) {
    const batch = orderNumbers.slice(i, i + batchSize);
    
    try {
      // Create a SQL query to check which order numbers exist
      const orderList = batch.map(order => `'${escapeSql(order)}'`).join(',');
      const checkQuery = `SELECT order_number FROM public.orders WHERE order_number IN (${orderList})`;
      
      // Execute the query
      const { stdout } = await execPromise(`docker exec supabase-db psql -U supabase_admin -d postgres -t -c "${checkQuery}"`);
      
      // Parse the results
      const existingOrders = stdout.trim().split('\n')
        .filter(line => line.trim())
        .map(line => line.trim());
      
      // Add existing orders to the set
      existingOrders.forEach(order => existingOrderSet.add(order));
      
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(orderNumbers.length / batchSize)}`);
    } catch (error) {
      console.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, error);
    }
  }
  
  // Count how many orders from CSV exist in the database
  const existingCount = existingOrderSet.size;
  const missingCount = orderNumbers.length - existingCount;
  
  console.log(`Found ${existingCount} orders in the database out of ${orderNumbers.length} from CSV.`);
  console.log(`${missingCount} orders from CSV do not exist in the database.`);
  
  // Update each order
  let updatedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  // Only process orders that exist in the database
  for (const [orderNumber, inspectionPlace] of orderMap.entries()) {
    try {
      // Skip orders that don't exist in the database
      if (!existingOrderSet.has(orderNumber)) {
        skippedCount++;
        continue;
      }
      
      // Create a SQL query to update the order
      const updateQuery = `UPDATE public.orders SET inspection_place = '${escapeSql(inspectionPlace)}' WHERE order_number = '${escapeSql(orderNumber)}'`;
      
      // Execute the query
      await execPromise(`docker exec supabase-db psql -U supabase_admin -d postgres -c "${updateQuery}"`);
      
      console.log(`Updated inspection_place for order ${orderNumber} to "${inspectionPlace}"`);
      updatedCount++;
    } catch (error) {
      console.error(`Error processing order ${orderNumber}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Updated inspection_place for ${updatedCount} orders.`);
  console.log(`Skipped ${skippedCount} orders that don't exist in the database.`);
  if (errorCount > 0) {
    console.log(`Failed to update ${errorCount} orders.`);
  }
}

// Main function to run the update process
async function main() {
  try {
    // Check if file path is provided
    const filePath = process.argv[2] || path.resolve(__dirname, 'CG PLACE.csv');
    
    console.log(`Reading CSV file: ${filePath}`);
    const data = await readCSV(filePath);
    console.log(`Read ${data.length} rows from CSV.`);
    
    // Update inspection_place for orders
    await updateInspectionPlace(data);
    
    console.log('Update completed successfully!');
  } catch (error) {
    console.error('Error during update process:', error);
    process.exit(1);
  }
}

// Run the main function
main();
