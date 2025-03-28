import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  try {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQyODE5MjAyLCJleHAiOjIwNTgxNzkyMDJ9.U6ozj1UrQe2pTSmXy-8RVW84yBAhi10SviaO4Sy9w94'
    )
  } catch (error) {
    console.error('Lỗi khi khởi tạo Supabase client:', error)
    // Trả về client với URL và key backup để tránh lỗi ứng dụng
    return createBrowserClient(
      'http://localhost:8000',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQyODE5MjAyLCJleHAiOjIwNTgxNzkyMDJ9.U6ozj1UrQe2pTSmXy-8RVW84yBAhi10SviaO4Sy9w94'
    )
  }
}

// Hàm lấy danh sách người dùng từ auth.users và profiles
export async function fetchUsers() {
  const supabase = createClient()
  
  try {
    // Lấy danh sách các profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (profilesError) throw profilesError
    
    // Kiểm tra xem có profiles không
    if (!profiles || profiles.length === 0) {
      return { users: [], error: null }
    }
    
    // Lấy danh sách teams để có thông tin chi tiết về mỗi team
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
    
    if (teamsError) {
      console.error('Lỗi khi lấy danh sách teams:', teamsError)
    }
    
    // Map team IDs to team names for each user
    const users = profiles.map(profile => {
      // Tìm thông tin teams cho mỗi người dùng
      const userTeams = teams && profile.team_ids ? 
        profile.team_ids.map((teamId: string) => {
          const team = teams.find(t => t.id === teamId)
          return team ? team.name : null
        }).filter(Boolean) : []
      
      return {
        ...profile,
        email: profile.username ? `${profile.username}@example.com` : 'Không có thông tin',
        teams: userTeams,
        team_names: userTeams.join(', ')
      }
    })
    
    return { users, error: null }
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách người dùng:', error)
    return { users: [], error: error.message }
  }
}

// Hàm tạo người dùng mới
export async function createUser({ email, password, username, full_name, role, is_active, team_ids }: {
  email: string
  password: string
  username?: string
  full_name?: string
  role?: string
  is_active?: boolean
  team_ids?: string[]
}) {
  const supabase = createClient()
  
  try {
    // Tạo user mới với signUp và skipRedirect
    const { data: { user }, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
          full_name: full_name || '',
          role: role || 'user',
          is_active: is_active !== undefined ? is_active : true
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?skipRedirect=true`
      }
    })
    
    if (authError) throw authError
    
    if (!user) throw new Error('Không thể tạo người dùng')
    
    // Tạo hoặc cập nhật profile trong public.profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: username || email.split('@')[0],
        full_name: full_name || '',
        role: role || 'user',
        is_active: is_active !== undefined ? is_active : true,
        team_ids: team_ids || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) throw profileError
    
    // Đăng xuất ngay lập tức để tránh chuyển hướng
    await supabase.auth.signOut()
    
    return { user, error: null }
  } catch (error: any) {
    console.error('Lỗi khi tạo người dùng:', error)
    return { user: null, error: error.message }
  }
}

// Hàm cập nhật thông tin người dùng
export async function updateUser(userId: string, data: {
  email?: string
  username?: string
  full_name?: string
  role?: string
  is_active?: boolean
  avatar_url?: string
  team_ids?: string[]
}) {
  const supabase = createClient()
  
  try {
    // Không sử dụng admin API, chỉ cập nhật profile
    const profileData: any = {}
    
    if (data.username !== undefined) profileData.username = data.username
    if (data.full_name !== undefined) profileData.full_name = data.full_name
    if (data.role !== undefined) profileData.role = data.role
    if (data.is_active !== undefined) profileData.is_active = data.is_active
    if (data.avatar_url !== undefined) profileData.avatar_url = data.avatar_url
    if (data.team_ids !== undefined) profileData.team_ids = data.team_ids
    
    profileData.updated_at = new Date().toISOString()
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
    
    if (profileError) throw profileError
    
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Lỗi khi cập nhật người dùng:', error)
    return { success: false, error: error.message }
  }
}

// Hàm xóa người dùng
export async function deleteUser(userId: string) {
  const supabase = createClient()
  
  try {
    // Xóa bản ghi trong bảng profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
    
    if (profileError) throw profileError
    
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Lỗi khi xóa người dùng:', error)
    return { success: false, error: error.message }
  }
}

// Hàm lấy danh sách teams với cơ chế retry
export async function fetchTeams(retryCount = 3, retryDelay = 1000) {
  let lastError = null;
  
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const supabase = createClient()
      
      // Lấy danh sách các teams
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true })
      
      if (teamsError) {
        console.warn(`Lỗi khi lấy danh sách teams (lần thử ${attempt + 1}/${retryCount}):`, teamsError);
        lastError = teamsError;
        
        if (attempt < retryCount - 1) {
          console.log(`Thử lại sau ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        throw teamsError;
      }
      
      return { teams, error: null }
    } catch (error: any) {
      console.error(`Lỗi khi lấy danh sách teams (lần thử ${attempt + 1}/${retryCount}):`, error);
      lastError = error;
      
      if (attempt < retryCount - 1) {
        console.log(`Thử lại sau ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  return { 
    teams: [], 
    error: lastError ? `Lỗi kết nối sau ${retryCount} lần thử: ${lastError.message}` : 'Không thể kết nối đến cơ sở dữ liệu'
  };
}

// Hàm kiểm tra bảng teams tồn tại với cơ chế retry
export async function checkTeamsTable(retryCount = 3, retryDelay = 1000) {
  let lastError = null;
  
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const supabase = createClient();
      
      // Kiểm tra kết nối đến Supabase trước
      const { data: connectionTest, error: connectionError } = await supabase.from('profiles').select('id').limit(1);
      if (connectionError) {
        console.warn(`Lỗi kết nối đến Supabase (lần thử ${attempt + 1}/${retryCount}):`, connectionError);
        lastError = connectionError;
        
        if (attempt < retryCount - 1) {
          console.log(`Thử lại sau ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        return { exists: false, error: `Không thể kết nối đến Supabase: ${connectionError.message}` };
      }
      
      // Nếu kết nối OK, kiểm tra bảng teams
      const { data, error } = await supabase.from('teams').select('id').limit(1);
      
      // Nếu không có lỗi, bảng tồn tại
      if (!error) {
        return { exists: true, error: null };
      }
      
      // Nếu có lỗi "relation does not exist", bảng không tồn tại
      if (error.message && error.message.includes('relation "teams" does not exist')) {
        return { exists: false, error: 'Bảng teams không tồn tại trong cơ sở dữ liệu' };
      }
      
      // Lỗi khác (quyền truy cập, v.v.)
      console.error('Lỗi kiểm tra bảng teams:', error);
      return { exists: false, error: error.message };
      
    } catch (error: any) {
      console.error(`Lỗi khi kiểm tra bảng teams (lần thử ${attempt + 1}/${retryCount}):`, error);
      lastError = error;
      
      if (attempt < retryCount - 1) {
        console.log(`Thử lại sau ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  return { 
    exists: false, 
    error: lastError ? `Lỗi kết nối sau ${retryCount} lần thử: ${lastError.message}` : 'Không thể kết nối đến cơ sở dữ liệu'
  };
}

// Hàm xóa team
export async function deleteTeam(teamId: string) {
  const supabase = createClient()
  
  try {
    // Xóa bản ghi trong bảng teams
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId)
    
    if (error) throw error
    
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Lỗi khi xóa team:', error)
    return { success: false, error: error.message }
  }
}

// Hàm tạo team mới
export async function createTeam({ name, description }: { 
  name: string, 
  description?: string 
}) {
  const supabase = createClient()
  
  try {
    // Kiểm tra tên team
    if (!name.trim()) {
      throw new Error('Tên team không được để trống')
    }
    
    // Thêm team mới vào bảng teams
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { team, error: null }
  } catch (error: any) {
    console.error('Lỗi khi tạo team:', error)
    return { team: null, error: error.message }
  }
}

// Hàm cập nhật thông tin team
export async function updateTeam(
  teamId: string,
  { name, description }: { name?: string; description?: string }
) {
  const supabase = createClient()
  
  try {
    // Cập nhật thông tin team
    const { data: team, error } = await supabase
      .from('teams')
      .update({
        name: name?.trim(),
        description: description?.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId)
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Lỗi khi cập nhật team:', error)
    return { success: false, error: error.message }
  }
}

// Client Management Functions

// Fetch clients with their contacts
export async function fetchClients() {
  const supabase = createClient()
  
  try {
    // Get all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true })
    
    if (clientsError) throw clientsError
    
    // If no clients, return empty array
    if (!clients || clients.length === 0) {
      return { clients: [], error: null }
    }
    
    // Get all contacts to associate with clients
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
    
    if (contactsError) {
      console.error('Error fetching contacts:', contactsError)
    }
    
    // Associate contacts with clients
    const clientsWithContacts = clients.map(client => {
      const clientContacts = contacts 
        ? contacts.filter(contact => contact.client_id === client.id)
        : []
      
      return {
        ...client,
        contacts: clientContacts
      }
    })
    
    return { clients: clientsWithContacts, error: null }
  } catch (error: any) {
    console.error('Error fetching clients:', error)
    return { clients: [], error: error.message }
  }
}

// Fetch a single client with contacts
export async function fetchClient(clientId: string) {
  const supabase = createClient()
  
  try {
    // Get client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
    
    if (clientError) throw clientError
    
    // Get client contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('client_id', clientId)
    
    if (contactsError) {
      console.error('Error fetching client contacts:', contactsError)
    }
    
    return { 
      client: {
        ...client,
        contacts: contacts || []
      }, 
      error: null 
    }
  } catch (error: any) {
    console.error('Error fetching client details:', error)
    return { client: null, error: error.message }
  }
}

// Create a new client
export async function createClientRecord({ name, address, email, phone, tax_id, team_ids }: {
  name: string
  address?: string
  email?: string
  phone?: string
  tax_id?: string
  team_ids?: string[]
}) {
  const supabase = createClient()
  
  try {
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        name,
        address,
        email,
        phone,
        tax_id,
        team_ids: team_ids || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { client, error: null }
  } catch (error: any) {
    console.error('Error creating client:', error)
    return { client: null, error: error.message }
  }
}

// Update a client
export async function updateClient(clientId: string, data: {
  name?: string
  address?: string
  email?: string
  phone?: string
  tax_id?: string
  team_ids?: string[]
}) {
  const supabase = createClient()
  
  try {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    }
    
    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .select()
      .single()
    
    if (error) throw error
    
    return { client, error: null }
  } catch (error: any) {
    console.error('Error updating client:', error)
    return { client: null, error: error.message }
  }
}

// Delete a client
export async function deleteClient(clientId: string) {
  const supabase = createClient()
  
  try {
    // Delete the client (contacts will be deleted via cascade)
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
    
    if (error) throw error
    
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error deleting client:', error)
    return { success: false, error: error.message }
  }
}

// Contact Management Functions

// Create a contact for a client
export async function createContact(data: {
  client_id: string
  full_name: string
  position?: string
  phone?: string
  email?: string
}) {
  const supabase = createClient()
  
  try {
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { contact, error: null }
  } catch (error: any) {
    console.error('Error creating contact:', error)
    return { contact: null, error: error.message }
  }
}

// Update a contact
export async function updateContact(contactId: string, data: {
  full_name?: string
  position?: string
  phone?: string
  email?: string
}) {
  const supabase = createClient()
  
  try {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    }
    
    const { data: contact, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', contactId)
      .select()
      .single()
    
    if (error) throw error
    
    return { contact, error: null }
  } catch (error: any) {
    console.error('Error updating contact:', error)
    return { contact: null, error: error.message }
  }
}

// Delete a contact
export async function deleteContact(contactId: string) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
    
    if (error) throw error
    
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error deleting contact:', error)
    return { success: false, error: error.message }
  }
}

// Fetch orders with client information
export async function fetchOrders() {
  const supabase = createClient()
  
  try {
    // Fetch orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        clients:client_id (name)
      `)
      .order('created_at', { ascending: false })
    
    if (ordersError) throw ordersError
    
    // Format response with client names
    const formattedOrders = orders.map(order => ({
      ...order,
      client_name: order.clients?.name
    }))
    
    return { orders: formattedOrders, error: null }
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    return { orders: [], error: error.message }
  }
}

// Fetch a single order by ID
export async function fetchOrder(orderId: string) {
  const supabase = createClient()
  
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        clients:client_id (id, name, phone, email)
      `)
      .eq('id', orderId)
      .single()
    
    if (error) throw error
    
    // Fetch contacts for this client
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('client_id', order.client_id)
      .order('full_name', { ascending: true })
    
    if (contactsError) {
      console.error('Error fetching client contacts:', contactsError)
    }
    
    // Find the selected contact if contact_id is set
    let selectedContact = null
    if (order.contact_id && contacts) {
      selectedContact = contacts.find(contact => contact.id === order.contact_id) || null
    }
    
    return { 
      order: {
        ...order,
        client_name: order.clients?.name,
        client_contacts: contacts || [],
        selected_contact: selectedContact
      }, 
      error: null 
    }
  } catch (error: any) {
    console.error('Error fetching order:', error)
    return { order: null, error: error.message }
  }
}

// Create a new order
export async function createOrder(data: {
  client_id: string
  contact_id?: string | null
  shipper_id?: string | null
  buyer_id?: string | null
  type: 'international' | 'local'
  department: 'marine' | 'agri' | 'consumer_goods'
  order_date: string
  client_ref_code?: string | null
  vessel_carrier?: string | null
  bill_of_lading?: string | null
  bill_of_lading_date?: string | null
}) {
  const supabase = createClient()
  
  try {
    // Generate an order number based on the department and a random number
    const prefix = data.department === 'marine' ? 'MR' : 
                  data.department === 'agri' ? 'AG' : 'CG';
    const typePrefix = data.type === 'international' ? 'I' : 'L';
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    const orderNumber = `${typePrefix}${prefix}${randomNum}`;
    
    // Insert new order
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        client_id: data.client_id,
        contact_id: data.contact_id,
        type: data.type,
        department: data.department,
        order_number: orderNumber,
        order_date: data.order_date,
        client_ref_code: data.client_ref_code,
        shipper_id: data.shipper_id,
        buyer_id: data.buyer_id,
        vessel_carrier: data.vessel_carrier,
        bill_of_lading: data.bill_of_lading,
        bill_of_lading_date: data.bill_of_lading_date,
        status: 'draft',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { order, error: null }
  } catch (error: any) {
    console.error('Error creating order:', error)
    return { order: null, error: error.message }
  }
}

// Update an existing order
export async function updateOrder(
  orderId: string,
  data: {
    client_id?: string
    contact_id?: string | null
    type?: 'international' | 'local'
    department?: 'marine' | 'agri' | 'consumer_goods'
    status?: 'draft' | 'confirmed' | 'completed' | 'cancelled'
    order_date?: string
    client_ref_code?: string | null
    notes?: string | null
    shipper_id?: string | null
    buyer_id?: string | null
    vessel_carrier?: string | null
    bill_of_lading?: string | null
    bill_of_lading_date?: string | null
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
    console.error('Error updating order:', error)
    return { order: null, error: error.message }
  }
}

// Delete an order
export async function deleteOrder(orderId: string) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
    
    if (error) throw error
    
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error deleting order:', error)
    return { success: false, error: error.message }
  }
}

// Get the next sequence number for order numbers
export async function fetchNextOrderSequence(
  typePrefix: string,
  departmentCode: string,
  yearCode: string
) {
  const supabase = createClient()
  
  try {
    // Look for the highest existing sequence number for this prefix combination
    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_number')
      .like('order_number', `${typePrefix}${departmentCode}${yearCode}-%`)
      .order('order_number', { ascending: false })
    
    if (error) throw error
    
    // Default to 1 if no orders found
    let nextSequence = 1
    
    if (orders && orders.length > 0) {
      // Parse the sequence number from the latest order
      const latestOrder = orders[0]
      const sequencePart = latestOrder.order_number.split('-')[1]
      
      // Convert to number and increment
      if (sequencePart) {
        nextSequence = parseInt(sequencePart, 10) + 1
      }
    }
    
    return { nextSequence, error: null }
  } catch (error: any) {
    console.error('Error getting next sequence:', error)
    return { nextSequence: 1, error: error.message }
  }
} 