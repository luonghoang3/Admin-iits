'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient, assignTeamToUser, fetchUsersWithTeams } from '@/utils/supabase/client'
import logger from '@/lib/logger'

interface User {
  id: string
  username: string
  email: string
  role: string
  team_id: string | null
  team_name?: string | null
}

export default function TeamMembersPage() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string
  
  const [teamName, setTeamName] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [nonTeamMembers, setNonTeamMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Kiểm tra đăng nhập và quyền admin
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      
      try {
        // Kiểm tra đăng nhập
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }
        
        // Kiểm tra quyền admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profileError) throw profileError
        
        if (profile?.role !== 'admin') {
          router.push('/dashboard')
          return
        }
        
        // Lấy thông tin team
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single()
        
        if (teamError) {
          throw new Error('Không tìm thấy nhóm')
        }
        
        setTeamName(team.name)
        
        // Lấy danh sách người dùng và phân loại
        fetchUsers()
      } catch (err: any) {
        logger.error('Lỗi:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [teamId, router])
  
  // Lấy danh sách người dùng và phân loại thành viên/không phải thành viên
  const fetchUsers = async () => {
    try {
      const { users: fetchedUsers, error } = await fetchUsersWithTeams()
      
      if (error) {
        throw new Error('Không thể lấy danh sách người dùng')
      }
      
      // Lưu tất cả người dùng
      setUsers(fetchedUsers || [])
      
      // Phân loại người dùng theo team
      const members = fetchedUsers?.filter(user => user.team_id === teamId) || []
      const nonMembers = fetchedUsers?.filter(user => user.team_id !== teamId) || []
      
      setTeamMembers(members)
      setNonTeamMembers(nonMembers)
    } catch (err: any) {
      logger.error('Lỗi khi lấy danh sách người dùng:', err)
      setError(err.message)
    }
  }
  
  // Thêm người dùng vào nhóm
  const addUserToTeam = async (userId: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { success, error } = await assignTeamToUser(userId, teamId)
      
      if (!success) {
        throw new Error(error || 'Không thể thêm người dùng vào nhóm')
      }
      
      setSuccess('Đã thêm người dùng vào nhóm thành công')
      
      // Cập nhật danh sách
      fetchUsers()
    } catch (err: any) {
      logger.error('Lỗi khi thêm người dùng vào nhóm:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Xóa người dùng khỏi nhóm
  const removeUserFromTeam = async (userId: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { success, error } = await assignTeamToUser(userId, null)
      
      if (!success) {
        throw new Error(error || 'Không thể xóa người dùng khỏi nhóm')
      }
      
      setSuccess('Đã xóa người dùng khỏi nhóm thành công')
      
      // Cập nhật danh sách
      fetchUsers()
    } catch (err: any) {
      logger.error('Lỗi khi xóa người dùng khỏi nhóm:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading && !error) {
    return (
      <div className="p-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý thành viên: {teamName}</h1>
        <Link 
          href="/dashboard/teams"
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          Quay lại danh sách nhóm
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-md mb-6">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Danh sách thành viên hiện tại */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Thành viên hiện tại</h2>
          
          {teamMembers.length === 0 ? (
            <p className="text-gray-500">Chưa có thành viên nào trong nhóm</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên người dùng
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quyền
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamMembers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => removeUserFromTeam(user.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Xóa khỏi nhóm
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Danh sách người dùng không thuộc nhóm */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Người dùng có thể thêm vào</h2>
          
          {nonTeamMembers.length === 0 ? (
            <p className="text-gray-500">Không có người dùng nào có thể thêm vào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên người dùng
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nhóm hiện tại
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {nonTeamMembers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.team_name || 'Không có nhóm'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => addUserToTeam(user.id)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          Thêm vào nhóm
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 