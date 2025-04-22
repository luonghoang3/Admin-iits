import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { PostgrestError } from '@supabase/supabase-js'
import logger from '@/lib/logger'

interface TeamData {
  id: number | string
  name: string
  description?: string | null
  created_at: string
}

export default async function TeamDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  try {
    // Access params directly
    const id = params.id;
    
    if (!id) {
      logger.log('ID không hợp lệ: undefined');
      notFound();
    }
    
    const supabase = await createClient();
    
    // Kiểm tra session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect('/login');
    }
    
    // Kiểm tra quyền admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();
      
    if (!profile?.is_active) {
      redirect('/login?error=inactive');
    }
    
    if (profile?.role !== 'admin') {
      redirect('/dashboard');
    }
    
    // Lấy dữ liệu team - hỗ trợ cả ID số hoặc UUID
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error('Lỗi Supabase:', error);
      if (error.code === 'PGRST116') {
        logger.log('Không tìm thấy team với ID:', id);
        notFound();
      }
      throw error;
    }
    
    if (!data) {
      logger.log('Không có dữ liệu team cho ID:', id);
      notFound();
    }
    
    // Ép kiểu dữ liệu để TypeScript hiểu
    const team = data as TeamData;
    
    return (
      <div className="p-6">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold mb-4">Quản lý đội nhóm</h1>
          <div className="flex space-x-4">
            <Link 
              href="/dashboard/teams" 
              className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
            >
              Danh sách
            </Link>
            <Link 
              href="/dashboard/teams/add" 
              className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
            >
              Thêm đội mới
            </Link>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Chi tiết đội</h2>
          <div className="space-x-2">
            <Link
              href={`/dashboard/teams/edit/${team.id}`}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Chỉnh sửa
            </Link>
            <Link
              href="/dashboard/teams"
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Quay lại
            </Link>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-2 font-semibold pr-4">ID:</td>
                <td>{team.id}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold pr-4">Tên đội:</td>
                <td>{team.name}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold pr-4">Mô tả:</td>
                <td>
                  {team.description ? (
                    team.description
                  ) : (
                    <span className="text-gray-400 italic">Chưa có mô tả</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2 font-semibold pr-4">Ngày tạo:</td>
                <td>{new Date(team.created_at).toLocaleDateString('vi-VN')}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-8 border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Thành viên</h3>
            <p className="text-gray-500 italic">Chức năng quản lý thành viên đang được phát triển</p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    logger.error('Lỗi khi tải thông tin team:', error);
    throw new Error('Không thể tải thông tin đội. Vui lòng thử lại sau.');
  }
} 