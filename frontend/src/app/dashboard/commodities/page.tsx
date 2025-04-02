import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import DeleteButton from './components/DeleteButton'

// Định nghĩa interface cho đối tượng Team
interface Team {
  id: string;
  name: string;
}

// Server action để xử lý xóa
async function deleteCommodity(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  
  if (!id) {
    console.error('ID không được cung cấp')
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
    
    // Xóa commodity trực tiếp qua Supabase (cascade sẽ xóa luôn các liên kết trong commodities_teams)
    const { error } = await supabase
      .from('commodities')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw error
    }
    
    // Cập nhật cache
    revalidatePath('/dashboard/commodities')
  } catch (error) {
    console.error('Lỗi khi xóa hàng hóa:', error)
  }
}

export default async function CommoditiesPage() {
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
  
  // Lấy dữ liệu commodities
  const { data: commodities, error } = await supabase
    .from('commodities')
    .select('*')
    .order('name')
  
  // Lấy thông tin teams cho mỗi commodity
  const commoditiesWithTeams = []
  
  if (commodities) {
    for (const commodity of commodities) {
      // Lấy các team được liên kết với commodity
      const { data: teamLinks } = await supabase
        .from('commodities_teams')
        .select('team_id')
        .eq('commodity_id', commodity.id)
      
      // Lấy thông tin chi tiết của các team
      const teamIds = teamLinks?.map(link => link.team_id) || []
      let teams: Team[] = []
      
      if (teamIds.length > 0) {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, name')
          .in('id', teamIds)
        
        teams = teamsData || []
      }
      
      commoditiesWithTeams.push({
        ...commodity,
        teams
      })
    }
  }
  
  return (
    <div className="p-6">
      <div className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold mb-4">Quản lý hàng hóa</h1>
        <div className="flex space-x-4">
          <Link 
            href="/dashboard/commodities" 
            className="px-3 py-2 rounded-md bg-blue-500 text-white"
          >
            Danh sách
          </Link>
          <Link 
            href="/dashboard/commodities/add" 
            className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
          >
            Thêm hàng hóa mới
          </Link>
        </div>
      </div>
      
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
          <p>Đã xảy ra lỗi khi tải dữ liệu</p>
        </div>
      ) : commoditiesWithTeams.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Tên hàng hóa</th>
                <th className="border px-4 py-2 text-left">Mô tả</th>
                <th className="border px-4 py-2 text-left">Teams</th>
                <th className="border px-4 py-2 text-left">Ngày tạo</th>
                <th className="border px-4 py-2 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {commoditiesWithTeams.map((commodity: any) => (
                <tr key={commodity.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{commodity.name}</td>
                  <td className="border px-4 py-2">
                    {commodity.description ? (
                      <span>{commodity.description}</span>
                    ) : (
                      <span className="text-gray-400 italic">Chưa có mô tả</span>
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {commodity.teams && commodity.teams.length > 0 ? (
                        commodity.teams.map((team: any) => (
                          <span 
                            key={team.id}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {team.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">Không có team</span>
                      )}
                    </div>
                  </td>
                  <td className="border px-4 py-2">
                    {new Date(commodity.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    <Link
                      href={`/dashboard/commodities/edit/${commodity.id}`}
                      className="px-2 py-1 bg-gray-500 text-white rounded text-sm mr-2 hover:bg-gray-600"
                    >
                      Sửa
                    </Link>
                    <form id={`delete-commodity-${commodity.id}`} action={deleteCommodity} className="inline ml-2">
                      <input type="hidden" name="id" value={commodity.id} />
                      <DeleteButton commodityId={commodity.id} />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500 mb-4">Chưa có hàng hóa nào được tạo</p>
          <Link
            href="/dashboard/commodities/add"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tạo hàng hóa mới
          </Link>
        </div>
      )}
    </div>
  )
} 