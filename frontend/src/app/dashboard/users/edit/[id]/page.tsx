'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { EditUserClient } from './client'
import logger from '@/lib/logger'

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
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
        
        setIsAuthorized(true)
      } catch (err: any) {
        logger.error('Lỗi khi kiểm tra quyền:', err)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [router])
  
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
          <p className="text-gray-500">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthorized) {
    return null // Sẽ chuyển hướng trong useEffect
  }
  
  return <EditUserClient userId={userId} />
} 