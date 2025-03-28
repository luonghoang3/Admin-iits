import { createClient } from './client'

// Shipper Management Functions

// Fetch all shippers
export async function fetchShippers() {
  const supabase = createClient()
  
  try {
    const { data: shippers, error } = await supabase
      .from('shippers')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    
    return { shippers: shippers || [], error: null }
  } catch (error: any) {
    console.error('Error fetching shippers:', error)
    return { shippers: [], error: error.message }
  }
}

// Fetch a single shipper by ID
export async function fetchShipper(shipperId: string) {
  const supabase = createClient()
  
  try {
    const { data: shipper, error } = await supabase
      .from('shippers')
      .select('*')
      .eq('id', shipperId)
      .single()
    
    if (error) throw error
    
    return { shipper, error: null }
  } catch (error: any) {
    console.error('Error fetching shipper details:', error)
    return { shipper: null, error: error.message }
  }
}

// Create a new shipper
export async function createShipper({
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
    const { data: shipper, error } = await supabase
      .from('shippers')
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
    
    return { shipper, error: null }
  } catch (error: any) {
    console.error('Error creating shipper:', error)
    return { shipper: null, error: error.message }
  }
}

// Update a shipper
export async function updateShipper(
  shipperId: string,
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
    
    const { data: shipper, error } = await supabase
      .from('shippers')
      .update(updateData)
      .eq('id', shipperId)
      .select()
      .single()
    
    if (error) throw error
    
    return { shipper, error: null }
  } catch (error: any) {
    console.error('Error updating shipper:', error)
    return { shipper: null, error: error.message }
  }
}

// Delete a shipper
export async function deleteShipper(shipperId: string) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('shippers')
      .delete()
      .eq('id', shipperId)
    
    if (error) throw error
    
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error deleting shipper:', error)
    return { success: false, error: error.message }
  }
}

// Buyer Management Functions

// Fetch all buyers
export async function fetchBuyers() {
  const supabase = createClient()
  
  try {
    const { data: buyers, error } = await supabase
      .from('buyers')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    
    return { buyers: buyers || [], error: null }
  } catch (error: any) {
    console.error('Error fetching buyers:', error)
    return { buyers: [], error: error.message }
  }
}

// Fetch a single buyer by ID
export async function fetchBuyer(buyerId: string) {
  const supabase = createClient()
  
  try {
    const { data: buyer, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('id', buyerId)
      .single()
    
    if (error) throw error
    
    return { buyer, error: null }
  } catch (error: any) {
    console.error('Error fetching buyer details:', error)
    return { buyer: null, error: error.message }
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
    const { data: buyer, error } = await supabase
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
    
    return { buyer, error: null }
  } catch (error: any) {
    console.error('Error creating buyer:', error)
    return { buyer: null, error: error.message }
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
    
    return { buyer, error: null }
  } catch (error: any) {
    console.error('Error updating buyer:', error)
    return { buyer: null, error: error.message }
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
    console.error('Error deleting buyer:', error)
    return { success: false, error: error.message }
  }
}

// Order-related shipper and buyer functions

// Update order's shipper and buyer
export async function updateOrderShippingDetails(
  orderId: string,
  data: {
    shipper_id?: string | null
    buyer_id?: string | null
  }
) {
  const supabase = createClient()
  
  try {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    }
    
    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()
    
    if (error) throw error
    
    return { order, error: null }
  } catch (error: any) {
    console.error('Error updating order shipping details:', error)
    return { order: null, error: error.message }
  }
} 