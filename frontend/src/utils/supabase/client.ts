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

// Hàm lấy danh sách teams
export async function fetchTeams() {
  const supabase = createClient()
  
  try {
    // Lấy danh sách các teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true })
    
    if (teamsError) throw teamsError
    
    return { teams, error: null }
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách teams:', error)
    return { teams: [], error: error.message }
  }
}

// Hàm kiểm tra bảng teams tồn tại
export async function checkTeamsTable() {
  const supabase = createClient()
  
  try {
    // Cách 1: Thử truy vấn đến bảng teams
    const { data, error } = await supabase
      .from('teams')
      .select('id')
      .limit(1)
    
    // Nếu không có lỗi, bảng tồn tại
    if (!error) {
      return { exists: true, error: null }
    }
    
    // Nếu có lỗi "relation does not exist", bảng không tồn tại
    if (error.message && error.message.includes('relation "teams" does not exist')) {
      return { exists: false, error: 'Bảng teams không tồn tại trong cơ sở dữ liệu' }
    }
    
    // Lỗi khác (quyền truy cập, kết nối, v.v.)
    return { exists: false, error: error.message }
  } catch (error: any) {
    console.error('Lỗi khi kiểm tra bảng teams:', error)
    return { exists: false, error: error.message }
  }
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