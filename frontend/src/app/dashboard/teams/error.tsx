'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Ghi log lỗi cho quản trị viên
    console.error('Lỗi trang Teams:', error)
  }, [error])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý nhóm</h1>
        <Link
          href="/dashboard"
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          Quay lại Dashboard
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Đã xảy ra lỗi</h2>
          <p className="text-gray-600 mb-6">Không thể tải trang quản lý nhóm. Vui lòng thử lại sau.</p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Thử lại
            </button>
            
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
            >
              Quay lại Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 