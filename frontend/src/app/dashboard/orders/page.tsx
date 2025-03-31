'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, fetchOrders, deleteOrder } from '@/utils/supabase/client'
import { DataTable } from './data-table'
import { columns, Order } from './columns'

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
        
        // Lấy dữ liệu đơn hàng
        const { orders: ordersData, error: ordersError } = await fetchOrders()
        
        if (ordersError) {
          setError(`Could not load orders: ${ordersError}`)
        } else {
          setOrders(ordersData)
          
          // Tạo danh sách khách hàng duy nhất cho bộ lọc
          const uniqueClients = new Map<string, string>();
          ordersData.forEach(order => {
            if (order.client_name && order.client_id) {
              uniqueClients.set(order.client_id, order.client_name);
            }
          });
          
          const clientOptionsArray = Array.from(uniqueClients).map(([id, name]) => ({
            value: name,
            label: name
          }));
          
          // Sắp xếp theo tên khách hàng
          clientOptionsArray.sort((a, b) => a.label.localeCompare(b.label));
          
          setClientOptions(clientOptionsArray);
        }
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  async function handleDeleteOrder(orderId: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      return
    }
    
    try {
      setLoading(true)
      
      const { success, error: deleteError } = await deleteOrder(orderId)
      
      if (deleteError) throw new Error(deleteError)
      
      if (success) {
        // Cập nhật danh sách đơn hàng
        setOrders(orders.filter(order => order.id !== orderId))
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
          />
        </div>
      )}
    </div>
  )
} 