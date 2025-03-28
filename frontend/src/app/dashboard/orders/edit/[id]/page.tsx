'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { fetchOrder, updateOrder, fetchClients } from '@/utils/supabase/client'

interface Client {
  id: string
  name: string
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

export default function EditOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [clientId, setClientId] = useState('')
  const [contactId, setContactId] = useState<string | null>(null)
  const [clientContacts, setClientContacts] = useState<Contact[]>([])
  const [type, setType] = useState<'international' | 'local'>('international')
  const [status, setStatus] = useState<'draft' | 'confirmed' | 'completed' | 'cancelled'>('draft')
  const [orderDate, setOrderDate] = useState('')
  const [clientRefCode, setClientRefCode] = useState('')
  const [notes, setNotes] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  
  useEffect(() => {
    async function loadData() {
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
        
        // Fetch clients for dropdown
        const { clients: clientData, error: clientsError } = await fetchClients()
        
        if (clientsError) {
          console.error('Could not load clients:', clientsError)
        } else if (clientData) {
          setClients(clientData)
        }
        
        // Fetch order details
        const { order, error: orderError } = await fetchOrder(orderId)
        
        if (orderError) {
          setError(`Could not load order: ${orderError}`)
        } else if (order) {
          // Set form values
          setClientId(order.client_id)
          setContactId(order.contact_id || null)
          setClientContacts(order.client_contacts || [])
          setType(order.type)
          setStatus(order.status)
          setOrderDate(order.order_date ? order.order_date.split('T')[0] : '')
          setClientRefCode(order.client_ref_code || '')
          setNotes(order.notes || '')
          setOrderNumber(order.order_number)
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
    
    loadData()
  }, [orderId, router])
  
  async function handleClientChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newClientId = e.target.value;
    setClientId(newClientId);
    setContactId(null);
    
    if (newClientId) {
      try {
        const supabase = createClient();
        const { data: contacts, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('client_id', newClientId)
          .order('full_name', { ascending: true });
          
        if (error) throw error;
        
        setClientContacts(contacts || []);
      } catch (err: any) {
        console.error('Error fetching client contacts:', err);
      }
    } else {
      setClientContacts([]);
    }
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!clientId) {
      setError('Please select a client')
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      
      const { order, error: updateError } = await updateOrder(orderId, {
        client_id: clientId,
        contact_id: contactId,
        type,
        status,
        order_date: orderDate,
        client_ref_code: clientRefCode || null,
        notes: notes || null
      })
      
      if (updateError) throw new Error(updateError)
      
      if (order) {
        router.push(`/dashboard/orders/${orderId}`)
      }
    } catch (err: any) {
      console.error('Error updating order:', err)
      setError(err.message || 'An error occurred while updating the order')
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Order</h1>
        <Link
          href={`/dashboard/orders/${orderId}`}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
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
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
                <div className="px-3 py-2 bg-gray-100 text-gray-800 font-medium rounded-md">
                  {orderNumber}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Cannot be changed
                </p>
              </div>
              
              <div>
                <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Order Date
                </label>
                <input
                  type="date"
                  id="orderDate"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                  Client
                </label>
                <select
                  id="client"
                  value={clientId}
                  onChange={handleClientChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <select
                  id="contact"
                  value={contactId || ''}
                  onChange={(e) => setContactId(e.target.value || null)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Contact</option>
                  {clientContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name} {contact.position ? `(${contact.position})` : ''}
                    </option>
                  ))}
                </select>
                {clientContacts.length === 0 && clientId && (
                  <p className="mt-1 text-xs text-yellow-600">
                    No contacts found for this client.
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="clientRefCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Client Reference Code (Optional)
                </label>
                <input
                  type="text"
                  id="clientRefCode"
                  value={clientRefCode}
                  onChange={(e) => setClientRefCode(e.target.value)}
                  placeholder="Enter client reference code"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Type
              </label>
              <div className="mt-1 flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="type"
                    value="international"
                    checked={type === 'international'}
                    onChange={() => setType('international')}
                  />
                  <span className="ml-2">International (I)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="type"
                    value="local"
                    checked={type === 'local'}
                    onChange={() => setType('local')}
                  />
                  <span className="ml-2">Local (L)</span>
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Note: Department information is included in the Order Number
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter any additional notes about this order"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Link
                href={`/dashboard/orders/${orderId}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
} 