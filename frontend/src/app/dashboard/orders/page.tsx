'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { fetchOrders, deleteOrder } from '@/utils/supabase/client'

interface Order {
  id: string
  order_number: string
  client_id: string
  client_name?: string
  type: 'international' | 'local'
  department: 'marine' | 'agri' | 'consumer_goods'
  order_date: string
  client_ref_code: string | null
  created_at: string
  updated_at: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          setError(authError.message)
          setLoading(false)
          return
        }
        
        if (!user) {
          // Redirect to login if not authenticated
          window.location.href = '/login'
          return
        }
        
        // Fetch orders data
        const { orders: orderData, error: ordersError } = await fetchOrders()
        
        if (ordersError) {
          setError(`Could not load orders: ${ordersError}`)
        } else {
          setOrders(orderData || [])
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
    if (!confirm('Are you sure you want to delete this order?')) {
      return
    }
    
    try {
      setLoading(true)
      
      const { success, error: deleteError } = await deleteOrder(orderId)
      
      if (deleteError) throw new Error(deleteError)
      
      if (success) {
        // Update the orders list
        setOrders(orders.filter(order => order.id !== orderId))
        alert('Order deleted successfully')
      }
    } catch (err: any) {
      console.error('Error deleting order:', err)
      alert(`Error deleting order: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  // Format the department display
  const formatDepartment = (dept: string) => {
    const deptMap: Record<string, string> = {
      'marine': 'Marine (MR)',
      'agri': 'Agriculture (AG)',
      'consumer_goods': 'Consumer Goods (CG)'
    }
    
    return deptMap[dept] || dept
  }
  
  // Format the type display
  const formatType = (type: string) => {
    return type === 'international' ? 'International (I)' : 'Local (L)'
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <Link
          href="/dashboard/orders/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Order
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
          <p className="text-gray-500">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white overflow-hidden shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ref Code
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.client_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(order.order_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.client_ref_code || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatType(order.type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDepartment(order.department)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/orders/edit/${order.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 