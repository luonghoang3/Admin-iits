import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

// Server action để xử lý form
async function updateUnit(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  
  if (!id || !name || name.trim() === '') {
    return
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
    
    // Cập nhật thông tin đơn vị
    const { error } = await supabase
      .from('units')
      .update({ 
        name: name.trim(),
        description: description ? description.trim() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) throw error
    
    // Cập nhật cache và chuyển hướng
    revalidatePath('/dashboard/units')
    redirect('/dashboard/units')
  } catch (err) {
    console.error('Lỗi khi cập nhật đơn vị:', err)
    // Chuyển hướng về trang chỉnh sửa với thông báo lỗi
    redirect(`/dashboard/units/edit/${id}?error=failed`)
  }
}

export default async function EditUnitPage({ params }: { params: { id: string } }) {
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
  
  // Lấy thông tin đơn vị cần chỉnh sửa
  const { data: unit, error } = await supabase
    .from('units')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (error || !unit) {
    notFound()
  }
  
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
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Chỉnh sửa đơn vị</h2>
      </div>
      
      <form action={updateUnit} className="bg-white shadow-md rounded-lg p-6">
        <input type="hidden" name="id" value={unit.id} />
        
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
            Tên đơn vị
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={unit.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tên đơn vị"
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
            defaultValue={unit.description || ''}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập mô tả về đơn vị tính (không bắt buộc)"
          ></textarea>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Link
            href="/dashboard/units"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Hủy
          </Link>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Cập nhật
          </button>
        </div>
      </form>
    </div>
  )
} 