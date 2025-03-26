'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Không import từ Supabase client
// import { fetchTeams, deleteTeam, checkTeamsTable } from '@/utils/supabase/client'

export default function TeamsPage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [errorMsg, setErrorMsg] = useState("Hiện có lỗi khi tải dữ liệu từ Supabase. Hãy kiểm tra kết nối và cấu hình.")
  
  // Theo dõi mounting
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Nếu không phải client side, hiển thị skeleton loading
  if (!isClient) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Quản lý nhóm</h1>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Đang tải...</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý nhóm</h1>
        <Link 
          href="/dashboard/teams/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Thêm nhóm mới
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center py-10">
          <p className="text-red-600 font-semibold mb-4">Đã xảy ra lỗi khi tải dữ liệu</p>
          <p className="text-gray-600 mb-6">{errorMsg}</p>
          
          <div className="flex justify-center space-x-4">
            <Link
              href="/dashboard/teams/add"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tạo nhóm mới
            </Link>
            
            <button
              onClick={() => router.refresh()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 