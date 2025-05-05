const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to read CSV file
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath, { encoding: 'utf8' })
      .pipe(csv())
      .on('data', (data) => {
        // Normalize data to handle potential encoding issues
        const normalizedData = {};
        for (const [key, value] of Object.entries(data)) {
          // Fix for BOM character in CSV header
          const normalizedKey = key.startsWith('\ufeff') ? key.substring(1) : key;
          normalizedData[normalizedKey] = value ? value.trim() : value;
        }
        results.push(normalizedData);
      })
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Function to analyze CSV data and find potential issues
async function analyzeData(data) {
  console.log('\n=== CSV Data Analysis ===');
  
  // Count unique values
  const uniqueOrderNumbers = new Set();
  const uniqueClients = new Set();
  const uniqueCommodities = new Set();
  const uniqueUnits = new Set();
  
  data.forEach(row => {
    if (row.order_number) uniqueOrderNumbers.add(row.order_number);
    if (row.client_name) uniqueClients.add(row.client_name);
    if (row.commodity_name) uniqueCommodities.add(row.commodity_name);
    if (row.unit_name) uniqueUnits.add(row.unit_name);
  });
  
  console.log(`Total rows in CSV: ${data.length}`);
  console.log(`Unique order numbers: ${uniqueOrderNumbers.size}`);
  console.log(`Unique clients: ${uniqueClients.size}`);
  console.log(`Unique commodities: ${uniqueCommodities.size}`);
  console.log(`Unique units: ${uniqueUnits.size}`);
  
  // Group data by order number
  const orderGroups = new Map();
  data.forEach(row => {
    if (row.order_number) {
      if (!orderGroups.has(row.order_number)) {
        orderGroups.set(row.order_number, []);
      }
      orderGroups.get(row.order_number).push(row);
    }
  });
  
  // Check for orders with missing critical data
  const ordersWithMissingClient = [];
  const ordersWithMissingCommodity = [];
  const ordersWithMissingUnit = [];
  const ordersWithOtherIssues = [];
  
  for (const [orderNumber, rows] of orderGroups.entries()) {
    const firstRow = rows[0];
    
    // Check for missing client
    if (!firstRow.client_name) {
      ordersWithMissingClient.push(orderNumber);
      continue;
    }
    
    // Check for missing commodity or unit in any row
    let hasMissingCommodity = false;
    let hasMissingUnit = false;
    let hasOtherIssues = false;
    
    for (const row of rows) {
      if (!row.commodity_name) {
        hasMissingCommodity = true;
      }
      
      if (!row.unit_name) {
        hasMissingUnit = true;
      }
      
      // Check for other potential issues
      if (!row.quantity) {
        hasOtherIssues = true;
      }
    }
    
    if (hasMissingCommodity) {
      ordersWithMissingCommodity.push(orderNumber);
    }
    
    if (hasMissingUnit) {
      ordersWithMissingUnit.push(orderNumber);
    }
    
    if (hasOtherIssues) {
      ordersWithOtherIssues.push(orderNumber);
    }
  }
  
  console.log('\n=== Orders with Missing Critical Data ===');
  console.log(`Orders with missing client: ${ordersWithMissingClient.length}`);
  console.log(`Orders with missing commodity: ${ordersWithMissingCommodity.length}`);
  console.log(`Orders with missing unit: ${ordersWithMissingUnit.length}`);
  console.log(`Orders with other issues: ${ordersWithOtherIssues.length}`);
  
  // Calculate total problematic orders (unique)
  const allProblematicOrders = new Set([
    ...ordersWithMissingClient,
    ...ordersWithMissingCommodity,
    ...ordersWithMissingUnit
  ]);
  
  console.log(`\nTotal orders with critical issues: ${allProblematicOrders.size}`);
  
  // Save problematic orders to file
  const problematicOrdersData = {
    missingClient: ordersWithMissingClient,
    missingCommodity: ordersWithMissingCommodity,
    missingUnit: ordersWithMissingUnit,
    otherIssues: ordersWithOtherIssues,
    allProblematic: Array.from(allProblematicOrders)
  };
  
  fs.writeFileSync('problematic_orders.json', JSON.stringify(problematicOrdersData, null, 2));
  console.log('Saved problematic orders to problematic_orders.json');
  
  return {
    totalRows: data.length,
    uniqueOrders: uniqueOrderNumbers.size,
    problematicOrders: allProblematicOrders.size,
    orderGroups
  };
}

// Function to check which orders exist in the database
async function checkExistingOrders(orderGroups) {
  console.log('\n=== Checking Database Status ===');
  
  // Get team ID for CG
  const { data: teams, error: teamError } = await supabase
    .from('teams')
    .select('id, name')
    .eq('name', 'CG')
    .limit(1);
  
  if (teamError) {
    console.error('Error fetching CG team:', teamError);
    return null;
  }
  
  if (!teams || teams.length === 0) {
    console.error('CG team not found in the database.');
    return null;
  }
  
  const cgTeamId = teams[0].id;
  console.log(`Found CG team with ID: ${cgTeamId}`);
  
  // Check existing orders in database
  const existingOrders = [];
  const missingOrders = [];
  
  console.log(`Checking ${orderGroups.size} orders against database...`);
  
  let count = 0;
  for (const [orderNumber, _] of orderGroups.entries()) {
    count++;
    if (count % 100 === 0) {
      console.log(`Checked ${count}/${orderGroups.size} orders...`);
    }
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('order_number', orderNumber)
      .limit(1);
    
    if (error) {
      console.error(`Error checking order ${orderNumber}:`, error);
      continue;
    }
    
    if (orders && orders.length > 0) {
      existingOrders.push(orderNumber);
    } else {
      missingOrders.push(orderNumber);
    }
  }
  
  console.log(`\nOrders found in database: ${existingOrders.length}`);
  console.log(`Orders missing from database: ${missingOrders.length}`);
  
  // Save results to file
  const dbCheckResults = {
    existingOrders,
    missingOrders
  };
  
  fs.writeFileSync('db_check_results.json', JSON.stringify(dbCheckResults, null, 2));
  console.log('Saved database check results to db_check_results.json');
  
  return {
    existingOrders,
    missingOrders
  };
}

// Function to find the intersection of problematic orders and missing orders
function analyzeResults() {
  try {
    // Load the problematic orders
    const problematicData = JSON.parse(fs.readFileSync('problematic_orders.json'));
    const problematicOrders = new Set(problematicData.allProblematic);
    
    // Load the database check results
    const dbResults = JSON.parse(fs.readFileSync('db_check_results.json'));
    const missingOrders = new Set(dbResults.missingOrders);
    
    // Find orders that are both problematic and missing
    const problematicAndMissing = [];
    for (const order of problematicOrders) {
      if (missingOrders.has(order)) {
        problematicAndMissing.push(order);
      }
    }
    
    // Find orders that are missing but not problematic
    const missingButNotProblematic = [];
    for (const order of missingOrders) {
      if (!problematicOrders.has(order)) {
        missingButNotProblematic.push(order);
      }
    }
    
    console.log('\n=== Analysis Results ===');
    console.log(`Orders with issues that were not imported: ${problematicAndMissing.length}`);
    console.log(`Orders without obvious issues but still not imported: ${missingButNotProblematic.length}`);
    
    // Save the final analysis
    const finalAnalysis = {
      problematicAndMissing,
      missingButNotProblematic,
      problematicAndMissingCount: problematicAndMissing.length,
      missingButNotProblematicCount: missingButNotProblematic.length,
      totalMissingOrders: dbResults.missingOrders.length,
      totalProblematicOrders: problematicData.allProblematic.length
    };
    
    fs.writeFileSync('final_analysis.json', JSON.stringify(finalAnalysis, null, 2));
    console.log('Saved final analysis to final_analysis.json');
    
    // Print some examples
    if (missingButNotProblematic.length > 0) {
      console.log('\nExamples of orders without obvious issues but still not imported:');
      missingButNotProblematic.slice(0, 10).forEach(order => console.log(`- ${order}`));
    }
    
    return finalAnalysis;
  } catch (error) {
    console.error('Error analyzing results:', error);
    return null;
  }
}

// Main function
async function main() {
  try {
    // Check if file path is provided
    const filePath = process.argv[2] || path.resolve(__dirname, 'CG data.csv');
    
    console.log('=== CG Orders Analysis Tool ===');
    console.log(`Using file: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found at ${filePath}`);
      process.exit(1);
    }
    
    // Read CSV file
    console.log(`\nReading CSV file: ${filePath}`);
    const data = await readCSV(filePath);
    console.log(`Read ${data.length} rows from CSV.`);
    
    // Analyze data
    const analysisResult = await analyzeData(data);
    
    // Check existing orders in database
    const dbCheckResult = await checkExistingOrders(analysisResult.orderGroups);
    
    // Analyze the results
    if (dbCheckResult) {
      const finalAnalysis = analyzeResults();
      
      console.log('\n=== Summary ===');
      console.log(`Total unique orders in CSV: ${analysisResult.uniqueOrders}`);
      console.log(`Orders with critical issues: ${analysisResult.problematicOrders}`);
      console.log(`Orders missing from database: ${dbCheckResult.missingOrders.length}`);
      
      if (finalAnalysis) {
        console.log(`\nOrders missing due to data issues: ${finalAnalysis.problematicAndMissingCount}`);
        console.log(`Orders missing without obvious issues: ${finalAnalysis.missingButNotProblematicCount}`);
      }
    }
    
    console.log('\nAnalysis completed successfully!');
  } catch (error) {
    console.error('Error during analysis process:', error);
    process.exit(1);
  }
}

// Run the main function
main();
