'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ReloadIcon } from '@radix-ui/react-icons'
import logger from '@/lib/logger'

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
      logger.error('Lỗi đăng nhập:', err)
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
      logger.error('Lỗi khi tạo tài khoản admin:', err)
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Đăng nhập</CardTitle>
            <CardDescription className="text-center">
              Nhập thông tin đăng nhập của bạn
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <div className="flex justify-between w-full">
              <Button variant="link" asChild>
                <Link href="/">Quay lại trang chủ</Link>
              </Button>
              <Button 
                variant="outline" 
                onClick={createAdminUser}
                disabled={loading}
              >
                Tạo tài khoản Admin
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 