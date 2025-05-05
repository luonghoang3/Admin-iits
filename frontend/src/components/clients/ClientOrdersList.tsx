import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchOrdersByClientId } from '@/utils/supabase/client'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink
} from "lucide-react"

interface Order {
  id: string
  order_number: string
  order_date: string
  status: string
  team_name: string
}

interface ClientOrdersListProps {
  clientId: string
}

export default function ClientOrdersList({ clientId }: ClientOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 10 // Số đơn hàng mỗi trang

  const loadOrders = async (page: number) => {
    try {
      setLoading(true)
      const {
        orders: ordersData,
        totalPages: pages,
        totalCount: count,
        error: ordersError
      } = await fetchOrdersByClientId(clientId, page, limit)

      if (ordersError) {
        throw new Error(ordersError)
      }

      setOrders(ordersData)
      setTotalPages(pages)
      setTotalCount(count)
      setCurrentPage(page)
    } catch (err: any) {
      console.error('Error loading client orders:', err)
      setError(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clientId) {
      loadOrders(1)
    }
  }, [clientId])

  // Hàm xử lý chuyển trang
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    loadOrders(page)
  }

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Đang tải danh sách đơn hàng...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Lỗi: {error}</p>
      </div>
    )
  }

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{orders.length > 0 ? (currentPage - 1) * limit + 1 : 0}</span> đến{' '}
              <span className="font-medium">{Math.min(currentPage * limit, totalCount)}</span> trong tổng số{' '}
              <span className="font-medium">{totalCount}</span> đơn hàng
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <Button
                variant="outline"
                size="icon"
                className="rounded-l-md"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Trang đầu</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Trang trước</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Hiển thị số trang */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Tính toán các trang cần hiển thị
                let pageNum;
                if (totalPages <= 5) {
                  // Nếu tổng số trang <= 5, hiển thị tất cả
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  // Nếu đang ở gần đầu
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  // Nếu đang ở gần cuối
                  pageNum = totalPages - 4 + i;
                } else {
                  // Ở giữa, hiển thị trang hiện tại ở giữa
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    onClick={() => handlePageChange(pageNum)}
                    className="h-9 w-9"
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Trang sau</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-r-md"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Trang cuối</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Khách hàng này chưa có đơn hàng nào.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số Order
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày Order
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.order_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.order_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.team_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(order.status)}`}
                    >
                      {order.status || 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/orders/${order.id}`} className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        <span>Chi tiết</span>
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Hiển thị phân trang nếu có nhiều hơn 1 trang */}
      {!loading && orders.length > 0 && renderPagination()}
    </div>
  )
}
