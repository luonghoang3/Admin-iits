'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { DataTable } from './data-table'
import { columns, Category } from './columns'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      try {
        // Kiểm tra xác thực
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          setError(authError.message)
          setLoading(false)
          return
        }
        
        if (!user) {
          redirect('/login')
          return
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
        
        // Lấy dữ liệu danh mục
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name')
        
        if (categoriesError) {
          setError(`Không thể tải danh mục: ${categoriesError.message}`)
        } else {
          // Lấy thông tin số lượng hàng hóa cho mỗi danh mục
          const categoriesWithCommodities = []
          
          for (const category of categoriesData || []) {
            // Lấy các commodity thuộc danh mục này
            const { data: commodities, error: commoditiesError } = await supabase
              .from('commodities')
              .select('id, name')
              .eq('category_id', category.id)
            
            categoriesWithCommodities.push({
              ...category,
              commodities: commodities || [],
              commodityCount: commodities?.length || 0
            })
          }
          
          setCategories(categoriesWithCommodities)
        }
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message || 'Đã xảy ra lỗi')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  async function handleDeleteCategory(categoryId: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      return
    }
    
    try {
      setLoading(true)
      
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
      
      if (deleteError) throw new Error(deleteError.message)
      
      // Cập nhật danh sách danh mục
      setCategories(categories.filter(category => category.id !== categoryId))
      alert('Xóa danh mục thành công')
    } catch (err: any) {
      console.error('Error deleting category:', err)
      alert(`Lỗi khi xóa danh mục: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý danh mục hàng hóa</h1>
        <Link
          href="/dashboard/categories/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Thêm danh mục mới
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="bg-white overflow-hidden shadow-md rounded-lg p-6">
          <DataTable 
            columns={columns} 
            data={categories} 
            onDeleteCategory={handleDeleteCategory}
          />
        </div>
      )}
    </div>
  )
} 