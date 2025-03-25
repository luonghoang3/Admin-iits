'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, fetchUsers } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
  email: string
  team_ids?: string[]
  teams?: string[]
  team_names?: string
}

// Hàm tạo màu ngẫu nhiên nhưng ổn định cho mỗi team dựa trên tên
function getTeamColor(teamName: string): string {
  // Tạo hash từ tên team
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Danh sách các màu pastel an toàn
  const colors = [
    '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', 
    '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff',
    '#fffffc', '#d8f3dc', '#b7e4c7', '#95d5b2'
  ];
  
  // Lấy màu dựa trên hash
  return colors[Math.abs(hash) % colors.length];
}

export default function UsersPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function loadData() {
      const supabase = await createClient()
      
      try {
        // Kiểm tra đăng nhập
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          setError(authError.message)
          setLoading(false)
          return
        }
        
        if (!user) {
          redirect('/login')
          return
        }
        
        setUser(user)

        // Kiểm tra quyền admin (sử dụng maybeSingle để tránh lỗi)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        
        // Nếu lỗi khi kiểm tra profile hoặc không có profile
        if (profileError || !profile) {
          console.error('Lỗi khi kiểm tra quyền admin:', profileError)
          // Chuyển về dashboard để tạo profile trước
          redirect('/dashboard')
          return
        }
        
        // Kiểm tra quyền admin
        if (profile.role !== 'admin') {
          redirect('/dashboard')
          return
        }
        
        // Lấy danh sách người dùng với thông tin team
        const { users, error: usersError } = await fetchUsers()
        
        if (usersError) {
          setError(`Không thể tải danh sách người dùng: ${usersError}`)
        } else {
          setProfiles(users)
        }
      } catch (err: any) {
        console.error('Lỗi:', err)
        setError(err.message || 'Đã có lỗi xảy ra')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  async function handleDeleteUser(userId: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return
    }
    
    try {
      setLoading(true)
      
      const supabase = createClient()
      
      // Xóa bản ghi trong public.profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
      
      if (profileError) throw profileError
      
      // Cập nhật lại danh sách
      setProfiles(profiles.filter(profile => profile.id !== userId))
      
      alert('Xóa người dùng thành công')
    } catch (err: any) {
      console.error('Lỗi khi xóa người dùng:', err)
      alert(`Lỗi khi xóa người dùng: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <Link
          href="/dashboard/users/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Thêm người dùng
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="bg-white overflow-hidden shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tài khoản
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhóm
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Không có người dùng nào.
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            {profile.username?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || '?'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {profile.username || 'Chưa đặt tên'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {profile.full_name || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {profile.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        profile.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {profile.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {profile.teams && profile.teams.length > 0 ? (
                          profile.teams.map((teamName, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-gray-800"
                              style={{ backgroundColor: getTeamColor(teamName) }}
                            >
                              {teamName}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Không có nhóm</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        profile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {profile.is_active ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <Link
                          href={`/dashboard/users/edit/${profile.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Sửa
                        </Link>
                        <button
                          onClick={() => handleDeleteUser(profile.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={profile.id === user?.id}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 