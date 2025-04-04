'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { use } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string | null
}

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  // Access params directly
  const categoryId = params.id
  
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | null>(null)

  const supabase = createClient()

  // Lấy thông tin danh mục hiện tại
  useEffect(() => {
    async function fetchCategory() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('id', categoryId)
          .single()

        if (error) {
          throw error
        }

        if (data) {
          setCategory(data)
          setName(data.name)
          setDescription(data.description || '')
        } else {
          throw new Error('Không tìm thấy danh mục')
        }
      } catch (error: any) {
        console.error('Lỗi khi lấy thông tin danh mục:', error)
        setFetchError(error.message || 'Đã xảy ra lỗi khi tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }

    fetchCategory()
  }, [categoryId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitError(null)
    setSuccess(false)

    try {
      // Kiểm tra trường bắt buộc
      if (!name.trim()) {
        throw new Error('Tên danh mục là bắt buộc')
      }

      // Cập nhật danh mục
      const { data, error: updateError } = await supabase
        .from('categories')
        .update({
          name,
          description: description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId)
        .select()

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      
      // Chuyển hướng sau 1.5 giây
      setTimeout(() => {
        router.push('/dashboard/categories')
        router.refresh()
      }, 1500)
      
    } catch (err: any) {
      console.error('Lỗi khi cập nhật danh mục:', err)
      setSubmitError(err.message || 'Đã xảy ra lỗi khi cập nhật danh mục')
    } finally {
      setLoading(false)
    }
  }

  if (fetchError) {
    return (
      <div className="p-6">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold mb-4">Chỉnh sửa danh mục</h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/dashboard/categories">
            <Button variant="outline">Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold mb-4">Chỉnh sửa danh mục</h1>
        <div className="flex space-x-4">
          <Link 
            href="/dashboard/categories" 
            className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
          >
            Danh sách
          </Link>
        </div>
      </div>
      
      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <AlertDescription>Cập nhật danh mục thành công! Đang chuyển hướng...</AlertDescription>
        </Alert>
      )}
      
      <div className="max-w-2xl bg-white p-6 rounded-md shadow-sm">
        {loading && !category ? (
          <div className="py-8 text-center">
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label htmlFor="name" className="block text-sm font-medium mb-1">
                Tên danh mục <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
                disabled={loading}
              />
            </div>
            
            <div className="mb-6">
              <Label htmlFor="description" className="block text-sm font-medium mb-1">
                Mô tả
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full"
                rows={4}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Cập nhật danh mục'}
              </Button>
              <Link href="/dashboard/categories">
                <Button type="button" variant="outline">
                  Hủy
                </Button>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
} 