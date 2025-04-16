import { createClient } from './client'

// Buyer Management Functions

// Fetch all buyers with pagination and search
export async function fetchBuyers({
  page = 1,
  limit = 20,
  searchQuery = '',
  essentialFieldsOnly = true
}: {
  page?: number;
  limit?: number;
  searchQuery?: string;
  essentialFieldsOnly?: boolean;
} = {}) {
  const supabase = createClient()
  
  try {
    // Only select essential fields to improve performance
    const fields = essentialFieldsOnly 
      ? 'id, name, email, phone' 
      : '*';
    
    let query = supabase
      .from('buyers')
      .select(fields, { count: 'exact' })
    
    // Add search filter if provided
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
    }
    
    // Add pagination
    const startIndex = (page - 1) * limit
    query = query.range(startIndex, startIndex + limit - 1)
    
    // Add sorting
    query = query.order('name', { ascending: true })
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    // Return data with proper typing for backward compatibility
    return { 
      data: data || [], 
      hasMore: Boolean(count && count > startIndex + limit),
      error: null 
    }
  } catch (error: any) {
    return { 
      data: [], 
      hasMore: false, 
      error: error.message 
    }
  }
}

// Fetch a single buyer by ID
export async function fetchBuyer(buyerId: string) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('id', buyerId)
      .single()
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Create a new buyer
export async function createBuyer({
  name,
  address,
  phone,
  email,
  team_ids
}: {
  name: string
  address?: string
  phone?: string
  email?: string
  team_ids?: string[]
}) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('buyers')
      .insert({
        name,
        address,
        phone,
        email,
        team_ids: team_ids || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Update a buyer
export async function updateBuyer(
  buyerId: string,
  data: {
    name?: string
    address?: string
    phone?: string
    email?: string
    team_ids?: string[]
  }
) {
  const supabase = createClient()
  
  try {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    }
    
    const { data: buyer, error } = await supabase
      .from('buyers')
      .update(updateData)
      .eq('id', buyerId)
      .select()
      .single()
    
    if (error) throw error
    
    return { data: buyer, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Delete a buyer
export async function deleteBuyer(buyerId: string) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('buyers')
      .delete()
      .eq('id', buyerId)
    
    if (error) throw error
    
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
} 