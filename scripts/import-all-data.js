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

// Maps to store relationships between old and new IDs
const clientMap = new Map();
const contactMap = new Map();
const shipperMap = new Map();
const buyerMap = new Map();
const commodityMap = new Map();
const unitMap = new Map();
const orderMap = new Map();
const teamMap = new Map();
const categoryMap = new Map();

// Department to team mapping
const departmentTeamMapping = {
  'AF': null, // Will be filled from database
  'CG': null, // Will be filled from database
  'MR': null, // Will be filled from database
  'Agri': null, // Will be filled from database
  'Cargo': null, // Will be filled from database
  'Marine': null // Will be filled from database
};

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
    // Check if the first part is day or month
    if (parts[0].length <= 2 && parts[1].length <= 2) {
      // Assuming DD/MM/YYYY format
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${month}-${day}`;
    } else {
      // Assuming MM/DD/YYYY format
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

// Function to fetch teams from database
async function fetchTeams() {
  console.log('Fetching teams from database...');

  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, name');

    if (error) {
      console.error('Error fetching teams:', error);
      return false;
    }

    if (teams && teams.length > 0) {
      teams.forEach(team => {
        teamMap.set(team.name, team.id);

        // Map department codes to team IDs
        if (team.name.includes('AF') || team.name.includes('Agri')) {
          departmentTeamMapping['AF'] = team.id;
          departmentTeamMapping['Agri'] = team.id; // Add direct mapping for "Agri"
        } else if (team.name.includes('CG') || team.name.includes('Cargo')) {
          departmentTeamMapping['CG'] = team.id;
          departmentTeamMapping['Cargo'] = team.id; // Add direct mapping for "Cargo"
        } else if (team.name.includes('MR') || team.name.includes('Marine')) {
          departmentTeamMapping['MR'] = team.id;
          departmentTeamMapping['Marine'] = team.id; // Add direct mapping for "Marine"
        }
      });

      console.log('Teams fetched successfully:', teams.map(t => t.name).join(', '));
      console.log('Department mapping:', departmentTeamMapping);
      return true;
    } else {
      console.error('No teams found in database');
      return false;
    }
  } catch (error) {
    console.error('Error in fetchTeams:', error);
    return false;
  }
}

// Function to fetch categories from database
async function fetchCategories() {
  console.log('Fetching categories from database...');

  try {
    const { data: categories, error } = await supabase
      .from('categories_new')
      .select('id, name');

    if (error) {
      console.error('Error fetching categories:', error);
      return false;
    }

    if (categories && categories.length > 0) {
      categories.forEach(category => {
        categoryMap.set(category.name.toLowerCase(), category.id);
      });

      console.log(`Fetched ${categories.length} categories successfully`);
      return true;
    } else {
      console.error('No categories found in database');
      return false;
    }
  } catch (error) {
    console.error('Error in fetchCategories:', error);
    return false;
  }
}

// Function to import clients
async function importClients(data) {
  console.log('Importing clients...');

  // Extract unique clients from the data
  const uniqueClients = new Map();

  data.forEach(row => {
    if (row.client_Name && !uniqueClients.has(row.client_Name)) {
      // Get the team ID based on department
      let teamIds = [];
      if (row.department && departmentTeamMapping[row.department]) {
        teamIds = [departmentTeamMapping[row.department]];
      }

      uniqueClients.set(row.client_Name, {
        name: row.client_Name,
        address: row.client_address || null,
        email: null, // Not available in the CSV
        phone: null, // Not available in the CSV
        tax_id: null, // Not available in the CSV
        team_ids: teamIds,
        name_without_accent: removeAccents(row.client_Name),
        trade_name: row.client_trade_name || null // Import client_trade_name from CSV
      });
    }
  });

  console.log(`Found ${uniqueClients.size} unique clients in CSV.`);

  // Import each client
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
        // Client already exists, use existing ID
        clientId = existingClients[0].id;
        console.log(`Client "${clientName}" already exists with ID: ${clientId}`);

        // Update team_ids if needed
        if (clientData.team_ids.length > 0 && existingClients[0].team_ids) {
          const updatedTeamIds = [...new Set([...existingClients[0].team_ids, ...clientData.team_ids])];

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
        // Create new client
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

      // Store the client ID in the map
      clientMap.set(clientName, clientId);
    } catch (error) {
      console.error(`Error processing client ${clientName}:`, error);
    }
  }

  console.log(`Imported ${clientMap.size} clients.`);
}

// Helper function to remove Vietnamese accents
function removeAccents(str) {
  if (!str) return '';
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

// Function to import contacts
async function importContacts(data) {
  console.log('Importing contacts...');

  // Extract unique contacts from the data
  const uniqueContacts = new Map();

  data.forEach(row => {
    if (row.contact_name && row.client_Name && clientMap.has(row.client_Name)) {
      const contactKey = `${row.client_Name}:${row.contact_name}`;

      if (!uniqueContacts.has(contactKey)) {
        uniqueContacts.set(contactKey, {
          client_id: clientMap.get(row.client_Name),
          full_name: row.contact_name,
          position: null, // Not available in the CSV
          phone: row.contact_phone || null,
          email: row.contact_email || null
        });
      }
    }
  });

  console.log(`Found ${uniqueContacts.size} unique contacts in CSV.`);

  // Import each contact
  for (const [contactKey, contactData] of uniqueContacts.entries()) {
    try {
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
        // Contact already exists, use existing ID
        contactId = existingContacts[0].id;
        console.log(`Contact "${contactKey}" already exists with ID: ${contactId}`);
      } else {
        // Create new contact
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

      // Store the contact ID in the map
      contactMap.set(contactKey, contactId);
    } catch (error) {
      console.error(`Error processing contact ${contactKey}:`, error);
    }
  }

  console.log(`Imported ${contactMap.size} contacts.`);
}

// Function to import shippers
async function importShippers(data) {
  console.log('Importing shippers...');

  // Extract unique shippers from the data
  const uniqueShippers = new Map();

  data.forEach(row => {
    if (row.shipper_name && !uniqueShippers.has(row.shipper_name)) {
      // Get the team ID based on department
      let teamIds = [];
      if (row.department && departmentTeamMapping[row.department]) {
        teamIds = [departmentTeamMapping[row.department]];
      }

      uniqueShippers.set(row.shipper_name, {
        name: row.shipper_name,
        address: null, // Not available in the CSV
        email: null, // Not available in the CSV
        phone: null, // Not available in the CSV
        team_ids: teamIds
      });
    }
  });

  console.log(`Found ${uniqueShippers.size} unique shippers in CSV.`);

  // Import each shipper
  for (const [shipperName, shipperData] of uniqueShippers.entries()) {
    try {
      // Check if shipper already exists
      const { data: existingShippers, error: searchError } = await supabase
        .from('shippers')
        .select('id, name, team_ids')
        .eq('name', shipperName)
        .limit(1);

      if (searchError) {
        console.error(`Error searching for shipper ${shipperName}:`, searchError);
        continue;
      }

      let shipperId;

      if (existingShippers && existingShippers.length > 0) {
        // Shipper already exists, use existing ID
        shipperId = existingShippers[0].id;
        console.log(`Shipper "${shipperName}" already exists with ID: ${shipperId}`);

        // Update team_ids if needed
        if (shipperData.team_ids.length > 0 && existingShippers[0].team_ids) {
          const updatedTeamIds = [...new Set([...existingShippers[0].team_ids, ...shipperData.team_ids])];

          const { error: updateError } = await supabase
            .from('shippers')
            .update({ team_ids: updatedTeamIds })
            .eq('id', shipperId);

          if (updateError) {
            console.error(`Error updating team_ids for shipper ${shipperName}:`, updateError);
          } else {
            console.log(`Updated team_ids for shipper "${shipperName}"`);
          }
        }
      } else {
        // Create new shipper
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
      // Get the team ID based on department
      let teamIds = [];
      if (row.department && departmentTeamMapping[row.department]) {
        teamIds = [departmentTeamMapping[row.department]];
      }

      uniqueBuyers.set(row.buyer_name, {
        name: row.buyer_name,
        address: null, // Not available in the CSV
        email: null, // Not available in the CSV
        phone: null, // Not available in the CSV
        team_ids: teamIds
      });
    }
  });

  console.log(`Found ${uniqueBuyers.size} unique buyers in CSV.`);

  // Import each buyer
  for (const [buyerName, buyerData] of uniqueBuyers.entries()) {
    try {
      // Check if buyer already exists
      const { data: existingBuyers, error: searchError } = await supabase
        .from('buyers')
        .select('id, name, team_ids')
        .eq('name', buyerName)
        .limit(1);

      if (searchError) {
        console.error(`Error searching for buyer ${buyerName}:`, searchError);
        continue;
      }

      let buyerId;

      if (existingBuyers && existingBuyers.length > 0) {
        // Buyer already exists, use existing ID
        buyerId = existingBuyers[0].id;
        console.log(`Buyer "${buyerName}" already exists with ID: ${buyerId}`);

        // Update team_ids if needed
        if (buyerData.team_ids.length > 0 && existingBuyers[0].team_ids) {
          const updatedTeamIds = [...new Set([...existingBuyers[0].team_ids, ...buyerData.team_ids])];

          const { error: updateError } = await supabase
            .from('buyers')
            .update({ team_ids: updatedTeamIds })
            .eq('id', buyerId);

          if (updateError) {
            console.error(`Error updating team_ids for buyer ${buyerName}:`, updateError);
          } else {
            console.log(`Updated team_ids for buyer "${buyerName}"`);
          }
        }
      } else {
        // Create new buyer
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

      // Store the buyer ID in the map
      buyerMap.set(buyerName, buyerId);
    } catch (error) {
      console.error(`Error processing buyer ${buyerName}:`, error);
    }
  }

  console.log(`Imported ${buyerMap.size} buyers.`);
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
        description: null // Not available in the CSV
      });
    }
  });

  console.log(`Found ${uniqueUnits.size} unique units in CSV.`);

  // Import each unit
  for (const [unitName, unitData] of uniqueUnits.entries()) {
    try {
      // Check if unit already exists
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
        // Unit already exists, use existing ID
        unitId = existingUnits[0].id;
        console.log(`Unit "${unitName}" already exists with ID: ${unitId}`);
      } else {
        // Create new unit
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

      // Store the unit ID in the map
      unitMap.set(unitName, unitId);
    } catch (error) {
      console.error(`Error processing unit ${unitName}:`, error);
    }
  }

  console.log(`Imported ${unitMap.size} units.`);
}

// Function to import commodities
async function importCommodities(data) {
  console.log('Importing commodities...');

  // Extract unique commodities from the data
  const uniqueCommodities = new Map();

  data.forEach(row => {
    if (row.commodity_name && !uniqueCommodities.has(row.commodity_name)) {
      // Try to guess category based on commodity name
      let categoryId = null;
      const commodityNameLower = row.commodity_name.toLowerCase();

      // Simple category matching based on keywords
      for (const [categoryName, catId] of categoryMap.entries()) {
        if (commodityNameLower.includes(categoryName)) {
          categoryId = catId;
          break;
        }
      }

      uniqueCommodities.set(row.commodity_name, {
        name: row.commodity_name,
        description: row.item_description || null,
        category_id: categoryId
      });
    }
  });

  console.log(`Found ${uniqueCommodities.size} unique commodities in CSV.`);

  // Import each commodity
  for (const [commodityName, commodityData] of uniqueCommodities.entries()) {
    try {
      // Check if commodity already exists
      const { data: existingCommodities, error: searchError } = await supabase
        .from('commodities_new')
        .select('id, name')
        .eq('name', commodityName)
        .limit(1);

      if (searchError) {
        console.error(`Error searching for commodity ${commodityName}:`, searchError);
        continue;
      }

      let commodityId;

      if (existingCommodities && existingCommodities.length > 0) {
        // Commodity already exists, use existing ID
        commodityId = existingCommodities[0].id;
        console.log(`Commodity "${commodityName}" already exists with ID: ${commodityId}`);

        // Update category if needed
        if (commodityData.category_id) {
          const { error: updateError } = await supabase
            .from('commodities_new')
            .update({ category_id: commodityData.category_id })
            .eq('id', commodityId);

          if (updateError) {
            console.error(`Error updating category for commodity ${commodityName}:`, updateError);
          } else {
            console.log(`Updated category for commodity "${commodityName}"`);
          }
        }
      } else {
        // Create new commodity
        const { data: newCommodity, error: insertError } = await supabase
          .from('commodities_new')
          .insert([commodityData])
          .select();

        if (insertError) {
          console.error(`Error creating commodity ${commodityName}:`, insertError);
          continue;
        }

        commodityId = newCommodity[0].id;
        console.log(`Created commodity "${commodityName}" with ID: ${commodityId}`);
      }

      // Store the commodity ID in the map
      commodityMap.set(commodityName, commodityId);

      // Add commodity-team relationship if department is available
      for (const row of data) {
        if (row.commodity_name === commodityName && row.department && departmentTeamMapping[row.department]) {
          const teamId = departmentTeamMapping[row.department];

          // Check if relationship already exists
          const { data: existingRelation, error: relationSearchError } = await supabase
            .from('commodities_teams_new')
            .select('*')
            .eq('commodity_id', commodityId)
            .eq('team_id', teamId)
            .limit(1);

          if (relationSearchError) {
            console.error(`Error checking commodity-team relation for ${commodityName}:`, relationSearchError);
            continue;
          }

          if (!existingRelation || existingRelation.length === 0) {
            // Create new relationship
            const { error: relationInsertError } = await supabase
              .from('commodities_teams_new')
              .insert([{
                commodity_id: commodityId,
                team_id: teamId
              }]);

            if (relationInsertError) {
              console.error(`Error creating commodity-team relation for ${commodityName}:`, relationInsertError);
            } else {
              console.log(`Created commodity-team relation for "${commodityName}" with team ID: ${teamId}`);
            }
          }

          // We only need to add the relationship once per team
          break;
        }
      }
    } catch (error) {
      console.error(`Error processing commodity ${commodityName}:`, error);
    }
  }

  console.log(`Imported ${commodityMap.size} commodities.`);
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

  console.log(`Found ${orderGroups.size} unique orders in CSV.`);

  // Import each order
  for (const [orderNumber, orderRows] of orderGroups.entries()) {
    try {
      // Use the first row for order details
      const firstRow = orderRows[0];

      // Use default client if client doesn't exist
      let clientId;
      if (!firstRow.client_Name || !clientMap.has(firstRow.client_Name)) {
        if (clientMap.has('Unknown Client')) {
          clientId = clientMap.get('Unknown Client');
          console.log(`Using default client for order ${orderNumber}`);
        } else {
          console.warn(`Skipping order ${orderNumber}: Client "${firstRow.client_Name}" not found and no default client available.`);
          continue;
        }
      } else {
        clientId = clientMap.get(firstRow.client_Name);
      }

      // Get team ID based on department
      let teamId = null;
      if (firstRow.department) {
        // Try to find a matching team ID
        if (departmentTeamMapping[firstRow.department]) {
          teamId = departmentTeamMapping[firstRow.department];
        } else {
          // Try to guess the team based on department name
          const deptLower = firstRow.department.toLowerCase();
          if (deptLower.includes('agri') || deptLower.includes('af')) {
            teamId = departmentTeamMapping['AF'] || departmentTeamMapping['Agri'];
          } else if (deptLower.includes('cargo') || deptLower.includes('cg')) {
            teamId = departmentTeamMapping['CG'] || departmentTeamMapping['Cargo'];
          } else if (deptLower.includes('marine') || deptLower.includes('mr')) {
            teamId = departmentTeamMapping['MR'] || departmentTeamMapping['Marine'];
          }
        }
      }

      // If still no team ID, try to determine from order number
      if (!teamId && orderNumber) {
        if (orderNumber.includes('AF') || orderNumber.includes('IAF')) {
          teamId = departmentTeamMapping['AF'] || departmentTeamMapping['Agri'];
        } else if (orderNumber.includes('CG') || orderNumber.includes('ICG')) {
          teamId = departmentTeamMapping['CG'] || departmentTeamMapping['Cargo'];
        } else if (orderNumber.includes('MR') || orderNumber.includes('IMR')) {
          teamId = departmentTeamMapping['MR'] || departmentTeamMapping['Marine'];
        }
      }

      // If still no team ID, use the first available team
      if (!teamId) {
        const firstTeamId = Object.values(departmentTeamMapping).find(id => id !== null);
        if (firstTeamId) {
          console.warn(`Warning: Using default team for order ${orderNumber} with department "${firstRow.department}"`);
          teamId = firstTeamId;
        } else {
          console.warn(`Skipping order ${orderNumber}: Department "${firstRow.department}" not mapped to a team.`);
          continue;
        }
      }

      // Prepare contact ID if available
      let contactId = null;
      if (firstRow.contact_name) {
        const contactKey = `${firstRow.client_Name}:${firstRow.contact_name}`;
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
      const type = firstRow.order_type?.toLowerCase() === 'local' ? 'local' : 'international';

      // Format dates
      const orderDate = formatDate(firstRow.order_date) || new Date().toISOString().split('T')[0];
      const billOfLadingDate = formatDate(firstRow.bill_of_lading_date);
      const inspectionDateStarted = formatDate(firstRow.inspection_date_started);
      const inspectionDateCompleted = formatDate(firstRow.inspection_date_completed);

      console.log(`Processing order ${orderNumber}:`);
      console.log(`- Client: ${firstRow.client_Name} (${clientMap.get(firstRow.client_Name)})`);
      console.log(`- Contact: ${firstRow.contact_name} (${contactId})`);
      console.log(`- Shipper: ${firstRow.shipper_name} (${shipperId})`);
      console.log(`- Buyer: ${firstRow.buyer_name} (${buyerId})`);
      console.log(`- Type: ${type}`);
      console.log(`- Order Date: ${firstRow.order_date} -> ${orderDate}`);
      console.log(`- Inspection Place: ${firstRow.inspection_place}`);

      // Prepare order data
      const orderData = {
        order_number: orderNumber,
        client_id: clientId, // Use the clientId we determined earlier
        contact_id: contactId,
        type: type,
        team_id: teamId,
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
        status: 'completed', // Assuming historical data is completed
        notes: null
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
        console.log(`Creating order ${orderNumber} with data:`, JSON.stringify(orderData));
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
      const { data: existingItems, error: searchError } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', orderId)
        .eq('commodity_id', orderItemData.commodity_id)
        .eq('unit_id', orderItemData.unit_id)
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

// Function to create a default client if needed
async function createDefaultClient() {
  console.log('Creating default client for orders without client information...');

  const defaultClientData = {
    name: 'Unknown Client',
    address: 'N/A',
    email: null,
    phone: null,
    tax_id: null,
    team_ids: Object.values(departmentTeamMapping).filter(id => id !== null),
    name_without_accent: 'Unknown Client',
    trade_name: 'Unknown Client'
  };

  try {
    // Check if default client already exists
    const { data: existingClients, error: searchError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('name', defaultClientData.name)
      .limit(1);

    if (searchError) {
      console.error('Error searching for default client:', searchError);
      return null;
    }

    let defaultClientId;

    if (existingClients && existingClients.length > 0) {
      // Default client already exists
      defaultClientId = existingClients[0].id;
      console.log(`Default client already exists with ID: ${defaultClientId}`);
    } else {
      // Create default client
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert([defaultClientData])
        .select();

      if (insertError) {
        console.error('Error creating default client:', insertError);
        return null;
      }

      defaultClientId = newClient[0].id;
      console.log(`Created default client with ID: ${defaultClientId}`);
    }

    // Store the default client ID in the map
    clientMap.set('Unknown Client', defaultClientId);
    return defaultClientId;
  } catch (error) {
    console.error('Error in createDefaultClient:', error);
    return null;
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

    console.log(`Reading CSV file: ${filePath}`);
    const data = await readCSV(filePath);
    console.log(`Read ${data.length} rows from CSV.`);

    // Count unique order numbers
    const uniqueOrderNumbers = new Set();
    data.forEach(row => {
      if (row.order_number) {
        uniqueOrderNumbers.add(row.order_number);
      }
    });
    console.log(`Found ${uniqueOrderNumbers.size} unique order numbers in CSV.`);

    // Check if data has order_number
    const hasOrderNumber = data.some(row => row.order_number);
    console.log(`Data has order_number: ${hasOrderNumber}`);
    if (hasOrderNumber) {
      console.log(`First 5 order numbers:`);
      data.slice(0, 5).forEach(row => console.log(`- ${row.order_number}`));
    } else {
      console.log(`First row keys:`, Object.keys(data[0]));
      console.log(`First row:`, data[0]);
    }

    // Fetch teams and categories first
    await fetchTeams();
    await fetchCategories();

    // Import data in the correct order
    await importClients(data);

    // Create default client for orders without client information
    const defaultClientId = await createDefaultClient();

    await importContacts(data);
    await importShippers(data);
    await importBuyers(data);
    await importUnits(data);
    await importCommodities(data);
    await importOrders(data);

    // Check which orders were not imported
    const notImportedOrders = [...uniqueOrderNumbers].filter(orderNumber => !orderMap.has(orderNumber));
    console.log(`${notImportedOrders.length} orders were not imported.`);

    if (notImportedOrders.length > 0) {
      console.log('First 20 not imported orders:');
      notImportedOrders.slice(0, 20).forEach(orderNumber => console.log(`- ${orderNumber}`));

      // Save not imported orders to a file
      const fs = require('fs');
      fs.writeFileSync('not_imported_orders.txt', notImportedOrders.join('\n'));
      console.log('Full list of not imported orders saved to not_imported_orders.txt');
    }

    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Error during import process:', error);
    process.exit(1);
  }
}

// Run the main function
main();