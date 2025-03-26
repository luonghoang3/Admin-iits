'use client'

import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

export default function AuthCheck({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    let isMounted = true;
    
    async function checkAuth() {
      try {
        const supabase = createClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          throw authError;
        }
        
        if (!isMounted) return;
        
        if (!session) {
          redirect('/login')
        } else {
          setIsLoading(false)
        }
      } catch (err: any) {
        console.error('Lỗi xác thực:', err)
        if (isMounted) {
          setError(err.message || 'Có lỗi xảy ra khi kiểm tra xác thực.')
          setIsLoading(false)
        }
      }
    }
    
    checkAuth()
    
    return () => {
      isMounted = false;
    };
  }, [])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500">Đang kiểm tra xác thực...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-3">Lỗi kết nối</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-gray-600 mb-4">Vui lòng kiểm tra kết nối mạng và cấu hình Supabase của bạn.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
} 