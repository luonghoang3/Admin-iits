import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

// Server action để xử lý form
async function createTeam(formData: FormData) {
  'use server'
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  
  if (!name || name.trim() === '') {
    return; // Sẽ hiển thị lỗi thông qua validation của HTML
  }
  
  try {
    const supabase = await createClient()
    
    // Kiểm tra session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirect('/login')
    }
    
    // Kiểm tra quyền admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()
      
    if (!profile?.is_active) {
      redirect('/login?error=inactive')
    }
    
    if (profile?.role !== 'admin') {
      redirect('/dashboard')
    }
    
    // Tạo team mới
    const { error } = await supabase
      .from('teams')
      .insert([{ 
        name: name.trim(),
        description: description ? description.trim() : null
      }])
    
    if (error) throw error
    
    // Cập nhật cache và chuyển hướng
    revalidatePath('/dashboard/teams')
    redirect('/dashboard/teams')
  } catch (err) {
    console.error('Lỗi khi tạo team:', err)
    // Không trả về lỗi, mà sẽ hiển thị lỗi server thông qua error.tsx
    redirect('/dashboard/teams/add?error=failed')
  }
}

export default async function AddTeamPage() {
  const supabase = await createClient()
  
  // Kiểm tra session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  
  // Kiểm tra quyền admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()
    
  if (!profile?.is_active) {
    redirect('/login?error=inactive')
  }
  
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }
  
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
            className="px-3 py-2 rounded-md bg-blue-500 text-white"
          >
            Thêm đội mới
          </Link>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Thêm đội mới</h2>
      </div>
      
      <form action={createTeam} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
            Tên đội
          </label>
          <input
            type="text"
            id="name"
            name="name"
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
            Tạo đội
          </button>
        </div>
      </form>
    </div>
  )
} 