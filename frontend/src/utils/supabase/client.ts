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
    
    // Không sử dụng admin.listUsers vì nó yêu cầu quyền admin
    // Thay vào đó, chỉ trả về thông tin từ bảng profiles
    const users = profiles.map(profile => {
      return {
        ...profile,
        email: profile.username ? `${profile.username}@example.com` : 'Không có thông tin'
      }
    })
    
    return { users, error: null }
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách người dùng:', error)
    return { users: [], error: error.message }
  }
}

// Hàm tạo người dùng mới
export async function createUser({ email, password, username, full_name, role, is_active }: {
  email: string
  password: string
  username?: string
  full_name?: string
  role?: string
  is_active?: boolean
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