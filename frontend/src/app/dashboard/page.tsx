import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'
import logger from '@/lib/logger'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  try {
    // Lấy thông tin profile của người dùng
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle()

    // Nếu không có profile, tạo mới
    if (!profile) {
      // Đặt mặc định là admin nếu không thể đếm số lượng profiles
      let isFirstUser = true
      
      try {
        // Đếm tổng số profiles để xác định người dùng đầu tiên
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        if (!countError && count !== null) {
          isFirstUser = count === 0
        }
      } catch (err) {
        logger.log('Bỏ qua lỗi đếm profiles, coi như user đầu tiên')
      }

      // Nếu là người dùng đầu tiên, set role là admin
      const role = isFirstUser ? 'admin' : 'user'

      // Tạo profile mới
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            full_name: '',
            role: role,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])

      if (insertError) {
        logger.error('Lỗi khi tạo profile:', insertError)
        // Vẫn tiếp tục xử lý
      }

      return <DashboardClient user={user} userRole={role} />
    }

    // Nếu tài khoản bị khóa, chuyển về trang login
    if (profile && !profile.is_active) {
      const { error: signOutError } = await supabase.auth.signOut()
      redirect('/login?error=account_inactive')
    }

    return <DashboardClient user={user} userRole={profile?.role || 'user'} />
  } catch (error) {
    logger.error('Lỗi khi xử lý dashboard:', error)
    return <DashboardClient user={user} userRole="user" />
  }
} 