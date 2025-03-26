'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function TeamsHeader() {
  const pathname = usePathname()

  return (
    <div className="border-b pb-4 mb-6">
      <h1 className="text-2xl font-bold mb-4">Quản lý đội nhóm</h1>
      <div className="flex space-x-4">
        <Link
          href="/dashboard/teams"
          className={`px-3 py-2 rounded-md ${
            pathname === '/dashboard/teams'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Danh sách
        </Link>
        <Link
          href="/dashboard/teams/add"
          className={`px-3 py-2 rounded-md ${
            pathname === '/dashboard/teams/add'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Thêm đội mới
        </Link>
      </div>
    </div>
  )
} 