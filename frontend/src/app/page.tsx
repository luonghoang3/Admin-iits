import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Admin Dashboard IITS</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Thông tin cấu hình</h2>
          <p className="mb-4">
            Hệ thống đã được cấu hình để kết nối với Supabase đang chạy trên localhost.
          </p>
          
          <div className="bg-gray-100 p-4 rounded-md mb-4">
            <p className="mb-2">Cấu hình hiện tại:</p>
            <pre className="overflow-x-auto p-2 bg-gray-200 rounded">
              <code>
{`# URL của Supabase 
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000

# API key của Supabase local
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
              </code>
            </pre>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            <strong>Lưu ý:</strong> Đảm bảo rằng:
          </p>
          <ul className="list-disc pl-6 text-sm text-gray-600 mb-4">
            <li>Supabase đã được khởi động và đang chạy trên localhost</li>
            <li>Port 8000 được sử dụng cho Supabase</li>
            <li>API key đã được cấu hình chính xác từ môi trường Supabase</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href="/login" 
            className="bg-blue-600 text-white py-3 px-4 rounded-md text-center hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </Link>
          <Link 
            href="/dashboard" 
            className="bg-gray-800 text-white py-3 px-4 rounded-md text-center hover:bg-gray-900 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
