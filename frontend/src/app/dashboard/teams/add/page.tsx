'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient, createTeam } from '@/utils/supabase/client'

export default function AddTeamPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  
  const [loading, setLoading] = useState(false)
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
      } catch (err: any) {
        console.error('Lỗi khi kiểm tra quyền:', err)
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router])
  
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
      
      // Tạo nhóm mới
      const { team, error } = await createTeam({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      })
      
      if (error) {
        throw new Error(error)
      }
      
      setSuccess('Tạo nhóm thành công!')
      
      // Reset form
      setFormData({
        name: '',
        description: ''
      })
      
      // Chuyển về trang danh sách sau 2 giây
      setTimeout(() => {
        router.push('/dashboard/teams')
      }, 2000)
    } catch (err: any) {
      console.error('Lỗi khi tạo nhóm:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Thêm nhóm mới</h1>
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
              {loading ? 'Đang lưu...' : 'Lưu nhóm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 