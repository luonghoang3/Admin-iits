import { createBrowserClient } from '@supabase/ssr'
import { createClient as createServerClient } from './server';
import logger from '@/lib/logger'

// Hàm loại bỏ dấu tiếng Việt ở phía client
export function removeAccentsJS(str: string): string {
  return str.normalize('NFD')
           .replace(/[\u0300-\u036f]/g, '')
           .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

export const createClient = () => {
  try {
    // Check if environment variables are defined
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      logger.error('NEXT_PUBLIC_SUPABASE_URL is not defined')
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logger.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined')
    }

    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQyODE5MjAyLCJleHAiOjIwNTgxNzkyMDJ9.U6ozj1UrQe2pTSmXy-8RVW84yBAhi10SviaO4Sy9w94'
    )

    return client
  } catch (error) {
    logger.error('Error initializing Supabase client:', error)
    // Return backup client to avoid application errors
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
      logger.error('Lỗi khi lấy danh sách teams:', teamsError)
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
    logger.error('Lỗi khi lấy danh sách người dùng:', error)
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
    logger.error('Lỗi khi tạo người dùng:', error)
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
    logger.error('Lỗi khi cập nhật người dùng:', error)
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
    logger.error('Lỗi khi xóa người dùng:', error)
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
        logger.warn(`Lỗi khi lấy danh sách teams (lần thử ${attempt + 1}/${retryCount}):`, teamsError);
        lastError = teamsError;

        if (attempt < retryCount - 1) {
          logger.log(`Thử lại sau ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        throw teamsError;
      }

      return { teams, error: null }
    } catch (error: any) {
      logger.error(`Lỗi khi lấy danh sách teams (lần thử ${attempt + 1}/${retryCount}):`, error);
      lastError = error;

      if (attempt < retryCount - 1) {
        logger.log(`Thử lại sau ${retryDelay}ms...`);
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
        logger.warn(`Lỗi kết nối đến Supabase (lần thử ${attempt + 1}/${retryCount}):`, connectionError);
        lastError = connectionError;

        if (attempt < retryCount - 1) {
          logger.log(`Thử lại sau ${retryDelay}ms...`);
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
      logger.error('Lỗi kiểm tra bảng teams:', error);
      return { exists: false, error: error.message };

    } catch (error: any) {
      logger.error(`Lỗi khi kiểm tra bảng teams (lần thử ${attempt + 1}/${retryCount}):`, error);
      lastError = error;

      if (attempt < retryCount - 1) {
        logger.log(`Thử lại sau ${retryDelay}ms...`);
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
    logger.error('Lỗi khi xóa team:', error)
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
    logger.error('Lỗi khi tạo team:', error)
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
    logger.error('Lỗi khi cập nhật team:', error)
    return { success: false, error: error.message }
  }
}

// Client Management Functions

// Fetch clients with their contacts
export async function fetchClients(page = 1, limit = 15, searchQuery = '') {
  try {
    logger.log(`API call: fetchClients - page=${page}, limit=${limit}, searchQuery="${searchQuery}"`)

    const supabase = createClient()

    // Calculate offset based on page and limit
    const offset = (page - 1) * limit

    // Create base query
    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' })

    // Add search filter if provided
    if (searchQuery) {
      // Loại bỏ dấu từ từ khóa tìm kiếm
      const searchWithoutAccent = removeAccentsJS(searchQuery)

      // Tìm kiếm trên cả bốn cột: name, name_without_accent, trade_name và trade_name_without_accent
      // Sử dụng cú pháp chuỗi thay vì mảng đối tượng để tránh lỗi
      query = query.or(`name.ilike.%${searchQuery}%,name_without_accent.ilike.%${searchWithoutAccent}%,trade_name.ilike.%${searchQuery}%,trade_name_without_accent.ilike.%${searchWithoutAccent}%`)
    }

    // Add pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('name', { ascending: true })

    // Execute query
    const { data: clients, error: clientsError, count } = await query

    if (clientsError) {
      logger.error('Error in fetchClients query:', clientsError)
      throw clientsError
    }

    // If no clients, return empty array
    if (!clients || clients.length === 0) {
      return { clients: [], hasMore: false, error: null }
    }

    // Get all contacts to associate with clients
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')

    if (contactsError) {
      logger.error('Error fetching contacts:', contactsError)
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

    // Calculate if there are more results
    const totalCount = count || 0
    const currentPosition = offset + clients.length
    const hasMore = totalCount > currentPosition

    logger.log(`fetchClients: offset=${offset}, limit=${limit}, returned=${clients.length}, total=${totalCount}, hasMore=${hasMore}`)

    return { clients: clientsWithContacts, hasMore, total: totalCount, error: null }
  } catch (error: any) {
    logger.error('Error in fetchClients:', error)
    return { clients: [], hasMore: false, total: 0, error: error.message || 'Unknown error in fetchClients' }
  }
}

// Fetch clients for combobox with lazy loading support
export async function fetchClientsForCombobox({
  page = 1,
  limit = 15, // Giảm số lượng mặc định để đảm bảo lazy loading hoạt động
  searchQuery = ''
}: {
  page?: number;
  limit?: number;
  searchQuery?: string;
} = {}) {
  try {
    logger.log(`API call: fetchClientsForCombobox - page=${page}, limit=${limit}, searchQuery="${searchQuery}"`)

    const supabase = createClient()

    // Calculate offset based on page and limit
    const offset = (page - 1) * limit

    // Create query to get clients (id, name, and trade_name for performance)
    let query = supabase
      .from('clients')
      .select('id, name, trade_name', { count: 'exact' })

    // Add search filter if provided
    if (searchQuery) {
      // Loại bỏ dấu từ từ khóa tìm kiếm
      const searchWithoutAccent = removeAccentsJS(searchQuery)

      // Tìm kiếm trên cả bốn cột: name, name_without_accent, trade_name và trade_name_without_accent
      // Sử dụng cú pháp chuỗi thay vì mảng đối tượng để tránh lỗi
      query = query.or(`name.ilike.%${searchQuery}%,name_without_accent.ilike.%${searchWithoutAccent}%,trade_name.ilike.%${searchQuery}%,trade_name_without_accent.ilike.%${searchWithoutAccent}%`)
    }

    // Add pagination and sorting
    query = query
      .range(offset, offset + limit - 1)
      .order('name', { ascending: true })

    // Execute query
    const { data, error, count } = await query

    if (error) {
      logger.error('Error in fetchClientsForCombobox query:', error)
      return {
        clients: [],
        hasMore: false,
        total: 0,
        error: error.message || 'Error fetching clients'
      }
    }

    // Format clients for combobox - use trade_name if available, otherwise use name
    const clients = data ? data.map(client => ({
      value: client.id,
      label: client.trade_name || client.name, // Ưu tiên trade_name (tiếng Anh) nếu có
      originalName: client.name // Lưu lại tên gốc để tham khảo nếu cần
    })) : []

    // Calculate if there are more results
    // Đảm bảo rằng hasMore chỉ là false khi đã tải hết dữ liệu
    // Nếu số lượng dữ liệu trả về ít hơn limit, chắc chắn không còn dữ liệu
    const dataLength = data?.length || 0
    const totalCount = count || 0
    const currentPosition = offset + dataLength

    // Debug log chi tiết
    logger.log(`API: offset=${offset}, limit=${limit}, returned=${dataLength}, total=${totalCount}`)
    logger.log(`API: currentPosition=${currentPosition}, hasMore check: ${totalCount > currentPosition} && ${dataLength === limit}`)

    // Chỉ có thêm dữ liệu nếu tổng số > vị trí hiện tại và số lượng trả về = limit
    const hasMore = totalCount > currentPosition && dataLength === limit

    logger.log(`API final hasMore: ${hasMore}`)

    return {
      clients,
      hasMore,
      total: count || 0,
      error: null
    }
  } catch (error: any) {
    logger.error('Error in fetchClientsForCombobox:', error)
    return {
      clients: [],
      hasMore: false,
      total: 0,
      error: error.message || 'Unknown error in fetchClientsForCombobox'
    }
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
      logger.error('Error fetching client contacts:', contactsError)
    }

    return {
      client: {
        ...client,
        contacts: contacts || []
      },
      error: null
    }
  } catch (error: any) {
    logger.error('Error fetching client details:', error)
    // Check if error is an empty object or undefined
    const errorMessage = (error && Object.keys(error).length > 0)
      ? error.message || error.toString()
      : 'Failed to fetch client details. Please try again.'
    return { client: null, error: errorMessage }
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
    logger.error('Error creating client:', error)
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
    logger.error('Error updating client:', error)
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
    logger.error('Error deleting client:', error)
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
    logger.error('Error creating contact:', error)
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
    logger.error('Error updating contact:', error)
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
    logger.error('Error deleting contact:', error)
    return { success: false, error: error.message }
  }
}

// Fetch orders with client information and pagination
export async function fetchOrders({
  page = 1,
  limit = 10,
  teamId = null,
  orderNumberSearch = '',
  clientSearch = ''
}: {
  page?: number;
  limit?: number;
  teamId?: string | null;
  orderNumberSearch?: string;
  clientSearch?: string;
} = {}) {
  // Removed sorting functionality
  const supabase = createClient()

  try {
    // Tính offset dựa trên page và limit
    const offset = (page - 1) * limit

    // Tạo query cơ bản với join rõ ràng hơn
    // Sử dụng cú pháp join rõ ràng hơn để đảm bảo dữ liệu được trả về đúng
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        client_id,
        team_id,
        type,
        status,
        order_date,
        created_at,
        updated_at,
        client_ref_code,
        inspection_date_started,
        inspection_date_completed,
        inspection_place,
        notes,
        clients!client_id (id, name),
        teams!team_id (id, name)
      `, { count: 'exact' })

    // Áp dụng bộ lọc theo team nếu có
    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    // Áp dụng tìm kiếm theo mã đơn hàng nếu có
    if (orderNumberSearch) {
      query = query.ilike('order_number', `%${orderNumberSearch}%`)
    }

    // Áp dụng tìm kiếm theo khách hàng nếu có
    if (clientSearch) {
      // Loại bỏ dấu từ từ khóa tìm kiếm
      const searchWithoutAccent = removeAccentsJS(clientSearch)

      // Tìm kiếm trên cả bốn cột: name, name_without_accent, trade_name và trade_name_without_accent
      // Sử dụng cú pháp chuỗi thay vì mảng đối tượng để tránh lỗi
      query = query.or(`clients.name.ilike.%${clientSearch}%,clients.name_without_accent.ilike.%${searchWithoutAccent}%,clients.trade_name.ilike.%${clientSearch}%,clients.trade_name_without_accent.ilike.%${searchWithoutAccent}%`)

      // Log query để kiểm tra
      logger.log(`Searching for clients with name containing: ${clientSearch} (without accents: ${searchWithoutAccent})`)
    }

    // Nếu đang tìm kiếm khách hàng, không áp dụng phân trang để lấy tất cả kết quả phù hợp
    // Chỉ áp dụng phân trang khi không tìm kiếm hoặc chỉ tìm kiếm theo mã đơn hàng
    if (!clientSearch) {
      // Chỉ sử dụng phân trang khi không tìm kiếm khách hàng
      query = query.range(offset, offset + limit - 1)
    }

    // Sắp xếp theo order_date giảm dần (đơn hàng mới nhất ở trang đầu)
    // Sắp xếp thứ cấp theo created_at để xử lý các trường hợp order_date là null hoặc giống nhau
    query = query
      .order('order_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    // Thực thi query
    const { data: orders, error: ordersError, count } = await query

    if (ordersError) throw ordersError

    // Log số lượng kết quả trả về để kiểm tra
    logger.log(`Query returned ${orders.length} orders${clientSearch ? ` matching client search: ${clientSearch}` : ''}`)

    // Format response with client names and team information
    const formattedOrders = orders.map(order => {
      // Đảm bảo rằng dữ liệu clients và teams luôn là một mảng
      const clientsArray = Array.isArray(order.clients) ? order.clients : [order.clients].filter(Boolean);
      const teamsArray = Array.isArray(order.teams) ? order.teams : [order.teams].filter(Boolean);

      // Lấy thông tin khách hàng và team từ mảng
      const clientInfo = clientsArray[0] || {};
      const teamInfo = teamsArray[0] || {};

      return {
        ...order,
        client_name: clientInfo.name || null,
        team_name: teamInfo.name || null
      }
    })

    return {
      orders: formattedOrders,
      total: count || 0,
      error: null
    }
  } catch (error: any) {
    logger.error('Error fetching orders:', error)
    return { orders: [], total: 0, error: error.message }
  }
}

// Fetch a single order by ID
// @deprecated Use fetchOrderById from @/services/orderService instead for better business logic handling
export async function fetchOrder(orderId: string) {
  const supabase = createClient()

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        clients:client_id (id, name, trade_name, phone, email),
        teams:team_id (id, name, description)
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
      logger.error('Error fetching client contacts:', contactsError)
    }

    // Find the selected contact if contact_id is set
    let selectedContact = null
    if (order.contact_id && contacts) {
      selectedContact = contacts.find(contact => contact.id === order.contact_id) || null
    }

    return {
      order: {
        ...order,
        client_name: order.clients?.trade_name || order.clients?.name, // Ưu tiên trade_name nếu có
        client_original_name: order.clients?.name, // Lưu lại tên gốc để tham khảo nếu cần
        client_contacts: contacts || [],
        selected_contact: selectedContact,
        team: order.teams || null
      },
      error: null
    }
  } catch (error: any) {
    logger.error('Error fetching order:', error)
    // Check if error is an empty object or undefined
    const errorMessage = (error && Object.keys(error).length > 0)
      ? error.message || error.toString()
      : 'Failed to fetch order details. Please try again.'
    return { order: null, error: errorMessage }
  }
}

// Create a new order
// @deprecated Use createOrder from @/services/orderService instead for better business logic handling
export async function createOrder(data: {
  client_id: string
  contact_id?: string | null
  shipper_id?: string | null
  buyer_id?: string | null
  type: 'international' | 'local'
  team_id: string
  order_date: string
  client_ref_code?: string | null
  vessel_carrier?: string | null
  bill_of_lading?: string | null
  bill_of_lading_date?: string | null
  order_number?: string | null
}) {
  const supabase = createClient()

  try {
    // Use provided order number if available, otherwise generate a new one
    let orderNumber = data.order_number;

    // Generate an order number only if not provided
    if (!orderNumber) {
      // Fetch team information to get the correct team code
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('name')
        .eq('id', data.team_id)
        .single();

      if (teamError) {
        logger.error('Error fetching team data:', teamError);
        throw teamError;
      }

      // Map team name to team code
      const teamCode = teamData.name === 'Marine' ? 'MR' :
                      teamData.name === 'Agri' ? 'AF' :
                      teamData.name === 'CG' ? 'CG' : 'XX';

      const typePrefix = data.type === 'international' ? 'I' : 'L';
      const currentYear = new Date().getFullYear().toString().substring(2); // Get last 2 digits of year

      // Get next sequence number
      const { nextSequence, formattedOrderNumber } = await fetchNextOrderSequence(
        typePrefix,
        teamCode,
        currentYear
      );

      orderNumber = formattedOrderNumber;
    }

    // Insert new order
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        client_id: data.client_id,
        contact_id: data.contact_id,
        type: data.type,
        team_id: data.team_id,
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
    logger.error('Error creating order:', error)
    return { order: null, error: error.message }
  }
}

// Update an existing order
// @deprecated Use updateOrder from @/services/orderService instead for better business logic handling
export async function updateOrder(
  orderId: string,
  data: {
    client_id?: string
    contact_id?: string | null
    type?: 'international' | 'local'
    team_id?: string
    status?: 'draft' | 'confirmed' | 'completed' | 'cancelled'
    order_date?: string
    client_ref_code?: string | null
    notes?: string | null
    shipper_id?: string | null
    buyer_id?: string | null
    vessel_carrier?: string | null
    bill_of_lading?: string | null
    bill_of_lading_date?: string | null
    order_number?: string
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
      .single();

    if (error) throw error

    return { order, error: null }
  } catch (error: any) {
    logger.error('Error updating order:', error)

    // Improve error handling
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = error.message || JSON.stringify(error);
    } else {
      errorMessage = 'Unknown error occurred while updating order';
    }

    return { order: null, error: errorMessage }
  }
}

// Delete an order
// @deprecated Use deleteOrder from @/services/orderService instead for better business logic handling
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
    logger.error('Error deleting order:', error)
    return { success: false, error: error.message }
  }
}

// Get the next sequence number for order numbers
export async function fetchNextOrderSequence(
  typePrefix: string,
  teamCode: string,
  yearCode: string
) {
  const supabase = createClient()

  try {
    // Look for the highest existing sequence number for this prefix combination
    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_number')
      .like('order_number', `${typePrefix}${teamCode}${yearCode}-%`)
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

    // Format sequence number with leading zeros
    const sequenceFormatted = String(nextSequence).padStart(3, '0')

    // Create the full formatted order number
    const formattedOrderNumber = `${typePrefix}${teamCode}${yearCode}-${sequenceFormatted}`

    return { nextSequence, formattedOrderNumber, error: null }
  } catch (error: any) {
    logger.error('Error getting next sequence:', error)
    const sequenceFormatted = String(1).padStart(3, '0')
    const formattedOrderNumber = `${typePrefix}${teamCode}${yearCode}-${sequenceFormatted}`
    return { nextSequence: 1, formattedOrderNumber, error: error.message }
  }
}

// Add OrderItemsResponse type definition
interface OrderItemsResponse {
  orderItems: Array<{
    id: string;
    order_id: string;
    commodity_id: string;
    commodity?: any;
    quantity: number;
    unit_id: string;
    unit: any;
    units?: any;
    commodity_description?: string;
  }>;
  error: string | null;
}

// Hàm lấy các order items của một order
// @deprecated Use fetchOrderItems from @/services/orderService instead for better business logic handling
export const fetchOrderItems = async (orderId: string): Promise<OrderItemsResponse> => {
  const supabase = createClient()
  try {
    if (!orderId) {
      return { orderItems: [], error: 'No orderId provided' };
    }

    // Validate that orderId is a valid UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
      return { orderItems: [], error: 'Invalid orderId format' };
    }

    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        commodity_id,
        quantity,
        unit_id,
        units (
          id,
          name
        ),
        commodity_description
      `)
      .eq('order_id', orderId);

    if (error) {
      return { orderItems: [], error: error.message };
    }

    if (!data) {
      return { orderItems: [], error: null };
    }

    // Process the items to transform the nested data structure
    const processedItems = data.map((item: any) => {
      // Extract nested objects
      const unit = item.units || null;

      // Return normalized item with both formats for compatibility
      return {
        id: item.id,
        order_id: item.order_id,
        commodity_id: item.commodity_id,
        quantity: item.quantity,
        unit_id: item.unit_id,
        units: unit,           // Keep for backward compatibility
        unit: unit,            // Add this format too
        commodity_description: item.commodity_description,
        commodity: null        // Add empty commodity for compatibility
      };
    });

    return { orderItems: processedItems, error: null };
  } catch (err: any) {
    const errorMessage = err.message || JSON.stringify(err) || 'Unknown error in fetchOrderItems';
    return { orderItems: [], error: errorMessage };
  }
};

// Hàm tạo order item mới
// @deprecated Use createOrderItem from @/services/orderService instead for better business logic handling
export async function createOrderItem(data: {
  order_id: string
  commodity_id: string
  quantity: number
  unit_id: string
  commodity_description?: string
}) {
  const supabase = createClient()

  try {
    // Extract only the fields that exist in the order_items table
    const {
      order_id,
      commodity_id,
      quantity,
      unit_id,
      commodity_description
      // Ignore any other fields
    } = data;

    // Create a clean payload with only valid fields
    const cleanPayload = {
      order_id,
      commodity_id,
      quantity,
      unit_id,
      // Only include commodity_description if it's defined
      ...(commodity_description ? { commodity_description } : {})
    };

    // Tạo order item mới
    const response = await supabase
      .from('order_items')
      .insert([cleanPayload])
      .select()
      .single()
    const { data: orderItem, error: orderItemError } = response;

    if (orderItemError) throw orderItemError

    return { orderItem, error: null }
  } catch (error: any) {
    logger.error('Lỗi khi tạo order item:', error)

    // Improve error handling
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = error.message || JSON.stringify(error);
    } else {
      errorMessage = 'Unknown error occurred while creating order item';
    }

    return { orderItem: null, error: errorMessage }
  }
}

// Hàm cập nhật order item
// @deprecated Use updateOrderItem from @/services/orderService instead for better business logic handling
export async function updateOrderItem(
  orderItemId: string,
  data: {
    commodity_id?: string
    quantity?: number
    unit_id?: string
    commodity_description?: string
  }
) {
  const supabase = createClient()

  try {
    // Extract only the fields that exist in the order_items table
    const {
      commodity_id,
      quantity,
      unit_id,
      commodity_description
      // Ignore any other fields
    } = data;

    // Create a clean payload with only valid fields
    const cleanPayload = {
      ...(commodity_id ? { commodity_id } : {}),
      ...(quantity !== undefined ? { quantity } : {}),
      ...(unit_id ? { unit_id } : {}),
      ...(commodity_description !== undefined ? { commodity_description } : {})
    };

    // Cập nhật order item
    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .update(cleanPayload)
      .eq('id', orderItemId)
      .select()
      .single()

    if (orderItemError) throw orderItemError

    return { orderItem, error: null }
  } catch (error: any) {
    logger.error('Lỗi khi cập nhật order item:', error)

    // Improve error handling
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = error.message || JSON.stringify(error);
    } else {
      errorMessage = 'Unknown error occurred while updating order item';
    }

    return { orderItem: null, error: errorMessage }
  }
}

// Hàm xóa order item
// @deprecated Use deleteOrderItem from @/services/orderService instead for better business logic handling
export async function deleteOrderItem(orderItemId: string) {
  const supabase = createClient()

  try {
    // Xóa order item
    const { error: orderItemError } = await supabase
      .from('order_items')
      .delete()
      .eq('id', orderItemId)

    if (orderItemError) throw orderItemError

    return { success: true, error: null }
  } catch (error: any) {
    logger.error('Lỗi khi xóa order item:', error)

    // Improve error handling
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = error.message || JSON.stringify(error);
    } else {
      errorMessage = 'Unknown error occurred while deleting order item';
    }

    return { success: false, error: errorMessage }
  }
}

// Hàm xóa tất cả order items của một order
// @deprecated Use deleteOrderItemsByOrderId from @/services/orderService instead for better business logic handling
export async function deleteOrderItemsByOrderId(orderId: string) {
  const supabase = createClient()

  try {
    // Xóa tất cả order items của order
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error: any) {
    logger.error('Lỗi khi xóa order items:', error)

    // Improve error handling
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = error.message || JSON.stringify(error);
    } else {
      errorMessage = 'Unknown error occurred while deleting order items';
    }

    return { success: false, error: errorMessage }
  }
}

// Fetch contacts by client ID
export const fetchContactsByClientId = async (clientId: string) => {
  const supabase = createClient()

  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false }) // Order by created_at descending to get newest first

    if (error) {
      throw error
    }

    return { contacts, error: null }
  } catch (error: any) {
    logger.error('Error fetching contacts:', error)
    return { contacts: [], error: error.message }
  }
}

// Fetch orders by client ID with pagination
export const fetchOrdersByClientId = async (clientId: string, page = 1, limit = 10) => {
  const supabase = createClient()

  try {
    // Calculate offset based on page and limit
    const offset = (page - 1) * limit

    // First, get the total count
    const { count, error: countError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)

    if (countError) {
      throw countError
    }

    // Then get the paginated data
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        order_date,
        status,
        team_id,
        teams:team_id (id, name)
      `)
      .eq('client_id', clientId)
      .order('order_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // Format orders to include team name
    const formattedOrders = orders.map(order => {
      const teamInfo = order.teams || {};
      return {
        ...order,
        team_name: teamInfo.name || null
      }
    });

    // Calculate total pages
    const totalPages = Math.ceil((count || 0) / limit)

    return {
      orders: formattedOrders,
      totalPages,
      currentPage: page,
      totalCount: count || 0,
      error: null
    }
  } catch (error: any) {
    logger.error('Error fetching orders by client ID:', error)
    return {
      orders: [],
      totalPages: 0,
      currentPage: page,
      totalCount: 0,
      error: error.message
    }
  }
}

// Fetch all commodities with pagination
export const fetchCommodities = async ({ page = 1, limit = 10, searchQuery = '' } = {}) => {
  const supabase = createClient()

  try {
    let query = supabase
      .from('commodities_new')
      .select('*', { count: 'exact' })

    // Add search filter if provided
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    }

    // Add pagination
    const startIndex = (page - 1) * limit
    query = query.range(startIndex, startIndex + limit - 1)

    // Add sorting
    query = query.order('name', { ascending: true })

    const { data, error, count } = await query

    if (error) {
      return { commodities: [], total: 0, error: error.message }
    }

    return {
      commodities: data || [],
      total: count || 0,
      error: null
    }
  } catch (error: any) {
    return {
      commodities: [],
      total: 0,
      error: error.message || 'Unknown error'
    }
  }
}

// Hàm lấy chi tiết một hàng hóa
export async function fetchCommodity(commodityId: string) {
  const supabase = createClient()

  try {
    // Lấy thông tin hàng hóa
    const { data: commodity, error: commodityError } = await supabase
      .from('commodities_new')
      .select(`
        *,
        teams:commodities_teams_new(team_id)
      `)
      .eq('id', commodityId)
      .single()

    if (commodityError) throw commodityError

    // Lấy thông tin chi tiết về các team
    if (commodity && commodity.teams && commodity.teams.length > 0) {
      const teamIds = commodity.teams.map((t: any) => t.team_id)

      const { data: teamDetails, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .in('id', teamIds)

      if (!teamError && teamDetails) {
        commodity.team_details = teamDetails
      }
    }

    return { commodity, error: null }
  } catch (error: any) {
    logger.error('Lỗi khi lấy thông tin hàng hóa:', error)
    return { commodity: null, error: error.message }
  }
}

// Fetch units with optional pagination and search
export async function fetchUnits(page = 1, limit = 50, searchQuery = '') {
  const supabase = createClient()

  try {
    let query = supabase
      .from('units')
      .select('*', { count: 'exact' })

    // Add search filter if provided
    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`)
    }

    // Add pagination
    const startIndex = (page - 1) * limit
    query = query.range(startIndex, startIndex + limit - 1)

    // Add sorting
    query = query.order('name', { ascending: true })

    const { data, error, count } = await query

    if (error) throw error

    return {
      units: data || [],
      total: count || 0,
      error: null
    }
  } catch (error: any) {
    return {
      units: [],
      total: 0,
      error: error.message
    }
  }
}

// Fetch a specific unit by ID
export async function fetchUnit(unitId: string) {
  const supabase = createClient()

  try {
    const { data: unit, error } = await supabase
      .from('units')
      .select('*')
      .eq('id', unitId)
      .single()

    if (error) throw error

    return { unit, error: null }
  } catch (error: any) {
    logger.error('Error fetching unit:', error)
    return { unit: null, error: error.message }
  }
}