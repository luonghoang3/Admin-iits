const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'http://localhost:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQyODE5MjAyLCJleHAiOjIwNTgxNzkyMDJ9.U6ozj1UrQe2pTSmXy-8RVW84yBAhi10SviaO4Sy9w94';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllUnits() {
  try {
    const { data: units, error } = await supabase
      .from('units')
      .select('*');
    
    if (error) {
      console.error('Error fetching units:', error);
      return;
    }
    
    console.log('All units:');
    units.forEach(unit => {
      console.log(`ID: ${unit.id}, Name: ${unit.name}, Description: ${unit.description}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

listAllUnits();
