const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env.local') });

// Initialize PostgreSQL client
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

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
      const existingClientsResult = await client.query(
        'SELECT id, name, team_ids FROM clients WHERE name = $1 LIMIT 1',
        [clientName]
      );

      let clientId;

      if (existingClientsResult.rows.length > 0) {
        clientId = existingClientsResult.rows[0].id;
        console.log(`Client "${clientName}" already exists with ID: ${clientId}`);
        
        // Update team_ids if needed
        if (existingClientsResult.rows[0].team_ids && !existingClientsResult.rows[0].team_ids.includes(AGRI_TEAM_ID)) {
          const updatedTeamIds = [...existingClientsResult.rows[0].team_ids, AGRI_TEAM_ID];
          
          await client.query(
            'UPDATE clients SET team_ids = $1 WHERE id = $2',
            [updatedTeamIds, clientId]
          );
            
          console.log(`Updated team_ids for client "${clientName}"`);
        }
      } else {
        const newClientResult = await client.query(
          'INSERT INTO clients(name, address, email, phone, team_ids) VALUES($1, $2, $3, $4, $5) RETURNING id',
          [clientData.name, clientData.address, clientData.email, clientData.phone, clientData.team_ids]
        );

        clientId = newClientResult.rows[0].id;
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
      const existingContactsResult = await client.query(
        'SELECT id, full_name FROM contacts WHERE client_id = $1 AND full_name = $2 LIMIT 1',
        [contactData.client_id, contactData.full_name]
      );

      let contactId;

      if (existingContactsResult.rows.length > 0) {
        contactId = existingContactsResult.rows[0].id;
        console.log(`Contact "${contactKey}" already exists with ID: ${contactId}`);
        
        // Update contact information
        await client.query(
          'UPDATE contacts SET position = $1, email = $2, phone = $3 WHERE id = $4',
          [contactData.position, contactData.email, contactData.phone, contactId]
        );
      } else {
        const newContactResult = await client.query(
          'INSERT INTO contacts(client_id, full_name, position, email, phone) VALUES($1, $2, $3, $4, $5) RETURNING id',
          [contactData.client_id, contactData.full_name, contactData.position, contactData.email, contactData.phone]
        );

        contactId = newContactResult.rows[0].id;
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
      const existingShippersResult = await client.query(
        'SELECT id, name FROM shippers WHERE name = $1 LIMIT 1',
        [shipperName]
      );

      let shipperId;

      if (existingShippersResult.rows.length > 0) {
        shipperId = existingShippersResult.rows[0].id;
        console.log(`Shipper "${shipperName}" already exists with ID: ${shipperId}`);
        
        // Update shipper information
        await client.query(
          'UPDATE shippers SET address = $1, email = $2, phone = $3 WHERE id = $4',
          [shipperData.address, shipperData.email, shipperData.phone, shipperId]
        );
      } else {
        const newShipperResult = await client.query(
          'INSERT INTO shippers(name, address, email, phone) VALUES($1, $2, $3, $4) RETURNING id',
          [shipperData.name, shipperData.address, shipperData.email, shipperData.phone]
        );

        shipperId = newShipperResult.rows[0].id;
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
      const existingBuyersResult = await client.query(
        'SELECT id, name FROM buyers WHERE name = $1 LIMIT 1',
        [buyerName]
      );

      let buyerId;

      if (existingBuyersResult.rows.length > 0) {
        buyerId = existingBuyersResult.rows[0].id;
        console.log(`Buyer "${buyerName}" already exists with ID: ${buyerId}`);
        
        // Update buyer information
        await client.query(
          'UPDATE buyers SET address = $1, email = $2, phone = $3 WHERE id = $4',
          [buyerData.address, buyerData.email, buyerData.phone, buyerId]
        );
      } else {
        const newBuyerResult = await client.query(
          'INSERT INTO buyers(name, address, email, phone) VALUES($1, $2, $3, $4) RETURNING id',
          [buyerData.name, buyerData.address, buyerData.email, buyerData.phone]
        );

        buyerId = newBuyerResult.rows[0].id;
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
      });
    }
  });

  for (const [commodityName, commodityData] of uniqueCommodities.entries()) {
    try {
      const existingCommoditiesResult = await client.query(
        'SELECT id, name FROM commodities WHERE name = $1 LIMIT 1',
        [commodityName]
      );

      let commodityId;

      if (existingCommoditiesResult.rows.length > 0) {
        commodityId = existingCommoditiesResult.rows[0].id;
        console.log(`Commodity "${commodityName}" already exists with ID: ${commodityId}`);
        
        // Update commodity information
        await client.query(
          'UPDATE commodities SET description = $1 WHERE id = $2',
          [commodityData.description, commodityId]
        );
      } else {
        const newCommodityResult = await client.query(
          'INSERT INTO commodities(name, description) VALUES($1, $2) RETURNING id',
          [commodityData.name, commodityData.description]
        );

        commodityId = newCommodityResult.rows[0].id;
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
      const existingUnitsResult = await client.query(
        'SELECT id, name FROM units WHERE name = $1 LIMIT 1',
        [unitName]
      );

      let unitId;

      if (existingUnitsResult.rows.length > 0) {
        unitId = existingUnitsResult.rows[0].id;
        console.log(`Unit "${unitName}" already exists with ID: ${unitId}`);
        
        // Update unit information
        await client.query(
          'UPDATE units SET description = $1 WHERE id = $2',
          [unitData.description, unitId]
        );
      } else {
        const newUnitResult = await client.query(
          'INSERT INTO units(name, description) VALUES($1, $2) RETURNING id',
          [unitData.name, unitData.description]
        );

        unitId = newUnitResult.rows[0].id;
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

      // Check if order already exists
      const existingOrdersResult = await client.query(
        'SELECT id, order_number FROM orders WHERE order_number = $1 LIMIT 1',
        [orderNumber]
      );

      let orderId;

      if (existingOrdersResult.rows.length > 0) {
        // Order already exists, use existing ID
        orderId = existingOrdersResult.rows[0].id;
        console.log(`Order "${orderNumber}" already exists with ID: ${orderId}`);

        // Update the existing order
        await client.query(`
          UPDATE orders SET 
            client_id = $1, 
            contact_id = $2, 
            type = $3, 
            team_id = $4, 
            order_date = $5, 
            client_ref_code = $6, 
            shipper_id = $7, 
            buyer_id = $8, 
            vessel_carrier = $9, 
            bill_of_lading = $10, 
            bill_of_lading_date = $11, 
            inspection_place = $12, 
            status = $13, 
            notes = $14
          WHERE id = $15
        `, [
          clientMap.get(firstRow.client_name),
          contactId,
          type,
          AGRI_TEAM_ID,
          orderDate,
          firstRow.client_ref_code || null,
          shipperId,
          buyerId,
          firstRow.vessel_carrier || null,
          firstRow.bill_of_lading || null,
          billOfLadingDate,
          firstRow.inspection_place || null,
          firstRow.status?.toLowerCase() || 'draft',
          firstRow.notes || null,
          orderId
        ]);

        console.log(`Updated order "${orderNumber}"`);
      } else {
        // Create new order
        const newOrderResult = await client.query(`
          INSERT INTO orders (
            order_number, 
            client_id, 
            contact_id, 
            type, 
            team_id, 
            order_date, 
            client_ref_code, 
            shipper_id, 
            buyer_id, 
            vessel_carrier, 
            bill_of_lading, 
            bill_of_lading_date, 
            inspection_place, 
            status, 
            notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING id
        `, [
          orderNumber,
          clientMap.get(firstRow.client_name),
          contactId,
          type,
          AGRI_TEAM_ID,
          orderDate,
          firstRow.client_ref_code || null,
          shipperId,
          buyerId,
          firstRow.vessel_carrier || null,
          firstRow.bill_of_lading || null,
          billOfLadingDate,
          firstRow.inspection_place || null,
          firstRow.status?.toLowerCase() || 'draft',
          firstRow.notes || null
        ]);

        orderId = newOrderResult.rows[0].id;
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

      const commodityId = commodityMap.get(row.commodity_name);
      const unitId = unitMap.get(row.unit_name);
      const quantity = parseFloat(row.quantity) || 0;
      const commodityDescription = row.item_description || null;

      // Check if order item already exists
      const existingItemsResult = await client.query(
        'SELECT id FROM order_items WHERE order_id = $1 AND commodity_id = $2 LIMIT 1',
        [orderId, commodityId]
      );

      if (existingItemsResult.rows.length > 0) {
        // Order item already exists, update it
        await client.query(`
          UPDATE order_items SET 
            quantity = $1, 
            unit_id = $2, 
            commodity_description = $3
          WHERE id = $4
        `, [
          quantity,
          unitId,
          commodityDescription,
          existingItemsResult.rows[0].id
        ]);

        console.log(`Updated order item for commodity "${row.commodity_name}"`);
      } else {
        // Create new order item
        await client.query(`
          INSERT INTO order_items (
            order_id, 
            commodity_id, 
            quantity, 
            unit_id, 
            commodity_description
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          orderId,
          commodityId,
          quantity,
          unitId,
          commodityDescription
        ]);

        console.log(`Created order item for commodity "${row.commodity_name}"`);
      }
    } catch (error) {
      console.error(`Error processing order item:`, error);
    }
  }
}

// Main function to run the import process
async function main() {
  try {
    // Check if file path is provided
    const filePath = process.argv[2];
    if (!filePath) {
      console.error('Please provide a CSV file path as an argument.');
      process.exit(1);
    }

    // Connect to PostgreSQL
    await client.connect();
    console.log('Connected to PostgreSQL');

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
  } finally {
    // Close PostgreSQL connection
    await client.end();
    console.log('Disconnected from PostgreSQL');
  }
}

// Run the main function
main();
