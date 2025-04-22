'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package2, ArrowLeft, Pencil, Trash2, Layers, Users } from 'lucide-react'
import { fetchCommodityById } from '@/services/commodityService'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { use } from 'react'
import logger from '@/lib/logger'

export default function CommodityDetailPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use() to avoid warnings
  const unwrappedParams = use(params);
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [commodity, setCommodity] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCommodity = async () => {
      setLoading(true)
      try {
        const { commodity: commodityData, error } = await fetchCommodityById(unwrappedParams.id)

        if (error) {
          setError(error)
        } else {
          setCommodity(commodityData)
        }
      } catch (err) {
        setError('Có lỗi xảy ra khi tải thông tin hàng hóa')
        logger.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadCommodity()
  }, [unwrappedParams.id])

  if (error) {
    return (
      <div className="p-6">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
        </Button>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <Button
                onClick={() => router.push('/dashboard/commodities')}
                className="mt-4"
              >
                Quay lại danh sách hàng hóa
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/commodities/${unwrappedParams.id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" /> Chỉnh sửa
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              // Xử lý xóa hàng hóa
              if (confirm('Bạn có chắc chắn muốn xóa hàng hóa này không?')) {
                // Gọi API xóa hàng hóa
                alert('Chức năng xóa hàng hóa đang được phát triển')
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Xóa
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : commodity ? (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package2 className="h-6 w-6" />
            {commodity.name}
          </h1>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Mô tả</h3>
                <p className="mt-1">{commodity.description || 'Không có mô tả'}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Danh mục
                  </h3>
                  <div className="mt-2">
                    {commodity.category ? (
                      <div className="bg-blue-100 text-blue-800 inline-block px-3 py-1 rounded-full">
                        {commodity.category.name}
                      </div>
                    ) : (
                      <p className="text-gray-500">Chưa phân loại</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Đội nhóm
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {commodity.teams && commodity.teams.length > 0 ? (
                      commodity.teams.map((team: any) => (
                        <div key={team.id} className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                          {team.name}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">Chưa gán đội nhóm</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-gray-500">Thông tin khác</h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">ID</p>
                    <p className="text-sm font-mono">{commodity.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ngày tạo</p>
                    <p className="text-sm">
                      {new Date(commodity.created_at).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {commodity.updated_at && (
                    <div>
                      <p className="text-xs text-gray-500">Cập nhật lần cuối</p>
                      <p className="text-sm">
                        {new Date(commodity.updated_at).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Không tìm thấy thông tin hàng hóa
        </div>
      )}
    </div>
  )
}
