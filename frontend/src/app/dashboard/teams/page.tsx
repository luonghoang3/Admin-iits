'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient, fetchTeams, deleteTeam, checkTeamsTable } from '@/utils/supabase/client'

interface Team {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export default function TeamsPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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
        
        // Kiểm tra bảng teams tồn tại
        console.log('Kiểm tra bảng teams...')
        const { exists, error: tableError } = await checkTeamsTable()
        
        if (!exists) {
          console.error('Bảng teams không tồn tại:', tableError)
          setError(`Bảng teams chưa được tạo trong cơ sở dữ liệu: ${tableError}`)
          setLoading(false)
          return
        }
        
        // Lấy danh sách teams
        loadTeams()
      } catch (err: any) {
        console.error('Lỗi:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])
  
  const loadTeams = async () => {
    try {
      console.log('Bắt đầu tải danh sách nhóm...');
      const result = await fetchTeams();
      console.log('Kết quả fetchTeams:', result);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setTeams(result.teams || []);
    } catch (err: any) {
      console.error('Lỗi khi lấy danh sách nhóm:', err);
      setError(err.message || String(err));
    }
  }
  
  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm này không?')) {
      return
    }
    
    try {
      const { success, error } = await deleteTeam(id)
      
      if (!success) {
        throw new Error(error || 'Không thể xóa nhóm')
      }
      
      // Cập nhật danh sách sau khi xóa
      setTeams(teams.filter(team => team.id !== id))
    } catch (err: any) {
      console.error('Lỗi khi xóa nhóm:', err)
      alert(`Lỗi khi xóa nhóm: ${err.message}`)
    }
  }
  
  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }
  
  // Hiển thị hướng dẫn migration nếu có lỗi liên quan đến bảng teams không tồn tại
  if (error && error.includes('Bảng teams chưa được tạo')) {
    return (
      <div className="p-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Cần thiết lập cơ sở dữ liệu</h1>
          <p className="mb-4">Bảng teams chưa được tạo trong cơ sở dữ liệu. Bạn cần thực hiện migration thủ công:</p>
          
          <ol className="list-decimal list-inside space-y-2 mb-6 ml-4">
            <li>Truy cập Supabase Studio tại <a href="http://localhost:8000" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://localhost:8000</a></li>
            <li>Đăng nhập với thông tin: <span className="font-mono bg-gray-100 px-2 py-1 rounded">username: supabase, password: this_password_is_insecure_and_should_be_updated</span></li>
            <li>Chuyển đến phần <strong>SQL Editor</strong></li>
            <li>Tạo một query mới và dán nội dung sau:</li>
          </ol>
          
          <div className="bg-gray-800 text-gray-200 p-4 rounded-md mb-6 overflow-x-auto font-mono text-sm whitespace-pre">
{`-- Tạo bảng teams
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Thêm cột team_id vào bảng profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Tạo index cho team_id
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id);

-- Tạo RLS policies cho teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Policy cho admin
CREATE POLICY "Admins can do everything with teams" ON public.teams
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Policy cho user thường - chỉ đọc
CREATE POLICY "Users can view teams" ON public.teams
  FOR SELECT USING (true);

-- Cập nhật trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gắn trigger cho teams
CREATE TRIGGER handle_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();`}
          </div>
          
          <p className="mb-6">Sau khi chạy SQL migration thành công, hãy tải lại trang này để tiếp tục.</p>
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tải lại trang
          </button>
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
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {teams.length === 0 ? (
          <p className="text-gray-500">Chưa có nhóm nào được tạo</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên nhóm
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teams.map((team) => (
                  <tr key={team.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {team.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {team.description || 'Không có mô tả'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(team.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <Link
                        href={`/dashboard/teams/edit/${team.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Sửa
                      </Link>
                      <Link
                        href={`/dashboard/teams/members/${team.id}`}
                        className="text-green-600 hover:text-green-800"
                      >
                        Quản lý thành viên
                      </Link>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 