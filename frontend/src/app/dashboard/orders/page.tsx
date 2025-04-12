'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, fetchOrders, deleteOrder } from '@/utils/supabase/client'
import { DataTable } from './data-table'
import { columns, Order } from './columns'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
// Đã loại bỏ import ClientCombobox

// Map các giá trị trạng thái và phòng ban
const departmentOptions = [
  { value: 'marine', label: 'Marine (MR)' },
  { value: 'agri', label: 'Agriculture (AG)' },
  { value: 'consumer_goods', label: 'Consumer Goods (CG)' }
]

const statusOptions = [
  { value: 'draft', label: 'Dự thảo' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' }
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientOptions, setClientOptions] = useState<Array<{value: string, label: string}>>([])

  // Thêm state cho phân trang và lọc
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalOrders, setTotalOrders] = useState(0)
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    client_id: '',
    search: ''
  })

  // Hàm tải danh sách khách hàng cho select
  const loadClientOptions = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name')
        .limit(100) // Giới hạn số lượng khách hàng tải về

      if (error) throw error

      if (data) {
        const options = data.map(client => ({
          value: client.id,
          label: client.name
        }))
        setClientOptions(options)
      }
    } catch (error: any) {
      console.error('Error loading client options:', error)
    }
  }, [])

  // Hàm tải dữ liệu với phân trang và lọc
  const loadData = useCallback(async () => {
    setLoading(true)

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

      // Lấy dữ liệu đơn hàng với phân trang và lọc
      const { orders: ordersData, total, error: ordersError } = await fetchOrders({
        page,
        limit,
        filters
      })

      if (ordersError) {
        setError(`Could not load orders: ${ordersError}`)
      } else {
        setOrders(ordersData)
        setTotalOrders(total)

        // Không cần cập nhật danh sách khách hàng từ đơn hàng nữa
        // Vì chúng ta đã tải tất cả khách hàng từ hàm loadAllClients
      }
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [page, limit, filters])

  // Tải dữ liệu khi component mount hoặc khi các tham số thay đổi
  // Tải dữ liệu khi component mount
  useEffect(() => {
    loadData()
    loadClientOptions() // Tải danh sách khách hàng
  }, [loadData, loadClientOptions])

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
    setPage(1) // Reset về trang đầu tiên khi thay đổi bộ lọc
  }

  // Xử lý thay đổi trang
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  async function handleDeleteOrder(orderId: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      return
    }

    try {
      setLoading(true)

      const { success, error: deleteError } = await deleteOrder(orderId)

      if (deleteError) throw new Error(deleteError)

      if (success) {
        // Tải lại dữ liệu sau khi xóa thành công
        loadData()
        alert('Xóa đơn hàng thành công')
      }
    } catch (err: any) {
      console.error('Error deleting order:', err)
      alert(`Lỗi khi xóa đơn hàng: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <Link
          href="/dashboard/orders/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Tạo đơn hàng mới
        </Link>
      </div>

      {/* UI cho bộ lọc và tìm kiếm */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Tìm kiếm theo mã đơn hàng hoặc mã tham chiếu..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="border rounded-md px-3 py-2 bg-white"
          >
            <option value="">Tất cả phòng ban</option>
            {departmentOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border rounded-md px-3 py-2 bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.client_id}
            onChange={(e) => handleFilterChange('client_id', e.target.value)}
            className="border rounded-md px-3 py-2 bg-white"
          >
            <option value="">Tất cả khách hàng</option>
            {clientOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
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
            data={orders}
            departmentOptions={departmentOptions}
            statusOptions={statusOptions}
            clientOptions={clientOptions}
            onDeleteOrder={handleDeleteOrder}
            pagination={{
              page,
              pageCount: Math.ceil(totalOrders / limit),
              onPageChange: handlePageChange
            }}
          />

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Hiển thị {orders.length} / {totalOrders} đơn hàng
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
