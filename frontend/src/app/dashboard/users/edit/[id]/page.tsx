'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { use } from 'react'

interface Params {
  id: string
}

export default function EditUserPage({ params }: { params: Params }) {
  const router = useRouter()
  const supabase = createClient()
  // Unwrap params using React.use()
  const unwrappedParams = use(params as any)
  const userId = unwrappedParams.id
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    role: 'user',
    is_active: true,
    avatar_url: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Tải thông tin người dùng
  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true)
        setError(null)
        
        // Lấy thông tin từ bảng profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (profileError) throw profileError
        
        if (profile) {
          setFormData({
            email: profile.email || `${profile.username || ''}@example.com`,
            username: profile.username || '',
            full_name: profile.full_name || '',
            role: profile.role || 'user',
            is_active: profile.is_active !== false, // Mặc định là true nếu null
            avatar_url: profile.avatar_url || ''
          })
        } else {
          throw new Error('Không tìm thấy thông tin người dùng')
        }
      } catch (err: any) {
        console.error('Lỗi khi tải thông tin người dùng:', err)
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin người dùng')
      } finally {
        setLoading(false)
      }
    }
    
    loadUserData()
  }, [userId, supabase])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    // Xử lý cho checkbox
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement
      setFormData({
        ...formData,
        [name]: target.checked
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Cập nhật thông tin profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
      
      if (profileError) throw profileError
      
      setSuccess('Cập nhật thông tin người dùng thành công!')
      setTimeout(() => {
        router.push('/dashboard/users')
      }, 2000)
    } catch (err: any) {
      console.error('Lỗi khi cập nhật người dùng:', err)
      setError(err.message || 'Có lỗi xảy ra khi cập nhật thông tin người dùng')
    } finally {
      setUpdating(false)
    }
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chỉnh sửa người dùng</h1>
        <Link 
          href="/dashboard/users"
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          Quay lại danh sách
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
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
          <p className="text-gray-500">Đang tải thông tin người dùng...</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL ảnh đại diện
                </label>
                <input
                  type="text"
                  id="avatar_url"
                  name="avatar_url"
                  value={formData.avatar_url}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Vai trò
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="user">Người dùng</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              
              <div>
                <div className="flex items-center mt-5">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700">
                    Kích hoạt tài khoản
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Tài khoản không kích hoạt sẽ không thể đăng nhập
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard/users"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {updating ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
} 