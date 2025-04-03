'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AddCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Kiểm tra trường bắt buộc
      if (!name.trim()) {
        throw new Error('Tên danh mục là bắt buộc')
      }

      // Thêm danh mục mới
      const { data, error: insertError } = await supabase
        .from('categories')
        .insert([
          { name, description: description || null }
        ])
        .select()

      if (insertError) {
        throw insertError
      }

      setSuccess(true)
      setName('')
      setDescription('')
      
      // Chuyển hướng sau 1.5 giây
      setTimeout(() => {
        router.push('/dashboard/categories')
        router.refresh()
      }, 1500)
      
    } catch (err: any) {
      console.error('Lỗi khi thêm danh mục:', err)
      setError(err.message || 'Đã xảy ra lỗi khi thêm danh mục')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold mb-4">Thêm danh mục mới</h1>
        <div className="flex space-x-4">
          <Link 
            href="/dashboard/categories" 
            className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
          >
            Danh sách
          </Link>
          <Link 
            href="/dashboard/categories/add" 
            className="px-3 py-2 rounded-md bg-blue-500 text-white"
          >
            Thêm danh mục mới
          </Link>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <AlertDescription>Thêm danh mục thành công! Đang chuyển hướng...</AlertDescription>
        </Alert>
      )}
      
      <div className="max-w-2xl bg-white p-6 rounded-md shadow-sm">
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
              {loading ? 'Đang xử lý...' : 'Thêm danh mục'}
            </Button>
            <Link href="/dashboard/categories">
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
} 