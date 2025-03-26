'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'

interface DashboardClientProps {
  user: User
  userRole: string | null
}

export default function DashboardClient({ user, userRole }: DashboardClientProps) {
  const [error, setError] = useState<string | null>(null)
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Xin chào, {user?.email}</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Thống kê */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Thống kê người dùng</h2>
          <div className="text-3xl font-bold text-blue-600">0</div>
          <p className="text-gray-500 mt-1">Tổng số người dùng</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Hoạt động hôm nay</h2>
          <div className="text-3xl font-bold text-green-600">0</div>
          <p className="text-gray-500 mt-1">Người dùng hoạt động</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Báo cáo</h2>
          <div className="text-3xl font-bold text-purple-600">0</div>
          <p className="text-gray-500 mt-1">Báo cáo mới</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hoạt động gần đây */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Hoạt động gần đây</h2>
          <div className="space-y-4">
            <p className="text-gray-500 text-center py-6">Chưa có hoạt động nào.</p>
          </div>
        </div>
        
        {/* Công việc */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Công việc</h2>
          <div className="space-y-2">
            <p className="text-gray-500 text-center py-6">Chưa có công việc nào.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 