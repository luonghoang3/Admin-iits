'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient, updateTeam } from '@/utils/supabase/client'

export default function EditTeamPage() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  
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
        
        // Điền dữ liệu vào form
        setFormData({
          name: team.name || '',
          description: team.description || ''
        })
      } catch (err: any) {
        console.error('Lỗi:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [teamId, router])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    setFormData({
      ...formData,
      [name]: value
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Kiểm tra tên nhóm
      if (!formData.name.trim()) {
        throw new Error('Tên nhóm không được để trống')
      }
      
      // Cập nhật thông tin nhóm
      const { success, error } = await updateTeam(teamId, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      })
      
      if (!success) {
        throw new Error(error || 'Không thể cập nhật nhóm')
      }
      
      setSuccess('Cập nhật nhóm thành công!')
      
      // Chuyển về trang danh sách sau 2 giây
      setTimeout(() => {
        router.push('/dashboard/teams')
      }, 2000)
    } catch (err: any) {
      console.error('Lỗi khi cập nhật nhóm:', err)
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
        <h1 className="text-2xl font-bold">Chỉnh sửa nhóm</h1>
        <Link 
          href="/dashboard/teams"
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
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Tên nhóm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập tên nhóm"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập mô tả cho nhóm (tùy chọn)"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/teams"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 