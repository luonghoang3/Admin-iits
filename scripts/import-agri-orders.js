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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('Missing Supabase service role key. Please check your .env.local file.');
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'undefined');
console.log('Service Role Key:', supabaseServiceKey ? supabaseServiceKey.substring(0, 10) + '...' : 'undefined');

// Maps to store relationships between old and new IDs
const clientMap = new Map();
const contactMap = new Map();
const shipperMap = new Map();
const buyerMap = new Map();
const commodityMap = new Map();
const unitMap = new Map();
const orderMap = new Map();

// ID của team Agri
const AGRI_TEAM_ID = '26b6ad02-03c0-45ac-9b65-3caeac723829';

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

// Helper function to format date
function formatDate(dateStr) {
  if (!dateStr) return null;

  // Try to parse the date
  try {
    // Handle different date formats
    let parts;
    if (dateStr.includes('/')) {
      parts = dateStr.split('/');
    } else if (dateStr.includes('-')) {
      parts = dateStr.split('-');
    } else {
      return null;
    }

    // Check if we have day/month/year format
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      // Validate date parts
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return null;
      }

      // Format as YYYY-MM-DD
      const formattedYear = year < 100 ? 2000 + year : year;
      return `${formattedYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    return null;
  } catch (error) {
    console.error(`Error formatting date ${dateStr}:`, error);
    return null;
  }
}

// Import clients
async function importClients(data) {
  console.log('Importing clients...');

  const uniqueClients = new Map();

  data.forEach(row => {
    if (row.client_name && !uniqueClients.has(row.client_name)) {
      uniqueClients.set(row.client_name, {
        name: row.client_name,
        address: row.client_address || null,
        email: row.client_email || null,
        phone: row.client_phone || null,
        team_ids: [AGRI_TEAM_ID] // Assign to Agri team
      });
    }
  });

  for (const [clientName, clientData] of uniqueClients.entries()) {
    try {
      // Check if client already exists
      const { data: existingClients, error: searchError } = await supabase
        .from('clients')
        .select('id, name, team_ids')
        .eq('name', clientName)
        .limit(1);

      if (searchError) {
        console.error(`Error searching for client ${clientName}:`, searchError);
        continue;
      }

      let clientId;

      if (existingClients && existingClients.length > 0) {
        clientId = existingClients[0].id;
        console.log(`Client "${clientName}" already exists with ID: ${clientId}`);

        // Update team_ids if needed
        if (existingClients[0].team_ids && !existingClients[0].team_ids.includes(AGRI_TEAM_ID)) {
          const updatedTeamIds = [...existingClients[0].team_ids, AGRI_TEAM_ID];

          const { error: updateError } = await supabase
            .from('clients')
            .update({ team_ids: updatedTeamIds })
            .eq('id', clientId);

          if (updateError) {
            console.error(`Error updating team_ids for client ${clientName}:`, updateError);
          } else {
            console.log(`Updated team_ids for client "${clientName}"`);
          }
        }
      } else {
        const { data: newClient, error: insertError } = await supabase
          .from('clients')
          .insert([clientData])
          .select();

        if (insertError) {
          console.error(`Error creating client ${clientName}:`, insertError);
          continue;
        }

        clientId = newClient[0].id;
        console.log(`Created client "${clientName}" with ID: ${clientId}`);
      }

      clientMap.set(clientName, clientId);
    } catch (error) {
      console.error(`Error processing client ${clientName}:`, error);
    }
  }

  console.log(`Imported ${clientMap.size} clients.`);
}

// Import contacts
async function importContacts(data) {
  console.log('Importing contacts...');

  const uniqueContacts = new Map();

  data.forEach(row => {
    if (row.client_name && row.contact_name && !uniqueContacts.has(`${row.client_name}:${row.contact_name}`)) {
      uniqueContacts.set(`${row.client_name}:${row.contact_name}`, {
        client_id: clientMap.get(row.client_name),
        full_name: row.contact_name,
        position: row.contact_position || null,
        email: row.contact_email || null,
        phone: row.contact_phone || null
      });
    }
  });

  for (const [contactKey, contactData] of uniqueContacts.entries()) {
    try {
      // Skip if client doesn't exist
      if (!contactData.client_id) {
        console.warn(`Skipping contact ${contactKey}: Client not found.`);
        continue;
      }

      // Check if contact already exists
      const { data: existingContacts, error: searchError } = await supabase
        .from('contacts')
        .select('id, full_name')
        .eq('client_id', contactData.client_id)
        .eq('full_name', contactData.full_name)
        .limit(1);

      if (searchError) {
        console.error(`Error searching for contact ${contactKey}:`, searchError);
        continue;
      }

      let contactId;

      if (existingContacts && existingContacts.length > 0) {
        contactId = existingContacts[0].id;
        console.log(`Contact "${contactKey}" already exists with ID: ${contactId}`);
      } else {
        const { data: newContact, error: insertError } = await supabase
          .from('contacts')
          .insert([contactData])
          .select();

        if (insertError) {
          console.error(`Error creating contact ${contactKey}:`, insertError);
          continue;
        }

        contactId = newContact[0].id;
        console.log(`Created contact "${contactKey}" with ID: ${contactId}`);
      }

      contactMap.set(contactKey, contactId);
    } catch (error) {
      console.error(`Error processing contact ${contactKey}:`, error);
    }
  }

  console.log(`Imported ${contactMap.size} contacts.`);
}

// Import shippers
async function importShippers(data) {
  console.log('Importing shippers...');

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

  for (const [shipperName, shipperData] of uniqueShippers.entries()) {
    try {
      const { data: existingShippers, error: searchError } = await supabase
        .from('shippers')
        .select('id, name')
        .eq('name', shipperName)
        .limit(1);

      if (searchError) {
        console.error(`Error searching for shipper ${shipperName}:`, searchError);
        continue;
      }

      let shipperId;

      if (existingShippers && existingShippers.length > 0) {
        shipperId = existingShippers[0].id;
        console.log(`Shipper "${shipperName}" already exists with ID: ${shipperId}`);
      } else {
        const { data: newShipper, error: insertError } = await supabase
          .from('shippers')
          .insert([shipperData])
          .select();

        if (insertError) {
          console.error(`Error creating shipper ${shipperName}:`, insertError);
          continue;
        }

        shipperId = newShipper[0].id;
        console.log(`Created shipper "${shipperName}" with ID: ${shipperId}`);
      }

      shipperMap.set(shipperName, shipperId);
    } catch (error) {
      console.error(`Error processing shipper ${shipperName}:`, error);
    }
  }

  console.log(`Imported ${shipperMap.size} shippers.`);
}

// Import buyers
async function importBuyers(data) {
  console.log('Importing buyers...');

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

  for (const [buyerName, buyerData] of uniqueBuyers.entries()) {
    try {
      const { data: existingBuyers, error: searchError } = await supabase
        .from('buyers')
        .select('id, name')
        .eq('name', buyerName)
        .limit(1);

      if (searchError) {
        console.error(`Error searching for buyer ${buyerName}:`, searchError);
        continue;
      }

      let buyerId;

      if (existingBuyers && existingBuyers.length > 0) {
        buyerId = existingBuyers[0].id;
        console.log(`Buyer "${buyerName}" already exists with ID: ${buyerId}`);
      } else {
        const { data: newBuyer, error: insertError } = await supabase
          .from('buyers')
          .insert([buyerData])
          .select();

        if (insertError) {
          console.error(`Error creating buyer ${buyerName}:`, insertError);
          continue;
        }

        buyerId = newBuyer[0].id;
        console.log(`Created buyer "${buyerName}" with ID: ${buyerId}`);
      }

      buyerMap.set(buyerName, buyerId);
    } catch (error) {
      console.error(`Error processing buyer ${buyerName}:`, error);
    }
  }

  console.log(`Imported ${buyerMap.size} buyers.`);
}

// Import commodities
async function importCommodities(data) {
  console.log('Importing commodities...');

  const uniqueCommodities = new Map();

  data.forEach(row => {
    if (row.commodity_name && !uniqueCommodities.has(row.commodity_name)) {
      uniqueCommodities.set(row.commodity_name, {
        name: row.commodity_name,
        description: row.commodity_description || null
        // Removed team_id as it doesn't exist in the table
      });
    }
  });

  for (const [commodityName, commodityData] of uniqueCommodities.entries()) {
    try {
      const { data: existingCommodities, error: searchError } = await supabase
        .from('commodities')
        .select('id, name')
        .eq('name', commodityName)
        .limit(1);

      if (searchError) {
        console.error(`Error searching for commodity ${commodityName}:`, searchError);
        continue;
      }

      let commodityId;

      if (existingCommodities && existingCommodities.length > 0) {
        commodityId = existingCommodities[0].id;
        console.log(`Commodity "${commodityName}" already exists with ID: ${commodityId}`);

        // Update team_id if needed
        const { error: updateError } = await supabase
          .from('commodities')
          .update({ team_id: AGRI_TEAM_ID })
          .eq('id', commodityId);

        if (updateError) {
          console.error(`Error updating team_id for commodity ${commodityName}:`, updateError);
        }
      } else {
        const { data: newCommodity, error: insertError } = await supabase
          .from('commodities')
          .insert([commodityData])
          .select();

        if (insertError) {
          console.error(`Error creating commodity ${commodityName}:`, insertError);
          continue;
        }

        commodityId = newCommodity[0].id;
        console.log(`Created commodity "${commodityName}" with ID: ${commodityId}`);
      }

      commodityMap.set(commodityName, commodityId);
    } catch (error) {
      console.error(`Error processing commodity ${commodityName}:`, error);
    }
  }

  console.log(`Imported ${commodityMap.size} commodities.`);
}

// Import units
async function importUnits(data) {
  console.log('Importing units...');

  const uniqueUnits = new Map();

  data.forEach(row => {
    if (row.unit_name && !uniqueUnits.has(row.unit_name)) {
      uniqueUnits.set(row.unit_name, {
        name: row.unit_name,
        description: row.unit_description || null
      });
    }
  });

  for (const [unitName, unitData] of uniqueUnits.entries()) {
    try {
      const { data: existingUnits, error: searchError } = await supabase
        .from('units')
        .select('id, name')
        .eq('name', unitName)
        .limit(1);

      if (searchError) {
        console.error(`Error searching for unit ${unitName}:`, searchError);
        continue;
      }

      let unitId;

      if (existingUnits && existingUnits.length > 0) {
        unitId = existingUnits[0].id;
        console.log(`Unit "${unitName}" already exists with ID: ${unitId}`);
      } else {
        const { data: newUnit, error: insertError } = await supabase
          .from('units')
          .insert([unitData])
          .select();

        if (insertError) {
          console.error(`Error creating unit ${unitName}:`, insertError);
          continue;
        }

        unitId = newUnit[0].id;
        console.log(`Created unit "${unitName}" with ID: ${unitId}`);
      }

      unitMap.set(unitName, unitId);
    } catch (error) {
      console.error(`Error processing unit ${unitName}:`, error);
    }
  }

  console.log(`Imported ${unitMap.size} units.`);
}

// Import orders
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

  for (const [orderNumber, orderRows] of orderGroups.entries()) {
    try {
      const firstRow = orderRows[0];

      // Skip if client doesn't exist
      if (!firstRow.client_name || !clientMap.has(firstRow.client_name)) {
        console.warn(`Skipping order ${orderNumber}: Client "${firstRow.client_name}" not found.`);
        continue;
      }

      // Get contact ID if available
      let contactId = null;
      if (firstRow.contact_name && contactMap.has(`${firstRow.client_name}:${firstRow.contact_name}`)) {
        contactId = contactMap.get(`${firstRow.client_name}:${firstRow.contact_name}`);
      }

      // Get shipper ID if available
      let shipperId = null;
      if (firstRow.shipper_name && shipperMap.has(firstRow.shipper_name)) {
        shipperId = shipperMap.get(firstRow.shipper_name);
      }

      // Get buyer ID if available
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
        team_id: AGRI_TEAM_ID, // Assign to Agri team
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
      const { data: existingOrders, error: checkError } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('order_number', orderNumber)
        .limit(1);

      if (checkError) {
        console.error(`Error checking order ${orderNumber}:`, checkError);
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

// Import order items
async function importOrderItems(orderRows, orderId) {
  // Process each row as an order item
  for (const row of orderRows) {
    try {
      // Skip if commodity or unit doesn't exist
      if (!row.commodity_name || !commodityMap.has(row.commodity_name)) {
        console.warn(`Skipping order item: Commodity "${row.commodity_name}" not found.`);
        continue;
      }

      if (!row.unit_name || !unitMap.has(row.unit_name)) {
        console.warn(`Skipping order item: Unit "${row.unit_name}" not found.`);
        continue;
      }

      // Prepare order item data
      const orderItemData = {
        order_id: orderId,
        commodity_id: commodityMap.get(row.commodity_name),
        quantity: parseFloat(row.quantity) || 0,
        unit_id: unitMap.get(row.unit_name),
        commodity_description: row.item_description || null
      };

      // Check if order item already exists
      const { data: existingItems, error: checkError } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', orderId)
        .eq('commodity_id', orderItemData.commodity_id)
        .limit(1);

      if (checkError) {
        console.error(`Error checking order item:`, checkError);
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

// Test Supabase connection
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('clients').select('count').limit(1);

    if (error) {
      console.error('Error connecting to Supabase:', error);
      return false;
    }

    console.log('Successfully connected to Supabase!');
    return true;
  } catch (error) {
    console.error('Exception during connection test:', error);
    return false;
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

    // Import data in the correct order
    await importClients(data);
    await importContacts(data);
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
