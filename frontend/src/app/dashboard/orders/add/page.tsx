'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { createOrder, fetchClients, fetchNextOrderSequence } from '@/utils/supabase/client'

interface Client {
  id: string
  name: string
}

export default function AddOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [clientId, setClientId] = useState('')
  const [type, setType] = useState<'international' | 'local'>('international')
  const [department, setDepartment] = useState<'marine' | 'agri' | 'consumer_goods'>('marine')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]) // Today's date in YYYY-MM-DD format
  const [clientRefCode, setClientRefCode] = useState('')
  const [previewOrderNumber, setPreviewOrderNumber] = useState('')
  
  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          setError(authError.message)
          return
        }
        
        if (!user) {
          router.push('/login')
          return
        }
        
        // Fetch clients for dropdown
        const { clients: clientData, error: clientsError } = await fetchClients()
        
        if (clientsError) {
          setError(`Could not load clients: ${clientsError}`)
        } else if (clientData) {
          setClients(clientData)
          if (clientData.length > 0) {
            setClientId(clientData[0].id)
          }
        }
        
        // Generate preview order number
        updateOrderNumberPreview('international', 'marine')
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message || 'An error occurred')
      }
    }
    
    loadData()
  }, [router])
  
  // Update the preview order number when type or department changes
  async function updateOrderNumberPreview(
    selectedType: 'international' | 'local', 
    selectedDepartment: 'marine' | 'agri' | 'consumer_goods'
  ) {
    try {
      // Generate preview based on selected options
      const typePrefix = selectedType === 'international' ? 'I' : 'L'
      
      let departmentCode = 'MR'
      if (selectedDepartment === 'agri') departmentCode = 'AG'
      if (selectedDepartment === 'consumer_goods') departmentCode = 'CG'
      
      const currentYear = new Date().getFullYear().toString().substring(2) // Get last 2 digits of year
      
      // Get next sequence number
      const { nextSequence, error: sequenceError } = await fetchNextOrderSequence(
        typePrefix, 
        departmentCode, 
        currentYear
      )
      
      if (sequenceError) {
        throw new Error(`Error getting next sequence: ${sequenceError}`)
      }
      
      // Format sequence number with leading zeros
      const sequenceFormatted = String(nextSequence).padStart(3, '0')
      
      // Set preview order number
      setPreviewOrderNumber(`${typePrefix}${departmentCode}${currentYear}-${sequenceFormatted}`)
    } catch (err: any) {
      console.error('Error generating preview:', err)
      setError(err.message || 'Failed to generate order number preview')
    }
  }
  
  async function handleTypeChange(selectedType: 'international' | 'local') {
    setType(selectedType)
    await updateOrderNumberPreview(selectedType, department)
  }
  
  async function handleDepartmentChange(selectedDepartment: 'marine' | 'agri' | 'consumer_goods') {
    setDepartment(selectedDepartment)
    await updateOrderNumberPreview(type, selectedDepartment)
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!clientId) {
      setError('Please select a client')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const { order, error: createError } = await createOrder({
        client_id: clientId,
        type,
        department,
        order_number: previewOrderNumber,
        order_date: orderDate,
        client_ref_code: clientRefCode || null
      })
      
      if (createError) throw new Error(createError)
      
      if (order) {
        router.push('/dashboard/orders')
      }
    } catch (err: any) {
      console.error('Error creating order:', err)
      setError(err.message || 'An error occurred while creating the order')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Create New Order</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">Order Number Preview:</label>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 font-medium rounded-md">
                {previewOrderNumber}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              This number will be automatically generated based on your selections
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <select
                id="client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
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
            
            <div>
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
                    onChange={() => handleTypeChange('international')}
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
                    onChange={() => handleTypeChange('local')}
                  />
                  <span className="ml-2">Local (L)</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <div className="mt-1 space-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="department"
                    value="marine"
                    checked={department === 'marine'}
                    onChange={() => handleDepartmentChange('marine')}
                  />
                  <span className="ml-2">Marine (MR)</span>
                </label>
                <label className="inline-flex items-center block">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="department"
                    value="agri"
                    checked={department === 'agri'}
                    onChange={() => handleDepartmentChange('agri')}
                  />
                  <span className="ml-2">Agriculture (AG)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="department"
                    value="consumer_goods"
                    checked={department === 'consumer_goods'}
                    onChange={() => handleDepartmentChange('consumer_goods')}
                  />
                  <span className="ml-2">Consumer Goods (CG)</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/orders')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 