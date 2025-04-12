const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'http://localhost:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQyODE5MjAyLCJleHAiOjIwNTgxNzkyMDJ9.U6ozj1UrQe2pTSmXy-8RVW84yBAhi10SviaO4Sy9w94';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function findContsOrders() {
  try {
    // First, get the unit ID for "conts"
    const { data: units, error: unitError } = await supabase
      .from('units')
      .select('id, name')
      .ilike('name', 'conts');
    
    if (unitError) {
      console.error('Error fetching units:', unitError);
      return;
    }
    
    if (!units || units.length === 0) {
      console.log('No unit found with name "conts"');
      return;
    }
    
    const unitId = units[0].id;
    console.log(`Found unit "conts" with ID: ${unitId}`);
    
    // Now, get all order items using this unit
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        quantity,
        commodity_description,
        orders (
          id,
          order_number,
          order_date,
          type,
          department,
          status,
          clients (
            id,
            name
          )
        ),
        commodities (
          id,
          name
        )
      `)
      .eq('unit_id', unitId);
    
    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
      return;
    }
    
    if (!orderItems || orderItems.length === 0) {
      console.log('No orders found using unit "conts"');
      return;
    }
    
    console.log(`Found ${orderItems.length} order items using unit "conts":`);
    console.log('---------------------------------------------------');
    
    // Sort by order date (newest first)
    orderItems.sort((a, b) => {
      const dateA = new Date(a.orders.order_date);
      const dateB = new Date(b.orders.order_date);
      return dateB - dateA;
    });
    
    // Display the results
    orderItems.forEach((item, index) => {
      console.log(`${index + 1}. Order Number: ${item.orders.order_number}`);
      console.log(`   Client: ${item.orders.clients.name}`);
      console.log(`   Commodity: ${item.commodities.name}`);
      console.log(`   Quantity: ${item.quantity} conts`);
      console.log(`   Order Date: ${item.orders.order_date}`);
      console.log(`   Type: ${item.orders.type}`);
      console.log(`   Department: ${item.orders.department}`);
      console.log(`   Status: ${item.orders.status}`);
      console.log('---------------------------------------------------');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

findContsOrders();
