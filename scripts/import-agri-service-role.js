const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env.local') });

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ID của team Agri
const AGRI_TEAM_ID = '26b6ad02-03c0-45ac-9b65-3caeac723829';

// Maps to store relationships between old and new IDs
const clientMap = new Map();
const contactMap = new Map();
const shipperMap = new Map();
const buyerMap = new Map();
const commodityMap = new Map();
const unitMap = new Map();
const orderMap = new Map();

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
          normalizedData[key] = value ? value.trim() : value;
        }
        results.push(normalizedData);
      })
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Function to format date from DD/MM/YYYY to YYYY-MM-DD
function formatDate(dateString) {
  if (!dateString) return null;
  
  // Check if date is already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Parse DD/MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

// Test Supabase connection
async function testConnection() {
  try {
    console.log('Testing Supabase connection with service role key...');
    const { data, error } = await supabase.from('clients').select('count').limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return false;
    }
    
    console.log('Successfully connected to Supabase with service role key!');
    return true;
  } catch (error) {
    console.error('Exception during connection test:', error);
    return false;
  }
}

// Load existing clients, contacts, shippers, and buyers
async function loadExistingData() {
  console.log('Loading existing data...');
  
  // Load clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name');
  
  if (clientsError) {
    console.error('Error loading clients:', clientsError);
  } else {
    clients.forEach(client => {
      clientMap.set(client.name, client.id);
    });
    console.log(`Loaded ${clientMap.size} clients.`);
  }
  
  // Load contacts
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id, client_id, full_name');
  
  if (contactsError) {
    console.error('Error loading contacts:', contactsError);
  } else {
    // Create a map of client_id:full_name to contact_id
    contacts.forEach(contact => {
      // Find client name from client_id
      const clientName = Array.from(clientMap.entries())
        .find(([_, id]) => id === contact.client_id)?.[0];
      
      if (clientName) {
        const contactKey = `${clientName}:${contact.full_name}`;
        contactMap.set(contactKey, contact.id);
      }
    });
    console.log(`Loaded ${contactMap.size} contacts.`);
  }
  
  // Load shippers
  const { data: shippers, error: shippersError } = await supabase
    .from('shippers')
    .select('id, name');
  
  if (shippersError) {
    console.error('Error loading shippers:', shippersError);
  } else {
    shippers.forEach(shipper => {
      shipperMap.set(shipper.name, shipper.id);
    });
    console.log(`Loaded ${shipperMap.size} shippers.`);
  }
  
  // Load buyers
  const { data: buyers, error: buyersError } = await supabase
    .from('buyers')
    .select('id, name');
  
  if (buyersError) {
    console.error('Error loading buyers:', buyersError);
  } else {
    buyers.forEach(buyer => {
      buyerMap.set(buyer.name, buyer.id);
    });
    console.log(`Loaded ${buyerMap.size} buyers.`);
  }
  
  // Load commodities
  const { data: commodities, error: commoditiesError } = await supabase
    .from('commodities')
    .select('id, name');
  
  if (commoditiesError) {
    console.error('Error loading commodities:', commoditiesError);
  } else {
    commodities.forEach(commodity => {
      commodityMap.set(commodity.name, commodity.id);
    });
    console.log(`Loaded ${commodityMap.size} commodities.`);
  }
  
  // Load units
  const { data: units, error: unitsError } = await supabase
    .from('units')
    .select('id, name');
  
  if (unitsError) {
    console.error('Error loading units:', unitsError);
  } else {
    units.forEach(unit => {
      unitMap.set(unit.name, unit.id);
    });
    console.log(`Loaded ${unitMap.size} units.`);
  }
}

// Function to import shippers
async function importShippers(data) {
  console.log('Importing shippers...');
  
  // Extract unique shippers from the data
  const uniqueShippers = new Map();
  
  data.forEach(row => {
    if (row.shipper_name && !uniqueShippers.has(row.shipper_name)) {
      uniqueShippers.set(row.shipper_name, {
        name: row.shipper_name,
        address: row.shipper_address || null,
        email: row.shipper_email || null,
        phone: row.shipper_phone || null
      });
    }
  });
  
  // Import each shipper
  for (const [shipperName, shipperData] of uniqueShippers.entries()) {
    try {
      // Skip if shipper already exists
      if (shipperMap.has(shipperName)) {
        console.log(`Shipper "${shipperName}" already exists with ID: ${shipperMap.get(shipperName)}`);
        continue;
      }
      
      // Create new shipper
      const { data: newShipper, error: insertError } = await supabase
        .from('shippers')
        .insert([shipperData])
        .select();
      
      if (insertError) {
        console.error(`Error creating shipper ${shipperName}:`, insertError);
        continue;
      }
      
      const shipperId = newShipper[0].id;
      console.log(`Created shipper "${shipperName}" with ID: ${shipperId}`);
      
      // Store the shipper ID in the map
      shipperMap.set(shipperName, shipperId);
    } catch (error) {
      console.error(`Error processing shipper ${shipperName}:`, error);
    }
  }
  
  console.log(`Imported ${shipperMap.size} shippers.`);
}

// Function to import buyers
async function importBuyers(data) {
  console.log('Importing buyers...');
  
  // Extract unique buyers from the data
  const uniqueBuyers = new Map();
  
  data.forEach(row => {
    if (row.buyer_name && !uniqueBuyers.has(row.buyer_name)) {
      uniqueBuyers.set(row.buyer_name, {
        name: row.buyer_name,
        address: row.buyer_address || null,
        email: row.buyer_email || null,
        phone: row.buyer_phone || null
      });
    }
  });
  
  // Import each buyer
  for (const [buyerName, buyerData] of uniqueBuyers.entries()) {
    try {
      // Skip if buyer already exists
      if (buyerMap.has(buyerName)) {
        console.log(`Buyer "${buyerName}" already exists with ID: ${buyerMap.get(buyerName)}`);
        continue;
      }
      
      // Create new buyer
      const { data: newBuyer, error: insertError } = await supabase
        .from('buyers')
        .insert([buyerData])
        .select();
      
      if (insertError) {
        console.error(`Error creating buyer ${buyerName}:`, insertError);
        continue;
      }
      
      const buyerId = newBuyer[0].id;
      console.log(`Created buyer "${buyerName}" with ID: ${buyerId}`);
      
      // Store the buyer ID in the map
      buyerMap.set(buyerName, buyerId);
    } catch (error) {
      console.error(`Error processing buyer ${buyerName}:`, error);
    }
  }
  
  console.log(`Imported ${buyerMap.size} buyers.`);
}

// Function to import commodities
async function importCommodities(data) {
  console.log('Importing commodities...');
  
  // Extract unique commodities from the data
  const uniqueCommodities = new Map();
  
  data.forEach(row => {
    if (row.commodity_name && !uniqueCommodities.has(row.commodity_name)) {
      uniqueCommodities.set(row.commodity_name, {
        name: row.commodity_name,
        description: row.commodity_description || null
      });
    }
  });
  
  // Import each commodity
  for (const [commodityName, commodityData] of uniqueCommodities.entries()) {
    try {
      // Skip if commodity already exists
      if (commodityMap.has(commodityName)) {
        console.log(`Commodity "${commodityName}" already exists with ID: ${commodityMap.get(commodityName)}`);
        continue;
      }
      
      // Create new commodity
      const { data: newCommodity, error: insertError } = await supabase
        .from('commodities')
        .insert([commodityData])
        .select();
      
      if (insertError) {
        console.error(`Error creating commodity ${commodityName}:`, insertError);
        continue;
      }
      
      const commodityId = newCommodity[0].id;
      console.log(`Created commodity "${commodityName}" with ID: ${commodityId}`);
      
      // Store the commodity ID in the map
      commodityMap.set(commodityName, commodityId);
    } catch (error) {
      console.error(`Error processing commodity ${commodityName}:`, error);
    }
  }
  
  console.log(`Imported ${commodityMap.size} commodities.`);
}

// Function to import units
async function importUnits(data) {
  console.log('Importing units...');
  
  // Extract unique units from the data
  const uniqueUnits = new Map();
  
  data.forEach(row => {
    if (row.unit_name && !uniqueUnits.has(row.unit_name)) {
      uniqueUnits.set(row.unit_name, {
        name: row.unit_name,
        description: row.unit_description || null
      });
    }
  });
  
  // Import each unit
  for (const [unitName, unitData] of uniqueUnits.entries()) {
    try {
      // Skip if unit already exists
      if (unitMap.has(unitName)) {
        console.log(`Unit "${unitName}" already exists with ID: ${unitMap.get(unitName)}`);
        continue;
      }
      
      // Create new unit
      const { data: newUnit, error: insertError } = await supabase
        .from('units')
        .insert([unitData])
        .select();
      
      if (insertError) {
        console.error(`Error creating unit ${unitName}:`, insertError);
        continue;
      }
      
      const unitId = newUnit[0].id;
      console.log(`Created unit "${unitName}" with ID: ${unitId}`);
      
      // Store the unit ID in the map
      unitMap.set(unitName, unitId);
    } catch (error) {
      console.error(`Error processing unit ${unitName}:`, error);
    }
  }
  
  console.log(`Imported ${unitMap.size} units.`);
}

// Function to import orders
async function importOrders(data) {
  console.log('Importing orders...');
  
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
  
  // Import each order
  for (const [orderNumber, orderRows] of orderGroups.entries()) {
    try {
      // Use the first row for order details
      const firstRow = orderRows[0];
      
      // Skip if client doesn't exist
      if (!firstRow.client_name || !clientMap.has(firstRow.client_name)) {
        console.warn(`Skipping order ${orderNumber}: Client "${firstRow.client_name}" not found.`);
        continue;
      }
      
      // Prepare contact ID if available
      let contactId = null;
      if (firstRow.contact_name) {
        const contactKey = `${firstRow.client_name}:${firstRow.contact_name}`;
        if (contactMap.has(contactKey)) {
          contactId = contactMap.get(contactKey);
        }
      }
      
      // Prepare shipper ID if available
      let shipperId = null;
      if (firstRow.shipper_name && shipperMap.has(firstRow.shipper_name)) {
        shipperId = shipperMap.get(firstRow.shipper_name);
      }
      
      // Prepare buyer ID if available
      let buyerId = null;
      if (firstRow.buyer_name && buyerMap.has(firstRow.buyer_name)) {
        buyerId = buyerMap.get(firstRow.buyer_name);
      }
      
      // Determine order type
      const type = firstRow.order_type?.toLowerCase() === 'international' ? 'international' : 'local';
      
      // Format dates
      const orderDate = formatDate(firstRow.order_date) || new Date().toISOString().split('T')[0];
      const billOfLadingDate = formatDate(firstRow.bill_of_lading_date);
      const inspectionDateStarted = formatDate(firstRow.inspection_date_started);
      const inspectionDateCompleted = formatDate(firstRow.inspection_date_completed);
      
      // Prepare order data
      const orderData = {
        order_number: orderNumber,
        client_id: clientMap.get(firstRow.client_name),
        contact_id: contactId,
        type: type,
        team_id: AGRI_TEAM_ID,
        order_date: orderDate,
        client_ref_code: firstRow.client_ref_code || null,
        shipper_id: shipperId,
        buyer_id: buyerId,
        vessel_carrier: firstRow.vessel_carrier || null,
        bill_of_lading: firstRow.bill_of_lading || null,
        bill_of_lading_date: billOfLadingDate,
        inspection_place: firstRow.inspection_place || null,
        inspection_date_started: inspectionDateStarted,
        inspection_date_completed: inspectionDateCompleted,
        status: firstRow.status?.toLowerCase() || 'draft',
        notes: firstRow.notes || null
      };
      
      // Check if order already exists
      const { data: existingOrders, error: searchError } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('order_number', orderNumber)
        .limit(1);
      
      if (searchError) {
        console.error(`Error searching for order ${orderNumber}:`, searchError);
        continue;
      }
      
      let orderId;
      
      if (existingOrders && existingOrders.length > 0) {
        // Order already exists, use existing ID
        orderId = existingOrders[0].id;
        console.log(`Order "${orderNumber}" already exists with ID: ${orderId}`);
        
        // Update the existing order
        const { error: updateError } = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', orderId);
        
        if (updateError) {
          console.error(`Error updating order ${orderNumber}:`, updateError);
        } else {
          console.log(`Updated order "${orderNumber}"`);
        }
      } else {
        // Create new order
        const { data: newOrder, error: insertError } = await supabase
          .from('orders')
          .insert([orderData])
          .select();
        
        if (insertError) {
          console.error(`Error creating order ${orderNumber}:`, insertError);
          continue;
        }
        
        orderId = newOrder[0].id;
        console.log(`Created order "${orderNumber}" with ID: ${orderId}`);
      }
      
      // Store the order ID in the map
      orderMap.set(orderNumber, orderId);
      
      // Import order items
      await importOrderItems(orderRows, orderId);
    } catch (error) {
      console.error(`Error processing order ${orderNumber}:`, error);
    }
  }
  
  console.log(`Imported ${orderMap.size} orders.`);
}

// Function to import order items
async function importOrderItems(orderRows, orderId) {
  // Process each row as an order item
  for (const row of orderRows) {
    try {
      // Skip if commodity doesn't exist
      if (!row.commodity_name) {
        console.warn(`Skipping order item: Missing commodity name.`);
        continue;
      }
      
      // Get or create commodity
      let commodityId = commodityMap.get(row.commodity_name);
      if (!commodityId) {
        const { data: newCommodity, error: insertError } = await supabase
          .from('commodities')
          .insert([{ name: row.commodity_name, description: row.commodity_description || null }])
          .select();
        
        if (insertError) {
          console.error(`Error creating commodity ${row.commodity_name}:`, insertError);
          continue;
        }
        
        commodityId = newCommodity[0].id;
        commodityMap.set(row.commodity_name, commodityId);
        console.log(`Created commodity "${row.commodity_name}" with ID: ${commodityId}`);
      }
      
      // Get or create unit
      let unitId = unitMap.get(row.unit_name);
      if (!unitId) {
        const { data: newUnit, error: insertError } = await supabase
          .from('units')
          .insert([{ name: row.unit_name, description: row.unit_description || null }])
          .select();
        
        if (insertError) {
          console.error(`Error creating unit ${row.unit_name}:`, insertError);
          continue;
        }
        
        unitId = newUnit[0].id;
        unitMap.set(row.unit_name, unitId);
        console.log(`Created unit "${row.unit_name}" with ID: ${unitId}`);
      }
      
      if (!commodityId || !unitId) {
        console.warn(`Skipping order item: Missing commodity or unit ID.`);
        continue;
      }
      
      // Prepare order item data
      const orderItemData = {
        order_id: orderId,
        commodity_id: commodityId,
        quantity: parseFloat(row.quantity) || 0,
        unit_id: unitId,
        commodity_description: row.item_description || null
      };
      
      // Check if order item already exists
      const { data: existingItems, error: searchError } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', orderId)
        .eq('commodity_id', orderItemData.commodity_id)
        .limit(1);
      
      if (searchError) {
        console.error(`Error searching for order item:`, searchError);
        continue;
      }
      
      if (existingItems && existingItems.length > 0) {
        // Order item already exists, update it
        const { error: updateError } = await supabase
          .from('order_items')
          .update(orderItemData)
          .eq('id', existingItems[0].id);
        
        if (updateError) {
          console.error(`Error updating order item:`, updateError);
        } else {
          console.log(`Updated order item for commodity "${row.commodity_name}"`);
        }
      } else {
        // Create new order item
        const { error: insertError } = await supabase
          .from('order_items')
          .insert([orderItemData]);
        
        if (insertError) {
          console.error(`Error creating order item:`, insertError);
        } else {
          console.log(`Created order item for commodity "${row.commodity_name}"`);
        }
      }
    } catch (error) {
      console.error(`Error processing order item:`, error);
    }
  }
}

// Main function to run the import process
async function main() {
  try {
    // Test connection first
    const connectionSuccessful = await testConnection();
    if (!connectionSuccessful) {
      console.error('Failed to connect to Supabase. Please check your credentials.');
      process.exit(1);
    }
    
    // Check if file path is provided
    const filePath = process.argv[2];
    if (!filePath) {
      console.error('Please provide a CSV file path as an argument.');
      process.exit(1);
    }
    
    console.log(`Reading CSV file: ${filePath}`);
    const data = await readCSV(filePath);
    console.log(`Read ${data.length} rows from CSV.`);
    
    // Load existing data
    await loadExistingData();
    
    // Import data in the correct order
    await importShippers(data);
    await importBuyers(data);
    await importCommodities(data);
    await importUnits(data);
    await importOrders(data);
    
    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Error during import process:', error);
    process.exit(1);
  }
}

// Run the main function
main();
