import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

interface TeamData {
  id: number | string
  name: string
  description?: string | null
}

export default async function EditTeamPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  try {
    // Access params directly
    const id = params.id;
    
    if (!id) {
      console.log('ID không hợp lệ: undefined');
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
      .select('id, name, description')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Lỗi Supabase:', error);
      if (error.code === 'PGRST116') {
        console.log('Không tìm thấy team với ID:', id);
        notFound();
      }
      throw error;
    }
    
    if (!data) {
      console.log('Không có dữ liệu team cho ID:', id);
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
          <h2 className="text-xl font-semibold">Chỉnh sửa đội</h2>
          <Link
            href="/dashboard/teams"
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Hủy
          </Link>
        </div>
        
        <form action={`/api/teams/${team.id}`} method="POST" className="bg-white shadow-md rounded-lg p-6">
          <input type="hidden" name="_method" value="PUT" />
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
              Tên đội
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={team.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tên đội"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
              Mô tả
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={team.description || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập mô tả về đội (không bắt buộc)"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Link
              href="/dashboard/teams"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Hủy
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    );
  } catch (error) {
    console.error('Lỗi khi tải thông tin team:', error);
    throw new Error('Không thể tải thông tin đội. Vui lòng thử lại sau.');
  }
} 