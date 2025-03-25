'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      
      // Đăng nhập người dùng
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Nếu đăng nhập thành công, refresh trang để middleware xử lý chuyển hướng
      router.refresh()
      // Chuyển hướng đến dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Lỗi đăng nhập:', err)
      if (err.message.includes('Invalid login credentials')) {
        setError('Thông tin đăng nhập không chính xác. Vui lòng kiểm tra email và mật khẩu.')
      } else {
        setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Hàm tạo tài khoản admin nếu chưa có
  const createAdminUser = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    
    const adminEmail = 'admin@example.com'
    const adminPassword = 'Admin@123456'
    
    try {
      const supabase = createClient()
      
      // Tạo tài khoản admin mẫu
      const { error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: 'Admin User'
          }
        }
      })
      
      if (signUpError) {
        throw signUpError
      }
      
      setMessage(`Đã tạo tài khoản ${adminEmail} với mật khẩu ${adminPassword}. Vui lòng sử dụng để đăng nhập.`)
      setEmail(adminEmail)
      setPassword(adminPassword)
    } catch (err: any) {
      console.error('Lỗi khi tạo tài khoản admin:', err)
      if (err.message.includes('already registered')) {
        setMessage(`Tài khoản ${adminEmail} đã tồn tại. Hãy sử dụng để đăng nhập.`)
        setEmail(adminEmail)
        setPassword(adminPassword)
      } else {
        setError(err.message || 'Không thể tạo tài khoản admin. Vui lòng liên hệ quản trị viên.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-6 text-center text-2xl font-bold">Đăng nhập</h1>
          
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-4 rounded-md bg-blue-50 p-4 text-sm text-blue-600">
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </div>
          </form>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Quay lại trang chủ
            </Link>
            <button 
              onClick={createAdminUser}
              className="ml-4 text-green-600 hover:text-green-800"
              disabled={loading}
            >
              Tạo tài khoản Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 