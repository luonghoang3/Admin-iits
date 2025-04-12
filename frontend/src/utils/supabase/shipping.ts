import { createClient } from './client'
import { standardizeCompanyName } from '../formatters/companyNameFormatter'

// Shipper Management Functions

// Fetch all shippers with pagination and search
export async function fetchShippers({
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
      .from('shippers')
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

// Fetch a single shipper by ID
export async function fetchShipper(shipperId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('shippers')
      .select('*')
      .eq('id', shipperId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
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
    // Standardize the shipper name before saving
    const standardizedName = standardizeCompanyName(name);

    const { data, error } = await supabase
      .from('shippers')
      .insert({
        name: standardizedName,
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
    // Standardize the shipper name if it's being updated
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    }

    if (updateData.name) {
      updateData.name = standardizeCompanyName(updateData.name)
    }

    const { data: shipper, error } = await supabase
      .from('shippers')
      .update(updateData)
      .eq('id', shipperId)
      .select()
      .single()

    if (error) throw error

    return { data: shipper, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
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
    return { success: false, error: error.message }
  }
}

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

    return {
      buyers: data || [],
      total: count || 0,
      error: null
    }
  } catch (error: any) {
    return {
      buyers: [],
      total: 0,
      error: error.message
    }
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
    // Standardize the buyer name before saving
    const standardizedName = standardizeCompanyName(name);

    const { data: buyer, error } = await supabase
      .from('buyers')
      .insert({
        name: standardizedName,
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
    // Standardize the buyer name if it's being updated
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    }

    if (updateData.name) {
      updateData.name = standardizeCompanyName(updateData.name)
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
    return { order: null, error: error.message }
  }
}