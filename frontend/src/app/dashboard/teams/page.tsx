import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import DeleteButton from './components/DeleteButton'
import logger from '@/lib/logger'

// Server action để xử lý xóa
async function deleteTeam(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  
  if (!id) {
    logger.error('ID không được cung cấp')
    return
  }
  
  try {
    const supabase = await createClient()
    
    // Kiểm tra quyền
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Chưa đăng nhập')
    }
    
    // Kiểm tra quyền admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()
      
    if (!profile?.is_active) {
      throw new Error('Tài khoản không hoạt động')
    }
    
    if (profile?.role !== 'admin') {
      throw new Error('Không có quyền thực hiện')
    }
    
    // Xóa team trực tiếp qua Supabase
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw error
    }
    
    // Cập nhật cache
    revalidatePath('/dashboard/teams')
  } catch (error) {
    logger.error('Lỗi khi xóa team:', error)
  }
}

export default async function TeamsPage() {
  const supabase = await createClient()
  
  // Kiểm tra session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  
  // Kiểm tra quyền admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()
    
  if (!profile?.is_active) {
    redirect('/login?error=inactive')
  }
  
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }
  
  // Lấy dữ liệu teams
  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .order('name')
  
  return (
    <div className="p-6">
      <div className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold mb-4">Quản lý đội nhóm</h1>
        <div className="flex space-x-4">
          <Link 
            href="/dashboard/teams" 
            className="px-3 py-2 rounded-md bg-blue-500 text-white"
          >
            Danh sách
          </Link>
          <Link 
            href="/dashboard/teams/add" 
            className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
          >
            Thêm đội mới
          </Link>
        </div>
      </div>
      
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
          <p>Đã xảy ra lỗi khi tải dữ liệu</p>
        </div>
      ) : teams && teams.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Tên đội</th>
                <th className="border px-4 py-2 text-left">Mô tả</th>
                <th className="border px-4 py-2 text-left">Ngày tạo</th>
                <th className="border px-4 py-2 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team: any) => (
                <tr key={team.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{team.name}</td>
                  <td className="border px-4 py-2">
                    {team.description ? (
                      <span>{team.description}</span>
                    ) : (
                      <span className="text-gray-400 italic">Chưa có mô tả</span>
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {new Date(team.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    <Link
                      href={`/dashboard/teams/${team.id}`}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-sm mr-2 hover:bg-blue-600"
                    >
                      Chi tiết
                    </Link>
                    <Link
                      href={`/dashboard/teams/edit/${team.id}`}
                      className="px-2 py-1 bg-gray-500 text-white rounded text-sm mr-2 hover:bg-gray-600"
                    >
                      Sửa
                    </Link>
                    <form id={`delete-team-${team.id}`} action={deleteTeam} className="inline ml-2">
                      <input type="hidden" name="id" value={team.id} />
                      <DeleteButton teamId={team.id} />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500 mb-4">Chưa có đội nào được tạo</p>
          <Link
            href="/dashboard/teams/add"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tạo đội mới
          </Link>
        </div>
      )}
    </div>
  )
} 