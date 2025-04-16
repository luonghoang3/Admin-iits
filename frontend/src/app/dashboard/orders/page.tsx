'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient, fetchOrders, deleteOrder } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import { DataTable } from './data-table'
import { columns, Order } from './columns'
import { TeamFilter } from './team-filter'
import { OrderSearch } from './order-search'
import { ClientSearch } from './client-search'
// Đã gỡ bỏ import Button vì đã được import trong TeamFilter

// Đã gỡ bỏ các options cho bộ lọc

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Đã gỡ bỏ state cho các options

  // Thêm state cho phân trang
  const [page, setPage] = useState(1)
  const [limit] = useState(10) // Không cần setLimit vì giá trị cố định
  const [totalOrders, setTotalOrders] = useState(0)

  // Thêm state cho bộ lọc team
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)

  // Thêm state cho tìm kiếm mã đơn hàng
  const [orderNumberSearch, setOrderNumberSearch] = useState('')

  // Thêm state cho tìm kiếm khách hàng
  const [clientSearch, setClientSearch] = useState('')

  // Đã gỡ bỏ hàm tải danh sách khách hàng

  // Đã gỡ bỏ hàm loadData và sử dụng useEffect để tải dữ liệu

  // Tải dữ liệu khi page thay đổi
  useEffect(() => {
    console.log('Loading data for page:', page)
    // Gọi hàm tải dữ liệu
    const fetchData = async () => {
      setLoading(true)

      try {
        // Kiểm tra xác thực
        const supabase = createClient()
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

        // Lấy dữ liệu đơn hàng với phân trang, bộ lọc team và tìm kiếm
        const { orders: ordersData, total, error: ordersError } = await fetchOrders({
          page,
          limit,
          teamId: selectedTeam,
          orderNumberSearch,
          clientSearch
        })

        if (ordersError) {
          setError(`Could not load orders: ${ordersError}`)
        } else {
          // Nếu đang tìm kiếm khách hàng
          if (clientSearch) {
            // Lọc các đơn hàng có client_name chứa từ khóa tìm kiếm
            const filteredOrders = ordersData.filter(order =>
              order.client_name && order.client_name.toLowerCase().includes(clientSearch.toLowerCase())
            );

            // Tổng số đơn hàng phù hợp
            const totalFilteredOrders = filteredOrders.length;

            // Phân trang thủ công đối với kết quả tìm kiếm
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

            setOrders(paginatedOrders.map(order => ({
  ...order,
  clients: order.clients ? {
    id: String(order.clients.id),
    name: String(order.clients.name)
  } : undefined,
  teams: (() => {
  if (!order.teams) return undefined;
  if (Array.isArray(order.teams)) {
    const t = order.teams[0];
    if (
      t &&
      typeof t === 'object' &&
      t !== null &&
      (t as any).id !== undefined &&
      (t as any).name !== undefined
    ) {
      return {
        id: String((t as any).id),
        name: String((t as any).name)
      };
    }
    return undefined;
  }
  if (
    typeof order.teams === 'object' &&
    order.teams !== null &&
    typeof (order.teams as any).id !== 'undefined' &&
    typeof (order.teams as any).name !== 'undefined'
  ) {
    return {
      id: String((order.teams as any).id),
      name: String((order.teams as any).name)
    };
  }
  return undefined;
})()
})));
            setTotalOrders(totalFilteredOrders);

            // Nếu trang hiện tại không có dữ liệu và không phải trang đầu tiên, quay lại trang trước
            if (paginatedOrders.length === 0 && page > 1) {
              setPage(1); // Quay lại trang đầu tiên khi kết quả tìm kiếm không đủ để hiển thị ở trang hiện tại
            }
          } else {
            // Không tìm kiếm, sử dụng phân trang bình thường
            setOrders(ordersData.map(order => ({
  ...order,
  clients: order.clients ? {
    id: String(order.clients.id),
    name: String(order.clients.name)
  } : undefined,
  teams: (() => {
  if (!order.teams) return undefined;
  if (Array.isArray(order.teams)) {
    const t = order.teams[0];
    if (
      t &&
      typeof t === 'object' &&
      t !== null &&
      (t as any).id !== undefined &&
      (t as any).name !== undefined
    ) {
      return {
        id: String((t as any).id),
        name: String((t as any).name)
      };
    }
    return undefined;
  }
  if (
    typeof order.teams === 'object' &&
    order.teams !== null &&
    typeof (order.teams as any).id !== 'undefined' &&
    typeof (order.teams as any).name !== 'undefined'
  ) {
    return {
      id: String((order.teams as any).id),
      name: String((order.teams as any).name)
    };
  }
  return undefined;
})()
})))
setTotalOrders(total)
          }
        }
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, limit, selectedTeam, orderNumberSearch, clientSearch]) // Chạy khi page, limit, selectedTeam, orderNumberSearch hoặc clientSearch thay đổi

  // Đã gỡ bỏ xử lý thay đổi bộ lọc

  // Xử lý thay đổi trang
  const handlePageChange = (newPage: number) => {
    console.log('Changing page to:', newPage)
    setPage(newPage)
    // Không cần gọi loadData() ở đây vì useEffect sẽ tự động gọi khi page thay đổi
  }

  // Xử lý tìm kiếm mã đơn hàng
  const handleOrderSearch = (query: string) => {
    setOrderNumberSearch(query)
    // Reset về trang 1 khi tìm kiếm
    setPage(1)
  }

  // Xử lý tìm kiếm khách hàng
  const handleClientSearch = (query: string) => {
    setClientSearch(query)
    // Reset về trang 1 khi tìm kiếm
    setPage(1)
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
        // Cách 1: Set lại page hiện tại để trigger useEffect
        // setPage(page)

        // Cách 2: Set page về 1 nếu đang ở trang cuối và chỉ còn 1 item
        if (page > 1 && orders.length === 1) {
          setPage(page - 1) // Quay lại trang trước nếu xóa item cuối cùng của trang
        } else {
          // Force re-render bằng cách set một giá trị mới
          setPage(current => current) // Trigger useEffect để tải lại dữ liệu
        }
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

      {/* Tìm kiếm và bộ lọc */}
      <div className="mb-6 bg-white p-3 rounded-md shadow-sm border">
  <div className="flex flex-col sm:flex-row items-center gap-3">
    {/* 2 trường search nằm cùng 1 dòng, chia đôi chiều rộng */}
    <div className="w-full sm:w-3/5 lg:w-2/3 flex flex-row gap-3">
      <div className="flex-1">
        <OrderSearch onSearch={handleOrderSearch} />
      </div>
      <div className="flex-1">
        <ClientSearch onSearch={handleClientSearch} />
      </div>
    </div>
    <div className="w-full sm:w-2/5 lg:w-1/3 mt-2 sm:mt-0 flex justify-center sm:justify-end">
      <TeamFilter
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
      />
    </div>
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
