'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function EditUnitError() {
  const params = useParams()
  const id = params.id as string
  
  return (
    <div className="p-6">
      <div className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold mb-4">Quản lý đơn vị tính</h1>
        <div className="flex space-x-4">
          <Link 
            href="/dashboard/units" 
            className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
          >
            Danh sách
          </Link>
          <Link 
            href="/dashboard/units/add" 
            className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
          >
            Thêm đơn vị mới
          </Link>
        </div>
      </div>
      
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded mb-6">
        <h2 className="text-lg font-bold mb-2">Đã xảy ra lỗi</h2>
        <p>Không thể cập nhật thông tin đơn vị. Vui lòng thử lại sau.</p>
      </div>
      
      <div className="flex space-x-4">
        <Link
          href={`/dashboard/units/edit/${id}`}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Thử lại
        </Link>
        <Link
          href="/dashboard/units"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Quay lại danh sách
        </Link>
      </div>
    </div>
  )
} 