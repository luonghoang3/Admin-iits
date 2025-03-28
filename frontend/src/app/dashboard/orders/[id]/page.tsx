'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { fetchOrder, deleteOrder } from '@/utils/supabase/client'

interface Order {
  id: string
  order_number: string
  client_id: string
  contact_id?: string | null
  clients: {
    id: string
    name: string
    phone?: string
    email?: string
  }
  client_name?: string
  client_contacts?: Contact[]
  selected_contact?: Contact | null
  type: 'international' | 'local'
  department: 'marine' | 'agri' | 'consumer_goods'
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled'
  order_date: string
  client_ref_code: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface Contact {
  id: string
  client_id: string
  full_name: string
  position: string | null
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export default function ViewOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function loadOrderData() {
      if (!orderId) return
      
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
          router.push('/login')
          return
        }
        
        // Fetch order details
        const { order: orderData, error: orderError } = await fetchOrder(orderId)
        
        if (orderError) {
          setError(`Could not load order: ${orderError}`)
        } else if (orderData) {
          setOrder(orderData)
        } else {
          setError('Order not found')
        }
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    loadOrderData()
  }, [orderId, router])
  
  const handleDeleteOrder = async () => {
    if (!order) return
    
    if (!confirm('Are you sure you want to delete this order?')) {
      return
    }
    
    try {
      setLoading(true)
      
      const { success, error: deleteError } = await deleteOrder(order.id)
      
      if (deleteError) throw new Error(deleteError)
      
      if (success) {
        router.push('/dashboard/orders')
      }
    } catch (err: any) {
      console.error('Error deleting order:', err)
      setError(err.message || 'An error occurred while deleting the order')
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
  
  // Format status with appropriate styling
  const formatStatus = (status: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      'confirmed': { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
      'completed': { label: 'Completed', color: 'bg-green-100 text-green-800' },
      'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
    }
    
    const { label, color } = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
        {label}
      </span>
    )
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/orders"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Orders
          </Link>
          <Link
            href={`/dashboard/orders/edit/${orderId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Edit Order
          </Link>
          <button
            onClick={handleDeleteOrder}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
          >
            Delete Order
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
          <p className="text-gray-500">Loading order details...</p>
        </div>
      ) : order ? (
        <div className="bg-white overflow-hidden shadow-md rounded-lg divide-y divide-gray-200">
          <div className="px-6 py-5">
            <div className="flex justify-between">
              <h3 className="text-lg font-medium text-gray-900">Order Information</h3>
              <div>
                {formatStatus(order.status)}
              </div>
            </div>
          </div>
          
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Order Number</h4>
                <p className="mt-1 text-sm font-semibold text-gray-900">{order.order_number}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Order Date</h4>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {new Date(order.order_date).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Client Reference Code</h4>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {order.client_ref_code || '-'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Client Information</h4>
                <p className="mt-1 text-sm font-semibold text-gray-900">{order.client_name || 'N/A'}</p>
                {order.selected_contact ? (
                  <>
                    <p className="mt-1 text-sm text-gray-900">
                      {order.selected_contact.full_name || '-'}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {order.selected_contact.phone || '-'}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {order.selected_contact.email || '-'}
                    </p>
                  </>
                ) : order.client_contacts && order.client_contacts.length > 0 ? (
                  <>
                    <p className="mt-1 text-sm text-gray-900">
                      {order.client_contacts[0].full_name || '-'}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {order.client_contacts[0].phone || '-'}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {order.client_contacts[0].email || '-'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-gray-600">No contact available</p>
                    <p className="mt-1 text-sm text-gray-600">-</p>
                    <p className="mt-1 text-sm text-gray-600">-</p>
                  </>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Order Details</h4>
                <p className="mt-1 text-sm text-gray-900">
                  <span className="font-medium">Type:</span> {formatType(order.type)}
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  <span className="font-medium">Department:</span> {formatDepartment(order.department)}
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  <span className="font-medium">Status:</span> {order.status}
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Created At</h4>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(order.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
          
          {order.notes && (
            <div className="px-6 py-5">
              <h4 className="text-sm font-medium text-gray-500">Notes</h4>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{order.notes}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
          <p className="text-gray-500">Order not found.</p>
        </div>
      )}
    </div>
  )
} 