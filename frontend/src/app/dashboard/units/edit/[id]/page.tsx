import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

// Server action để xử lý form
async function updateUnit(formData: FormData) {
  'use server'
  
  const supabase = await createClient()
  
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  
  // Cập nhật unit
  const { error } = await supabase
    .from('units')
    .update({
      name,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  
  if (error) {
    throw new Error(`Lỗi khi cập nhật đơn vị tính: ${error.message}`)
  }
  
  // Revalidate path
  revalidatePath('/dashboard/units')
  
  // Chuyển hướng sau khi cập nhật
  redirect('/dashboard/units')
}

interface EditUnitPageProps {
  params: {
    id: string
  }
}

export default async function EditUnitPage({ params }: EditUnitPageProps) {
  // Access params directly
  const unitId = params.id
  
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
    .eq('id', unitId)
    .single()
  
  if (error || !unit) {
    notFound()
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link 
          href="/dashboard/units" 
          className="text-blue-500 hover:text-blue-700 flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Quay lại danh sách
        </Link>
        <h1 className="text-2xl font-bold mt-4">Cập nhật đơn vị tính</h1>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <form action={updateUnit} className="space-y-4">
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
    </div>
  )
} 