'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { fetchOrders, deleteOrder } from '@/services/orderService'
import { redirect } from 'next/navigation'
import { DataTable } from './data-table'
import { columns, Order } from './columns'
import { TeamFilter } from './team-filter'
import { OrderSearch } from './order-search'
import { ClientSearch } from './client-search'
// Đã gỡ bỏ import normalizeIdNameField vì không còn sử dụng
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

  // State cho tìm kiếm khách hàng
  const [allOrders, setAllOrders] = useState<Order[]>([]) // Lưu trữ tất cả đơn hàng khi tìm kiếm
  const [allOrdersUnfiltered, setAllOrdersUnfiltered] = useState<Order[]>([]) // Lưu trữ tất cả đơn hàng không lọc theo team
  const [isSearchingClient, setIsSearchingClient] = useState(false) // Đánh dấu đang tìm kiếm khách hàng

  // Đã gỡ bỏ hàm tải danh sách khách hàng

  // Đã gỡ bỏ hàm loadData và sử dụng useEffect để tải dữ liệu

  // Xử lý dữ liệu khi tìm kiếm khách hàng hoặc thay đổi team
  useEffect(() => {
    if (isSearchingClient && clientSearch && allOrders.length > 0) {
      // Lọc các đơn hàng có client_name chứa từ khóa tìm kiếm
      const filteredOrders = allOrders.filter(order =>
        order.client_name && order.client_name.toLowerCase().includes(clientSearch.toLowerCase())
      );

      // Tổng số đơn hàng phù hợp
      const totalFilteredOrders = filteredOrders.length;

      // Phân trang thủ công đối với kết quả tìm kiếm
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

      setOrders(paginatedOrders);
      setTotalOrders(totalFilteredOrders);

      // Nếu trang hiện tại không có dữ liệu và không phải trang đầu tiên, quay lại trang trước
      if (paginatedOrders.length === 0 && page > 1) {
        setPage(1); // Quay lại trang đầu tiên khi kết quả tìm kiếm không đủ để hiển thị ở trang hiện tại
      }

      // Đã gỡ bỏ debug log
    }
  }, [isSearchingClient, clientSearch, allOrders, page, limit, selectedTeam]);

  // Tải dữ liệu khi page thay đổi hoặc không tìm kiếm khách hàng
  useEffect(() => {
    // Nếu đang tìm kiếm khách hàng, không tải dữ liệu theo trang
    if (isSearchingClient) return;

    // Đã gỡ bỏ debug log
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
          // 'return' sau redirect là không cần thiết vì redirect sẽ chuyển hướng người dùng
        }

        // Lấy dữ liệu đơn hàng với phân trang, bộ lọc team và tìm kiếm
        const { orders: ordersData, total, error: ordersError } = await fetchOrders({
          page,
          limit,
          teamId: selectedTeam,
          orderNumberSearch
        })

        // Đã gỡ bỏ debug log

        if (ordersError) {
          setError(`Could not load orders: ${ordersError}`)
        } else {
          // Sử dụng dữ liệu trực tiếp từ API
          // Sử dụng type assertion để tránh lỗi TypeScript
          setOrders(ordersData as Order[]);
          setTotalOrders(total);

          // Nếu trang hiện tại không có dữ liệu và không phải trang đầu tiên, quay lại trang trước
          if (ordersData.length === 0 && page > 1) {
            setPage(1); // Quay lại trang đầu tiên khi kết quả tìm kiếm không đủ để hiển thị ở trang hiện tại
          }
        }
      } catch (err: any) {
        // Đã gỡ bỏ debug log
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, limit, selectedTeam, orderNumberSearch, isSearchingClient]) // Chạy khi page, limit, selectedTeam, orderNumberSearch hoặc isSearchingClient thay đổi

  // Xử lý thay đổi team
  const handleTeamChange = (teamId: string | null) => {
    setSelectedTeam(teamId)
    setPage(1) // Reset về trang 1 khi thay đổi team

    // Nếu đang tìm kiếm khách hàng, lọc lại kết quả theo team mới
    if (isSearchingClient && clientSearch) {
      if (teamId) {
        // Lọc theo team được chọn
        const filteredByTeam = allOrdersUnfiltered.filter(order => order.team_id === teamId)
        setAllOrders(filteredByTeam)
      } else {
        // Không lọc theo team
        setAllOrders(allOrdersUnfiltered)
      }
    }
  }

  // Xử lý thay đổi trang
  const handlePageChange = (newPage: number) => {
    // Đã gỡ bỏ debug log
    setPage(newPage)
    // Không cần gọi loadData() ở đây vì useEffect sẽ tự động gọi khi page thay đổi
  }

  // Xử lý tìm kiếm mã đơn hàng
  const prevOrderNumberSearchRef = useRef('')
  const handleOrderSearch = (query: string) => {
    setOrderNumberSearch(query)
    // Chỉ reset page về 1 khi query thực sự thay đổi
    if (prevOrderNumberSearchRef.current !== query) {
      setPage(1)
      prevOrderNumberSearchRef.current = query
    }
  }

  // Xử lý tìm kiếm khách hàng
  const prevClientSearchRef = useRef('')

  const handleClientSearch = async (query: string) => {
    // Chỉ reset page về 1 khi query thực sự thay đổi
    if (prevClientSearchRef.current !== query) {
      setPage(1)
      prevClientSearchRef.current = query

      if (query) {
        // Nếu đang tìm kiếm, tải tất cả dữ liệu
        setIsSearchingClient(true)
        setLoading(true)

        try {
          // Tải tất cả dữ liệu (không phân trang)
          // Không cần sử dụng totalAll
          const { orders: allOrdersData, error: allOrdersError } = await fetchOrders({
            teamId: selectedTeam, // Vẫn lọc theo team hiện tại
            orderNumberSearch,
            skipPagination: true
          })

          // Tải tất cả dữ liệu không lọc theo team để có thể lọc lại sau này
          const { orders: allOrdersUnfilteredData } = await fetchOrders({
            orderNumberSearch,
            skipPagination: true
          })

          if (allOrdersError) {
            setError(`Could not load all orders: ${allOrdersError}`)
          } else {
            // Sử dụng type assertion để tránh lỗi TypeScript
            setAllOrders(allOrdersData as Order[])
            // Lưu trữ dữ liệu không lọc theo team
            setAllOrdersUnfiltered(allOrdersUnfilteredData as Order[])
          }
        } catch (err: any) {
          // Đã gỡ bỏ debug log
          setError(err.message || 'An error occurred while loading all orders')
        } finally {
          setLoading(false)
        }
      } else {
        // Nếu không tìm kiếm nữa, quay lại chế độ bình thường
        setIsSearchingClient(false)
      }
    }

    setClientSearch(query)
  }

  async function handleDeleteOrder(orderId: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      return
    }

    try {
      setLoading(true)

      // Sử dụng hàm deleteOrder từ orderService.ts
      await deleteOrder(orderId)

      // Cập nhật danh sách đơn hàng trực tiếp trên client
      if (isSearchingClient) {
        // Nếu đang tìm kiếm, cập nhật cả hai danh sách
        setAllOrders(prevOrders => prevOrders.filter(order => order.id !== orderId))
        setAllOrdersUnfiltered(prevOrders => prevOrders.filter(order => order.id !== orderId))

        // Cập nhật danh sách hiển thị
        setOrders(prevOrders => {
          const updatedOrders = prevOrders.filter(order => order.id !== orderId)
          setTotalOrders(prev => prev - 1) // Giảm tổng số đơn hàng
          return updatedOrders
        })
      } else {
        // Nếu không đang tìm kiếm, tải lại dữ liệu từ server
        // Kiểm tra nếu đang ở trang cuối và chỉ còn 1 item
        if (page > 1 && orders.length === 1) {
          setPage(page - 1) // Quay lại trang trước nếu xóa item cuối cùng của trang
        } else {
          // Cập nhật danh sách hiển thị trước, sau đó tải lại dữ liệu
          setOrders(prevOrders => {
            const updatedOrders = prevOrders.filter(order => order.id !== orderId)
            setTotalOrders(prev => prev - 1) // Giảm tổng số đơn hàng
            return updatedOrders
          })

          // Tạo một giá trị ngẫu nhiên để bắt buộc useEffect tải lại dữ liệu
          setTimeout(() => {
            // Sử dụng setTimeout để đảm bảo cập nhật UI trước khi tải lại dữ liệu
            setPage(current => current) // Trigger useEffect để tải lại dữ liệu
          }, 100)
        }
      }

      alert('Xóa đơn hàng thành công')
    } catch (err: any) {
      // Đã gỡ bỏ debug log
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
        setSelectedTeam={handleTeamChange}
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
