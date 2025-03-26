'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  createClient, 
  fetchClient, 
  updateClient 
} from '@/utils/supabase/client'

interface Client {
  id: string
  name: string
  address: string | null
  email: string | null
  phone: string | null
  tax_id: string | null
  created_at: string
  updated_at: string
  contacts: any[]
}

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    tax_id: ''
  })
  
  useEffect(() => {
    async function loadClient() {
      try {
        const { client, error } = await fetchClient(clientId)
        
        if (error) {
          throw new Error(error)
        }
        
        if (client) {
          setClient(client)
          setFormData({
            name: client.name || '',
            address: client.address || '',
            email: client.email || '',
            phone: client.phone || '',
            tax_id: client.tax_id || ''
          })
        } else {
          throw new Error('Client not found')
        }
      } catch (err: any) {
        console.error('Error loading client:', err)
        setError(err.message || 'Failed to load client')
      } finally {
        setLoading(false)
      }
    }
    
    if (clientId) {
      loadClient()
    }
  }, [clientId])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      setError('Company name is required')
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      
      const { client, error } = await updateClient(clientId, {
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        tax_id: formData.tax_id.trim() || undefined
      })
      
      if (error) {
        throw new Error(error)
      }
      
      // Redirect to client detail page
      router.push(`/dashboard/clients/${clientId}`)
    } catch (err: any) {
      console.error('Error saving client:', err)
      setError(err.message || 'Failed to save client')
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
          <p className="text-gray-500">Loading client information...</p>
        </div>
      </div>
    )
  }
  
  if (error && !client) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
        <div className="flex justify-center">
          <Link
            href={`/dashboard/clients/${clientId}`}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Back to Client
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Client</h1>
        <Link
          href={`/dashboard/clients/${clientId}`}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700 mb-1">
                Tax ID
              </label>
              <input
                type="text"
                id="tax_id"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors ${
                saving ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 