import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Không tìm thấy nội dung</h2>
      <p className="mb-4">Trang hoặc đội nhóm bạn đang tìm kiếm không tồn tại.</p>
      <div className="flex gap-4">
        <Link
          href="/dashboard/teams"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Quay lại danh sách đội
        </Link>
        <Link
          href="/dashboard/users"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Về trang quản lý người dùng
        </Link>
      </div>
    </div>
  )
}