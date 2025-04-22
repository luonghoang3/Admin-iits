'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, fetchUsers } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { DataTable } from './data-table'
import { columns, UserProfile } from './columns'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import logger from '@/lib/logger'

export default function UsersPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profiles, setProfiles] = useState<UserProfile[]>([])
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
          logger.error('Lỗi khi kiểm tra quyền admin:', profileError)
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
        logger.error('Lỗi:', err)
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
      logger.error('Lỗi khi xóa người dùng:', err)
      alert(`Lỗi khi xóa người dùng: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <Button asChild>
          <Link href="/dashboard/users/add" className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm người dùng
          </Link>
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={profiles}
              onDeleteUser={handleDeleteUser}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
} 