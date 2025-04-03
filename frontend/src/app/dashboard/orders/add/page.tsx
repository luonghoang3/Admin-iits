'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  createOrder,
  fetchClients,
  fetchClient,
  createOrderItem,
  fetchCommodities,
  fetchUnits,
  fetchNextOrderSequence,
  createClientRecord,
  updateClient,
  deleteClient,
  createContact,
  updateContact,
  deleteContact
} from '@/utils/supabase/client'
import { 
  fetchShippers, 
  fetchBuyers, 
  fetchShipper,
  createShipper,
  updateShipper,
  deleteShipper,
  fetchBuyer,
  createBuyer,
  updateBuyer,
  deleteBuyer
} from '@/utils/supabase/shipping'
import { Combobox, Transition, Menu } from '@headlessui/react'

// ShadCN components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Add some icons
import { 
  ArrowLeftIcon, 
  ArchiveBoxIcon as PackageIcon,
  ArrowDownTrayIcon as SaveIcon,
  UsersIcon,
  BuildingOffice2Icon as Building2Icon,
  CalendarIcon,
  DocumentTextIcon as FileSpreadsheetIcon,
  TruckIcon as ShipIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  EllipsisVerticalIcon
} from "@heroicons/react/24/outline"
import { ChevronUpDownIcon } from "@heroicons/react/20/solid"

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

interface Client {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
}

interface OrderItem {
  id?: string
  commodity_id: string
  quantity: number
  unit_id: string
  commodity_description: string
  commodities?: {
    id: string
    name: string
    description: string | null
  }
  units?: {
    id: string
    name: string
  }
}

interface Commodity {
  id: string
  name: string
  description: string | null
}

interface Unit {
  id: string
  name: string
  description: string | null
}

export default function AddOrderPage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  
  // Order Items States
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [currentItem, setCurrentItem] = useState<OrderItem>({
    commodity_id: '',
    quantity: 1,
    unit_id: '',
    commodity_description: ''
  })
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [isEditingItem, setIsEditingItem] = useState(false)
  const [itemError, setItemError] = useState<string | null>(null)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    client_id: '',
    contact_id: '',
    type: 'international' as 'international' | 'local',
    department: 'marine' as 'marine' | 'agri' | 'consumer_goods',
    status: 'draft' as 'draft' | 'confirmed' | 'completed' | 'cancelled',
    order_date: new Date().toISOString().split('T')[0],
    client_ref_code: '',
    notes: '',
    shipper_id: '',
    buyer_id: '',
    vessel_carrier: '',
    bill_of_lading: '',
    bill_of_lading_date: '',
    order_number: ''
  })
  
  // Add state for unit search
  const [unitOpen, setUnitOpen] = useState(false)
  const [unitSearch, setUnitSearch] = useState("")
  
  // Add state for commodity search
  const [commodityQuery, setCommodityQuery] = useState("")
  const [commodityPage, setCommodityPage] = useState(1)
  const [hasMoreCommodities, setHasMoreCommodities] = useState(true)
  const [isLoadingMoreCommodities, setIsLoadingMoreCommodities] = useState(false)
  const [filteredCommodities, setFilteredCommodities] = useState<Commodity[]>([])
  
  // Add state for client search and pagination
  const [clientQuery, setClientQuery] = useState("")
  const [clientPage, setClientPage] = useState(1)
  const [hasMoreClients, setHasMoreClients] = useState(true)
  const [isLoadingMoreClients, setIsLoadingMoreClients] = useState(false)
  
  // Add state for shipper search and pagination
  const [shipperQuery, setShipperQuery] = useState("")
  const [shipperPage, setShipperPage] = useState(1)
  const [hasMoreShippers, setHasMoreShippers] = useState(true)
  const [isLoadingMoreShippers, setIsLoadingMoreShippers] = useState(false)
  const [filteredShippers, setFilteredShippers] = useState<any[]>([])
  
  // Add state for buyer search and pagination
  const [buyerQuery, setBuyerQuery] = useState("")
  const [buyerPage, setBuyerPage] = useState(1)
  const [hasMoreBuyers, setHasMoreBuyers] = useState(true)
  const [isLoadingMoreBuyers, setIsLoadingMoreBuyers] = useState(false)
  const [filteredBuyers, setFilteredBuyers] = useState<any[]>([])
  
  // Preview order number
  const [previewOrderNumber, setPreviewOrderNumber] = useState("")
  
  // Client dialog states
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [clientDialogMode, setClientDialogMode] = useState<'add' | 'edit'>('add')
  const [clientForm, setClientForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [clientError, setClientError] = useState<string | null>(null)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  
  // Contact dialog states
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [contactDialogMode, setContactDialogMode] = useState<'add' | 'edit'>('add')
  const [contactForm, setContactForm] = useState({
    id: '',
    full_name: '',
    position: '',
    phone: '',
    email: ''
  })
  const [contactError, setContactError] = useState<string | null>(null)
  const [isConfirmDeleteContactOpen, setIsConfirmDeleteContactOpen] = useState(false)
  
  // Shipper dialog states
  const [shipperDialogOpen, setShipperDialogOpen] = useState(false)
  const [shipperDialogMode, setShipperDialogMode] = useState<'add' | 'edit'>('add')
  const [shipperForm, setShipperForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [shipperError, setShipperError] = useState<string | null>(null)
  const [isConfirmDeleteShipperOpen, setIsConfirmDeleteShipperOpen] = useState(false)
  
  // Buyer dialog states
  const [buyerDialogOpen, setBuyerDialogOpen] = useState(false)
  const [buyerDialogMode, setBuyerDialogMode] = useState<'add' | 'edit'>('add')
  const [buyerForm, setBuyerForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [buyerError, setBuyerError] = useState<string | null>(null)
  const [isConfirmDeleteBuyerOpen, setIsConfirmDeleteBuyerOpen] = useState(false)
  
  // Add states for shippers and buyers
  const [shippers, setShippers] = useState<any[]>([])
  const [buyers, setBuyers] = useState<any[]>([])
  
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // Load initial clients (first 15 only)
        const { clients: clientsData, error: clientsError } = await fetchClients(1, 15)
        
        if (clientsError) {
          console.error('Error loading clients:', clientsError)
          setError('Failed to load clients')
        } else if (clientsData) {
          setClients(clientsData)
          setHasMoreClients(clientsData.length === 15)
        }
        
        // Load commodities and units for selection in items form
        const { commodities: commoditiesData } = await fetchCommodities(1, 15)
        const { units: unitsData } = await fetchUnits()
        
        if (commoditiesData) {
          setCommodities(commoditiesData)
          setFilteredCommodities(commoditiesData)
          setHasMoreCommodities(commoditiesData.length === 15)
        }
        if (unitsData) setUnits(unitsData)
        
        // Load initial shippers (first 15 only)
        const { shippers: shippersData } = await fetchShippers(1, 15)
        if (shippersData) {
          setShippers(shippersData)
          setFilteredShippers(shippersData)
          setHasMoreShippers(shippersData.length === 15)
        }
        
        // Load initial buyers (first 15 only)
        const { buyers: buyersData } = await fetchBuyers(1, 15)
        if (buyersData) {
          setBuyers(buyersData)
          setFilteredBuyers(buyersData)
          setHasMoreBuyers(buyersData.length === 15)
        }
        
        // Generate preview order number
        await updateOrderNumberPreview('international', 'marine')
      } catch (err: any) {
        console.error('Error loading data:', err)
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  // Function to load more clients when scrolling
  const loadMoreClients = async () => {
    if (!hasMoreClients || isLoadingMoreClients) return
    
    try {
      setIsLoadingMoreClients(true)
      const nextPage = clientPage + 1
      
      // Load next page of clients
      const { clients: moreClients, error } = await fetchClients(nextPage, 15, clientQuery)
      
      if (error) {
        console.error('Error loading more clients:', error)
        return
      }
      
      if (moreClients && moreClients.length > 0) {
        setClients(prev => [...prev, ...moreClients])
        setClientPage(nextPage)
        setHasMoreClients(moreClients.length === 15)
      } else {
        setHasMoreClients(false)
      }
    } catch (err) {
      console.error('Error loading more clients:', err)
    } finally {
      setIsLoadingMoreClients(false)
    }
  }
  
  // Function to handle client search
  const handleClientSearch = async (query: string) => {
    setClientQuery(query)
    
    try {
      setLoading(true)
      
      // Reset pagination
      setClientPage(1)
      
      // Search clients with the query
      const { clients: searchResults, error } = await fetchClients(1, 15, query)
      
      if (error) {
        console.error('Error searching clients:', error)
        return
      }
      
      setClients(searchResults || [])
      setHasMoreClients(searchResults?.length === 15)
    } catch (err) {
      console.error('Error searching clients:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Update the preview order number when type or department changes
  const updateOrderNumberPreview = async (
    selectedType: 'international' | 'local', 
    selectedDepartment: 'marine' | 'agri' | 'consumer_goods'
  ) => {
    try {
      // Generate preview based on selected options
      const typePrefix = selectedType === 'international' ? 'I' : 'L'
      
      let departmentCode = 'MR'
      if (selectedDepartment === 'agri') departmentCode = 'AF'
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
      
      // Format with leading zeros to ensure 3 digits
      const sequenceFormatted = nextSequence.toString().padStart(3, '0')
      
      // Combine all parts to create the order number
      const orderNumber = `${typePrefix}${departmentCode}${currentYear}-${sequenceFormatted}`
      
      setPreviewOrderNumber(orderNumber)
      setFormData(prev => ({ ...prev, order_number: orderNumber }))
    } catch (error: any) {
      console.error('Error updating order number preview:', error)
      setError(error.message || 'Failed to generate order number')
    }
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleValueChange = (name: string, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: value || ''
    }))
    
    // Update order number preview when type or department changes
    if (name === 'type' && value) {
      updateOrderNumberPreview(value as 'international' | 'local', formData.department)
    } else if (name === 'department' && value) {
      updateOrderNumberPreview(formData.type, value as 'marine' | 'agri' | 'consumer_goods')
    }
  }
  
  const handleClientChange = async (clientId: string | null) => {
    try {
      // Chuyển đổi null thành string rỗng nếu cần
      const id = clientId || '';
      
      setFormData(prev => ({ ...prev, client_id: id, contact_id: '' }))
      
      // Load client contacts
      if (id) {
        const { client, error } = await fetchClient(id)
        
        if (error) {
          console.error('Error loading client details:', error)
        } else if (client && client.contacts) {
          setContacts(client.contacts)
          
          // Automatically select the newest contact if available
          if (client.contacts.length > 0) {
            // Sort contacts by created_at in descending order to get the newest one
            const sortedContacts = [...client.contacts].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            const newestContact = sortedContacts[0];
            setFormData(prev => ({ ...prev, contact_id: newestContact.id }));
          }
        }
      } else {
        // Clear contacts if no client selected
        setContacts([])
      }
    } catch (err: any) {
      console.error('Error setting client:', err)
    }
  }
  
  const openAddItemForm = () => {
    setCurrentItem({
      commodity_id: '',
      quantity: 1,
      unit_id: '',
      commodity_description: ''
    })
    setIsEditingItem(false)
    setItemError(null)
    setItemFormOpen(true)
  }
  
  const openEditItemForm = (index: number) => {
    const item = orderItems[index]
    setCurrentItem({
      ...item
    })
    setEditingItemIndex(index)
    setIsEditingItem(true)
    setItemError(null)
    setItemFormOpen(true)
  }
  
  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentItem(prev => ({ ...prev, [name]: name === 'quantity' ? Number(value) : value }))
  }
  
  const handleItemSelectChange = (name: string, value: string | null) => {
    setCurrentItem(prev => ({ ...prev, [name]: value || '' }))
  }
  
  const handleSaveItem = () => {
    setItemError(null)
    
    // Validate required fields
    if (!currentItem.commodity_id) {
      setItemError('Please select a commodity')
      return
    }
    
    if (!currentItem.unit_id) {
      setItemError('Please select a unit')
      return
    }
    
    if (currentItem.quantity <= 0) {
      setItemError('Quantity must be greater than 0')
      return
    }
    
    // Find the commodity and unit details
    const selectedCommodity = commodities.find(c => c.id === currentItem.commodity_id)
    const selectedUnit = units.find(u => u.id === currentItem.unit_id)
    
    const itemWithDetails: OrderItem = {
      ...currentItem,
      commodities: selectedCommodity ? {
        id: selectedCommodity.id,
        name: selectedCommodity.name,
        description: selectedCommodity.description
      } : undefined,
      units: selectedUnit ? {
        id: selectedUnit.id,
        name: selectedUnit.name
      } : undefined
    }
    
    if (isEditingItem && editingItemIndex !== null) {
      // Update existing item
      const updatedItems = [...orderItems]
      updatedItems[editingItemIndex] = itemWithDetails
      setOrderItems(updatedItems)
    } else {
      // Add new item
      setOrderItems(prev => [...prev, itemWithDetails])
    }
    
    // Reset and close form
    setItemFormOpen(false)
    setCurrentItem({
      commodity_id: '',
      quantity: 1,
      unit_id: '',
      commodity_description: ''
    })
    setEditingItemIndex(null)
    setIsEditingItem(false)
  }
  
  const handleDeleteItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError(null)
      
      // Validate required fields
      if (!formData.client_id) {
        throw new Error('Please select a client')
      }
      
      if (!formData.type) {
        throw new Error('Please select an order type')
      }
      
      if (!formData.department) {
        throw new Error('Please select a department')
      }
      
      if (!formData.order_date) {
        throw new Error('Please select an order date')
      }
      
      // Create the order
      const { order, error: orderError } = await createOrder({
        client_id: formData.client_id,
        contact_id: formData.contact_id || null,
        type: formData.type,
        department: formData.department,
        order_date: formData.order_date,
        client_ref_code: formData.client_ref_code || null,
        vessel_carrier: formData.vessel_carrier || null,
        bill_of_lading: formData.bill_of_lading || null,
        bill_of_lading_date: formData.bill_of_lading_date || null,
        order_number: formData.order_number || null,
        shipper_id: formData.shipper_id || null,
        buyer_id: formData.buyer_id || null
      })
      
      if (orderError) {
        throw new Error(`Failed to create order: ${orderError}`)
      }
      
      if (!order) {
        throw new Error('Order creation failed')
      }
      
      // Add order items
      if (orderItems.length > 0) {
        for (const item of orderItems) {
          const { error: itemError } = await createOrderItem({
            order_id: order.id,
            commodity_id: item.commodity_id,
            quantity: item.quantity,
            unit_id: item.unit_id,
            commodity_description: item.commodity_description || undefined
          })
          
          if (itemError) {
            console.error(`Error creating order item: ${itemError}`)
            // Continue with other items even if one fails
          }
        }
      }
      
      // Redirect to the orders page with success message
      router.push('/dashboard/orders')
      
    } catch (err: any) {
      console.error('Error saving order:', err)
      setError(err.message || 'Failed to save order')
    } finally {
      setSaving(false)
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Draft</Badge>
      case 'confirmed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Confirmed</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  // Function to handle commodity search
  const handleCommoditySearch = async (query: string) => {
    setCommodityQuery(query)
    
    // Filter locally first for quick response
    const localFiltered = commodities.filter(commodity => 
      commodity.name.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredCommodities(localFiltered)
    
    try {
      // Reset pagination
      setCommodityPage(1)
      
      // Search commodities with the query
      const { commodities: searchResults } = await fetchCommodities(1, 15, query)
      
      if (searchResults) {
        setCommodities(searchResults)
        setFilteredCommodities(searchResults)
        setHasMoreCommodities(searchResults.length === 15)
      }
    } catch (err) {
      console.error('Error searching commodities:', err)
    }
  }

  // Function to load more commodities
  const loadMoreCommodities = async () => {
    if (!hasMoreCommodities || isLoadingMoreCommodities) return
    
    try {
      setIsLoadingMoreCommodities(true)
      const nextPage = commodityPage + 1
      
      // Load next page of commodities
      const { commodities: moreCommodities } = await fetchCommodities(nextPage, 15, commodityQuery)
      
      if (moreCommodities && moreCommodities.length > 0) {
        setCommodities(prev => [...prev, ...moreCommodities])
        setFilteredCommodities(prev => [...prev, ...moreCommodities])
        setCommodityPage(nextPage)
        setHasMoreCommodities(moreCommodities.length === 15)
      } else {
        setHasMoreCommodities(false)
      }
    } catch (err) {
      console.error('Error loading more commodities:', err)
    } finally {
      setIsLoadingMoreCommodities(false)
    }
  }
  
  // Client form handlers
  const openAddClientDialog = () => {
    setClientForm({
      id: '',
      name: '',
      email: '',
      phone: '',
      address: ''
    })
    setClientDialogMode('add')
    setClientError(null)
    setClientDialogOpen(true)
  }
  
  const openEditClientDialog = async () => {
    if (!formData.client_id) {
      setError('Please select a client to edit')
      return
    }
    
    try {
      const { client, error } = await fetchClient(formData.client_id)
      
      if (error) {
        throw new Error(`Error loading client: ${error}`)
      }
      
      if (client) {
        setClientForm({
          id: client.id,
          name: client.name || '',
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || ''
        })
        setClientDialogMode('edit')
        setClientError(null)
        setClientDialogOpen(true)
      }
    } catch (err: any) {
      console.error('Error loading client details:', err)
      setError(err.message || 'Failed to load client details')
    }
  }
  
  const openDeleteClientConfirm = () => {
    if (!formData.client_id) {
      setError('Please select a client to delete')
      return
    }
    
    setIsConfirmDeleteOpen(true)
  }
  
  const handleClientFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setClientForm(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSaveClient = async () => {
    try {
      setClientError(null)
      
      // Validate client form
      if (!clientForm.name) {
        setClientError('Client name is required')
        return
      }
      
      if (clientDialogMode === 'add') {
        // Create new client
        const { client, error } = await createClientRecord({
          name: clientForm.name,
          email: clientForm.email || undefined,
          phone: clientForm.phone || undefined,
          address: clientForm.address || undefined
        })
        
        if (error) {
          throw new Error(`Failed to create client: ${error}`)
        }
        
        if (client) {
          // Refresh clients list
          const { clients: clientsData } = await fetchClients()
          if (clientsData) {
            setClients(clientsData)
          }
          
          // Select the new client
          handleClientChange(client.id)
        }
      } else {
        // Update existing client
        const { client, error } = await updateClient(clientForm.id, {
          name: clientForm.name,
          email: clientForm.email || undefined,
          phone: clientForm.phone || undefined,
          address: clientForm.address || undefined
        })
        
        if (error) {
          throw new Error(`Failed to update client: ${error}`)
        }
        
        // Refresh clients list
        const { clients: clientsData } = await fetchClients()
        if (clientsData) {
          setClients(clientsData)
        }
      }
      
      // Close the dialog
      setClientDialogOpen(false)
    } catch (err: any) {
      console.error('Error saving client:', err)
      setClientError(err.message || 'Failed to save client')
    }
  }
  
  const handleDeleteClient = async () => {
    try {
      if (!formData.client_id) return
      
      const { success, error } = await deleteClient(formData.client_id)
      
      if (error) {
        setError(`Failed to delete client: ${error}`)
        return
      }
      
      if (success) {
        // Remove client from list and clear selection
        setClients(prev => prev.filter(c => c.id !== formData.client_id))
        setFormData(prev => ({ ...prev, client_id: '', contact_id: '' }))
        setContacts([])
      }
      
      setIsConfirmDeleteOpen(false)
      
    } catch (err: any) {
      console.error('Error deleting client:', err)
      setError(err.message || 'Failed to delete client')
    }
  }
  
  // Contact management functions
  const openAddContactDialog = () => {
    setContactForm({
      id: '',
      full_name: '',
      position: '',
      phone: '',
      email: ''
    })
    setContactDialogMode('add')
    setContactError(null)
    setContactDialogOpen(true)
  }

  const openEditContactDialog = async () => {
    if (!formData.contact_id) {
      setError('Please select a contact to edit')
      return
    }

    const selectedContact = contacts.find(c => c.id === formData.contact_id)
    if (!selectedContact) {
      setError('Contact not found')
      return
    }

    setContactForm({
      id: selectedContact.id,
      full_name: selectedContact.full_name,
      position: selectedContact.position || '',
      phone: selectedContact.phone || '',
      email: selectedContact.email || ''
    })
    setContactDialogMode('edit')
    setContactError(null)
    setContactDialogOpen(true)
  }

  const openDeleteContactConfirm = () => {
    if (!formData.contact_id) {
      setError('Please select a contact to delete')
      return
    }
    setIsConfirmDeleteContactOpen(true)
  }

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContactForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveContact = async () => {
    try {
      setContactError(null)
      
      // Validate contact form
      if (!contactForm.full_name.trim()) {
        setContactError('Contact name is required')
        return
      }

      if (contactDialogMode === 'add') {
        // Create new contact
        const { contact, error } = await createContact({
          client_id: formData.client_id,
          full_name: contactForm.full_name,
          position: contactForm.position || undefined,
          phone: contactForm.phone || undefined,
          email: contactForm.email || undefined
        })

        if (error) {
          setContactError(`Failed to add contact: ${error}`)
          return
        }

        if (contact) {
          // Add new contact to list and select it
          setContacts(prev => [...prev, contact])
          setFormData(prev => ({ ...prev, contact_id: contact.id }))
        }
      } else {
        // Update existing contact
        const { contact, error } = await updateContact(contactForm.id, {
          full_name: contactForm.full_name,
          position: contactForm.position || undefined,
          phone: contactForm.phone || undefined,
          email: contactForm.email || undefined
        })

        if (error) {
          setContactError(`Failed to update contact: ${error}`)
          return
        }

        if (contact) {
          // Update contact in list
          setContacts(prev => prev.map(c => c.id === contact.id ? contact : c))
        }
      }

      // Close dialog
      setContactDialogOpen(false)
      
    } catch (err: any) {
      console.error('Error saving contact:', err)
      setContactError(err.message || 'Failed to save contact')
    }
  }

  const handleDeleteContact = async () => {
    try {
      if (!formData.contact_id) return

      const { success, error } = await deleteContact(formData.contact_id)

      if (error) {
        setError(`Failed to delete contact: ${error}`)
        return
      }

      if (success) {
        // Remove contact from list and clear selection
        setContacts(prev => prev.filter(c => c.id !== formData.contact_id))
        setFormData(prev => ({ ...prev, contact_id: '' }))
      }

      setIsConfirmDeleteContactOpen(false)
      
    } catch (err: any) {
      console.error('Error deleting contact:', err)
      setError(err.message || 'Failed to delete contact')
    }
  }
  
  // Function to handle shipper search
  const handleShipperSearch = async (query: string) => {
    setShipperQuery(query)
    
    try {
      setLoading(true)
      
      // Reset pagination
      setShipperPage(1)
      
      // Search shippers with the query
      const { shippers: searchResults, error } = await fetchShippers(1, 15, query)
      
      if (error) {
        console.error('Error searching shippers:', error)
        return
      }
      
      setShippers(searchResults || [])
      setFilteredShippers(searchResults || [])
      setHasMoreShippers(searchResults?.length === 15)
    } catch (err) {
      console.error('Error searching shippers:', err)
    } finally {
      setLoading(false)
    }
  }

  // Function to load more shippers
  const loadMoreShippers = async () => {
    if (!hasMoreShippers || isLoadingMoreShippers) return
    
    try {
      setIsLoadingMoreShippers(true)
      const nextPage = shipperPage + 1
      
      // Load next page of shippers
      const { shippers: moreShippers, error } = await fetchShippers(nextPage, 15, shipperQuery)
      
      if (error) {
        console.error('Error loading more shippers:', error)
        return
      }
      
      if (moreShippers && moreShippers.length > 0) {
        setShippers(prev => [...prev, ...moreShippers])
        setShipperPage(nextPage)
        setHasMoreShippers(moreShippers.length === 15)
      } else {
        setHasMoreShippers(false)
      }
    } catch (err) {
      console.error('Error loading more shippers:', err)
    } finally {
      setIsLoadingMoreShippers(false)
    }
  }

  // Function to handle buyer search
  const handleBuyerSearch = async (query: string) => {
    setBuyerQuery(query)
    
    try {
      setLoading(true)
      
      // Reset pagination
      setBuyerPage(1)
      
      // Search buyers with the query
      const { buyers: searchResults, error } = await fetchBuyers(1, 15, query)
      
      if (error) {
        console.error('Error searching buyers:', error)
        return
      }
      
      setBuyers(searchResults || [])
      setFilteredBuyers(searchResults || [])
      setHasMoreBuyers(searchResults?.length === 15)
    } catch (err) {
      console.error('Error searching buyers:', err)
    } finally {
      setLoading(false)
    }
  }

  // Function to load more buyers
  const loadMoreBuyers = async () => {
    if (!hasMoreBuyers || isLoadingMoreBuyers) return
    
    try {
      setIsLoadingMoreBuyers(true)
      const nextPage = buyerPage + 1
      
      // Load next page of buyers
      const { buyers: moreBuyers, error } = await fetchBuyers(nextPage, 15, buyerQuery)
      
      if (error) {
        console.error('Error loading more buyers:', error)
        return
      }
      
      if (moreBuyers && moreBuyers.length > 0) {
        setBuyers(prev => [...prev, ...moreBuyers])
        setBuyerPage(nextPage)
        setHasMoreBuyers(moreBuyers.length === 15)
      } else {
        setHasMoreBuyers(false)
      }
    } catch (err) {
      console.error('Error loading more buyers:', err)
    } finally {
      setIsLoadingMoreBuyers(false)
    }
  }
  
  // Get filtered units based on search query
  const filteredUnits = unitSearch === ''
    ? units
    : units.filter((unit: Unit) =>
        unit.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(unitSearch.toLowerCase().replace(/\s+/g, ''))
      )
  
  // Get filtered clients based on search query
  const filteredClients = clientQuery === ''
    ? clients
    : clients.filter((client) =>
        client.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(clientQuery.toLowerCase().replace(/\s+/g, ''))
      )
  
  // Shipper management functions
  const openAddShipperDialog = () => {
    setShipperForm({
      id: '',
      name: '',
      email: '',
      phone: '',
      address: ''
    })
    setShipperDialogMode('add')
    setShipperError(null)
    setShipperDialogOpen(true)
  }
  
  const openEditShipperDialog = async (id: string) => {
    try {
      setLoading(true)
      const { shipper, error } = await fetchShipper(id)
      
      if (error) {
        throw new Error(error)
      }
      
      if (shipper) {
        setShipperForm({
          id: shipper.id,
          name: shipper.name,
          email: shipper.email || '',
          phone: shipper.phone || '',
          address: shipper.address || ''
        })
        
        setShipperDialogMode('edit')
        setShipperError(null)
        setShipperDialogOpen(true)
      }
    } catch (err: any) {
      console.error('Error loading shipper:', err)
      setError(err.message || 'Failed to load shipper')
    } finally {
      setLoading(false)
    }
  }
  
  const openDeleteShipperConfirm = (id: string) => {
    setShipperForm(prev => ({
      ...prev,
      id
    }))
    setIsConfirmDeleteShipperOpen(true)
  }
  
  const handleShipperFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setShipperForm(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSaveShipper = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!shipperForm.name.trim()) {
        setShipperError('Shipper name is required')
        return
      }
      
      setSaving(true)
      // Use any type for now to avoid complex typing issues
      let result: any
      
      if (shipperDialogMode === 'add') {
        result = await createShipper({
          name: shipperForm.name,
          email: shipperForm.email || undefined,
          phone: shipperForm.phone || undefined,
          address: shipperForm.address || undefined
        })
        
        if (result.error) {
          throw new Error(result.error)
        }
        
        if (result.shipper) {
          // Add the new shipper to the list
          setShippers(prev => [result.shipper, ...prev])
          setFilteredShippers(prev => [result.shipper, ...prev])
          
          // Set it as the selected shipper
          setFormData(prev => ({
            ...prev,
            shipper_id: result.shipper.id
          }))
        }
      } else {
        // Edit mode
        result = await updateShipper(shipperForm.id, {
          name: shipperForm.name,
          email: shipperForm.email || undefined,
          phone: shipperForm.phone || undefined,
          address: shipperForm.address || undefined
        })
        
        if (result.error) {
          throw new Error(result.error)
        }
        
        if (result.shipper) {
          // Update the shipper in the list
          setShippers(prev => 
            prev.map(s => s.id === result.shipper.id ? result.shipper : s)
          )
          setFilteredShippers(prev => 
            prev.map(s => s.id === result.shipper.id ? result.shipper : s)
          )
        }
      }
      
      setShipperDialogOpen(false)
    } catch (err: any) {
      console.error('Error saving shipper:', err)
      setShipperError(err.message || 'Failed to save shipper')
    } finally {
      setSaving(false)
    }
  }
  
  const handleDeleteShipper = async () => {
    if (!shipperForm.id) return
    
    try {
      setSaving(true)
      const { error } = await deleteShipper(shipperForm.id)
      
      if (error) {
        throw new Error(error)
      }
      
      // Remove shipper from list
      setShippers(prev => prev.filter(s => s.id !== shipperForm.id))
      setFilteredShippers(prev => prev.filter(s => s.id !== shipperForm.id))
      
      // If this was the selected shipper, reset the selection
      if (formData.shipper_id === shipperForm.id) {
        setFormData(prev => ({
          ...prev,
          shipper_id: ''
        }))
      }
      
      setIsConfirmDeleteShipperOpen(false)
    } catch (err: any) {
      console.error('Error deleting shipper:', err)
      setError(err.message || 'Failed to delete shipper')
    } finally {
      setSaving(false)
    }
  }
  
  // Buyer management functions
  const openAddBuyerDialog = () => {
    setBuyerForm({
      id: '',
      name: '',
      email: '',
      phone: '',
      address: ''
    })
    setBuyerDialogMode('add')
    setBuyerError(null)
    setBuyerDialogOpen(true)
  }
  
  const openEditBuyerDialog = async (id: string) => {
    try {
      setLoading(true)
      const { buyer, error } = await fetchBuyer(id)
      
      if (error) {
        throw new Error(error)
      }
      
      if (buyer) {
        setBuyerForm({
          id: buyer.id,
          name: buyer.name,
          email: buyer.email || '',
          phone: buyer.phone || '',
          address: buyer.address || ''
        })
        
        setBuyerDialogMode('edit')
        setBuyerError(null)
        setBuyerDialogOpen(true)
      }
    } catch (err: any) {
      console.error('Error loading buyer:', err)
      setError(err.message || 'Failed to load buyer')
    } finally {
      setLoading(false)
    }
  }
  
  const openDeleteBuyerConfirm = (id: string) => {
    setBuyerForm(prev => ({
      ...prev,
      id
    }))
    setIsConfirmDeleteBuyerOpen(true)
  }
  
  const handleBuyerFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBuyerForm(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSaveBuyer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!buyerForm.name.trim()) {
        setBuyerError('Buyer name is required')
        return
      }
      
      setSaving(true)
      // Use any type for now to avoid complex typing issues
      let result: any
      
      if (buyerDialogMode === 'add') {
        result = await createBuyer({
          name: buyerForm.name,
          email: buyerForm.email || undefined,
          phone: buyerForm.phone || undefined,
          address: buyerForm.address || undefined
        })
        
        if (result.error) {
          throw new Error(result.error)
        }
        
        if (result.buyer) {
          // Add the new buyer to the list
          setBuyers(prev => [result.buyer, ...prev])
          setFilteredBuyers(prev => [result.buyer, ...prev])
          
          // Set it as the selected buyer
          setFormData(prev => ({
            ...prev,
            buyer_id: result.buyer.id
          }))
        }
      } else {
        // Edit mode
        result = await updateBuyer(buyerForm.id, {
          name: buyerForm.name,
          email: buyerForm.email || undefined,
          phone: buyerForm.phone || undefined,
          address: buyerForm.address || undefined
        })
        
        if (result.error) {
          throw new Error(result.error)
        }
        
        if (result.buyer) {
          // Update the buyer in the list
          setBuyers(prev => 
            prev.map(b => b.id === result.buyer.id ? result.buyer : b)
          )
          setFilteredBuyers(prev => 
            prev.map(b => b.id === result.buyer.id ? result.buyer : b)
          )
        }
      }
      
      setBuyerDialogOpen(false)
    } catch (err: any) {
      console.error('Error saving buyer:', err)
      setBuyerError(err.message || 'Failed to save buyer')
    } finally {
      setSaving(false)
    }
  }
  
  const handleDeleteBuyer = async () => {
    if (!buyerForm.id) return
    
    try {
      setSaving(true)
      const { error } = await deleteBuyer(buyerForm.id)
      
      if (error) {
        throw new Error(error)
      }
      
      // Remove buyer from list
      setBuyers(prev => prev.filter(b => b.id !== buyerForm.id))
      setFilteredBuyers(prev => prev.filter(b => b.id !== buyerForm.id))
      
      // If this was the selected buyer, reset the selection
      if (formData.buyer_id === buyerForm.id) {
        setFormData(prev => ({
          ...prev,
          buyer_id: ''
        }))
      }
      
      setIsConfirmDeleteBuyerOpen(false)
    } catch (err: any) {
      console.error('Error deleting buyer:', err)
      setError(err.message || 'Failed to delete buyer')
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href="/dashboard/orders" className="mr-4">
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold">Create New Order</h1>
        </div>
        <div>
          {previewOrderNumber && (
            <div className="text-sm text-gray-500 mb-2">
              Order number: <span className="font-semibold">{previewOrderNumber}</span>
            </div>
          )}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/orders')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="flex items-center"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save Order
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-gray-500" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Combobox
                      value={formData.client_id}
                      onChange={(value: string) => handleClientChange(value)}
                    >
                      <div className="relative">
                        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-input shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-300 sm:text-sm">
                          <Combobox.Input
                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                            displayValue={(clientId: string) => 
                              clients.find(c => c.id === clientId)?.name || ''
                            }
                            onChange={(event) => handleClientSearch(event.target.value)}
                            placeholder="Search client..."
                          />
                          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          </Combobox.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {loading ? (
                              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                Loading clients...
                              </div>
                            ) : filteredClients.length === 0 ? (
                              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                No clients found.
                              </div>
                            ) : (
                              <>
                                {filteredClients.map((client) => (
                                  <Combobox.Option
                                    key={client.id}
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-primary text-white' : 'text-gray-900'
                                      }`
                                    }
                                    value={client.id}
                                  >
                                    {({ selected, active }) => (
                                      <>
                                        <span
                                          className={`block truncate ${
                                            selected ? 'font-medium' : 'font-normal'
                                          }`}
                                        >
                                          {client.name}
                                        </span>
                                        {selected ? (
                                          <span
                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                              active ? 'text-white' : 'text-primary'
                                            }`}
                                          >
                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </Combobox.Option>
                                ))}
                                {hasMoreClients && (
                                  <div 
                                    className="relative cursor-pointer select-none py-2 px-4 text-center text-gray-700 hover:bg-gray-100"
                                    onClick={loadMoreClients}
                                  >
                                    {isLoadingMoreClients ? 'Loading more...' : 'Load more clients'}
                                  </div>
                                )}
                              </>
                            )}
                          </Combobox.Options>
                        </Transition>
                      </div>
                    </Combobox>
                  </div>
                  
                  <div>
                    <Menu as="div" className="relative">
                      <Menu.Button className="flex justify-center items-center h-10 w-10 rounded-md bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </Menu.Button>
                      
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={openAddClientDialog}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm`}
                                >
                                  <PlusIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                                  Add New Client
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={openEditClientDialog}
                                  disabled={!formData.client_id}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm ${
                                    !formData.client_id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <PencilIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                                  Edit Client
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={openDeleteClientConfirm}
                                  disabled={!formData.client_id}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm ${
                                    !formData.client_id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                                  Delete Client
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_id">Contact Person</Label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Select
                      value={formData.contact_id}
                      onValueChange={(value) => handleValueChange('contact_id', value)}
                      disabled={!formData.client_id || contacts.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={contacts.length === 0 ? "No contacts available" : "Select a contact"} />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Menu as="div" className="relative">
                      <Menu.Button className="flex justify-center items-center h-10 w-10 rounded-md bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </Menu.Button>
                      
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={openAddContactDialog}
                                  disabled={!formData.client_id}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm ${
                                    !formData.client_id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <PlusIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                                  Add New Contact
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={openEditContactDialog}
                                  disabled={!formData.contact_id}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm ${
                                    !formData.contact_id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <PencilIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                                  Edit Contact
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={openDeleteContactConfirm}
                                  disabled={!formData.contact_id}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm ${
                                    !formData.contact_id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                                  Delete Contact
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Order Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleValueChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="international">International</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleValueChange('department', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marine">Marine</SelectItem>
                    <SelectItem value="agri">Agricultural</SelectItem>
                    <SelectItem value="consumer_goods">Consumer Goods</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="order_date">Order Date</Label>
                <Input
                  id="order_date"
                  name="order_date"
                  type="date"
                  value={formData.order_date}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client_ref_code">Client Reference Code</Label>
                <Input
                  id="client_ref_code"
                  name="client_ref_code"
                  type="text"
                  value={formData.client_ref_code}
                  onChange={handleChange}
                  placeholder="Client's reference number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShipIcon className="h-5 w-5 mr-2 text-gray-500" />
              Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="shipper_id">Shipper</Label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Combobox
                      value={formData.shipper_id}
                      onChange={(value: string) => handleValueChange('shipper_id', value)}
                    >
                      <div className="relative mt-1">
                        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-input shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-300 sm:text-sm">
                          <Combobox.Input
                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                            displayValue={(shipperId: string) => 
                              shippers.find(s => s.id === shipperId)?.name || ''
                            }
                            onChange={(event) => handleShipperSearch(event.target.value)}
                            placeholder="Search shipper..."
                          />
                          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          </Combobox.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {filteredShippers.length === 0 ? (
                              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                No shippers found.
                              </div>
                            ) : (
                              <>
                                {filteredShippers.map((shipper) => (
                                  <Combobox.Option
                                    key={shipper.id}
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-primary text-white' : 'text-gray-900'
                                      }`
                                    }
                                    value={shipper.id}
                                  >
                                    {({ selected, active }) => (
                                      <>
                                        <span
                                          className={`block truncate ${
                                            selected ? 'font-medium' : 'font-normal'
                                          }`}
                                        >
                                          {shipper.name}
                                        </span>
                                        {selected ? (
                                          <span
                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                              active ? 'text-white' : 'text-primary'
                                            }`}
                                          >
                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </Combobox.Option>
                                ))}
                                {hasMoreShippers && (
                                  <div 
                                    className="relative cursor-pointer select-none py-2 px-4 text-center text-gray-700 hover:bg-gray-100"
                                    onClick={loadMoreShippers}
                                  >
                                    {isLoadingMoreShippers ? 'Loading more...' : 'Load more shippers'}
                                  </div>
                                )}
                              </>
                            )}
                          </Combobox.Options>
                        </Transition>
                      </div>
                    </Combobox>
                  </div>
                  
                  {/* Shipper management buttons */}
                  <div className="relative">
                    <Menu as="div" className="relative inline-block text-left">
                      <div>
                        <Menu.Button className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground">
                          <span className="sr-only">Open options</span>
                          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={openAddShipperDialog}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm`}
                                >
                                  <PlusIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                  Add Shipper
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => formData.shipper_id ? openEditShipperDialog(formData.shipper_id) : setError('Please select a shipper to edit')}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm`}
                                >
                                  <PencilIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                  Edit Shipper
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => formData.shipper_id ? openDeleteShipperConfirm(formData.shipper_id) : setError('Please select a shipper to delete')}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm`}
                                >
                                  <TrashIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                  Delete Shipper
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyer_id">Buyer</Label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Combobox
                      value={formData.buyer_id}
                      onChange={(value: string) => handleValueChange('buyer_id', value)}
                    >
                      <div className="relative mt-1">
                        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-input shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-300 sm:text-sm">
                          <Combobox.Input
                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                            displayValue={(buyerId: string) => 
                              buyers.find(b => b.id === buyerId)?.name || ''
                            }
                            onChange={(event) => handleBuyerSearch(event.target.value)}
                            placeholder="Search buyer..."
                          />
                          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          </Combobox.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {filteredBuyers.length === 0 ? (
                              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                No buyers found.
                              </div>
                            ) : (
                              <>
                                {filteredBuyers.map((buyer) => (
                                  <Combobox.Option
                                    key={buyer.id}
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-primary text-white' : 'text-gray-900'
                                      }`
                                    }
                                    value={buyer.id}
                                  >
                                    {({ selected, active }) => (
                                      <>
                                        <span
                                          className={`block truncate ${
                                            selected ? 'font-medium' : 'font-normal'
                                          }`}
                                        >
                                          {buyer.name}
                                        </span>
                                        {selected ? (
                                          <span
                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                              active ? 'text-white' : 'text-primary'
                                            }`}
                                          >
                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </Combobox.Option>
                                ))}
                                {hasMoreBuyers && (
                                  <div 
                                    className="relative cursor-pointer select-none py-2 px-4 text-center text-gray-700 hover:bg-gray-100"
                                    onClick={loadMoreBuyers}
                                  >
                                    {isLoadingMoreBuyers ? 'Loading more...' : 'Load more buyers'}
                                  </div>
                                )}
                              </>
                            )}
                          </Combobox.Options>
                        </Transition>
                      </div>
                    </Combobox>
                  </div>
                  
                  {/* Buyer management buttons */}
                  <div className="relative">
                    <Menu as="div" className="relative inline-block text-left">
                      <div>
                        <Menu.Button className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground">
                          <span className="sr-only">Open options</span>
                          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={openAddBuyerDialog}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm`}
                                >
                                  <PlusIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                  Add Buyer
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => formData.buyer_id ? openEditBuyerDialog(formData.buyer_id) : setError('Please select a buyer to edit')}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm`}
                                >
                                  <PencilIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                  Edit Buyer
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => formData.buyer_id ? openDeleteBuyerConfirm(formData.buyer_id) : setError('Please select a buyer to delete')}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm`}
                                >
                                  <TrashIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                  Delete Buyer
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vessel_carrier">Vessel/Carrier</Label>
              <Input
                id="vessel_carrier"
                name="vessel_carrier"
                type="text"
                value={formData.vessel_carrier}
                onChange={handleChange}
                placeholder="Vessel or carrier name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bill_of_lading">Bill of Lading</Label>
              <Input
                id="bill_of_lading"
                name="bill_of_lading"
                type="text"
                value={formData.bill_of_lading}
                onChange={handleChange}
                placeholder="Bill of lading number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bill_of_lading_date">Bill of Lading Date</Label>
              <Input
                id="bill_of_lading_date"
                name="bill_of_lading_date"
                type="date"
                value={formData.bill_of_lading_date}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Order Items */}
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <PackageIcon className="h-5 w-5 mr-2 text-gray-500" />
              Order Items
            </CardTitle>
            <Button variant="outline" size="sm" onClick={openAddItemForm}>
              <PlusIcon className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items added yet. Click "Add Item" to add order items.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.commodities?.name || item.commodity_id}</TableCell>
                      <TableCell>{item.commodity_description || '-'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.units?.name || item.unit_id}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditItemForm(index)}>
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(index)}>
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Notes */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheetIcon className="h-5 w-5 mr-2 text-gray-500" />
              Notes & Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any notes or additional information here..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Item Form Dialog */}
      <Dialog open={itemFormOpen} onOpenChange={setItemFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingItem ? 'Edit Order Item' : 'Add Order Item'}</DialogTitle>
            <DialogDescription>
              {isEditingItem ? 'Update the details for this order item.' : 'Add a new item to this order.'}
            </DialogDescription>
          </DialogHeader>
          
          {itemError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{itemError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="commodity_id">Commodity</Label>
              <Combobox
                value={currentItem.commodity_id}
                onChange={(value) => handleItemSelectChange('commodity_id', value)}
              >
                <div className="relative mt-1">
                  <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-input shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-300 sm:text-sm">
                    <Combobox.Input
                      className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                      displayValue={(commodityId: string) => 
                        commodities.find(c => c.id === commodityId)?.name || ''
                      }
                      onChange={(event) => handleCommoditySearch(event.target.value)}
                      placeholder="Search commodity..."
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </Combobox.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {filteredCommodities.length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                          No commodities found.
                        </div>
                      ) : (
                        <>
                          {filteredCommodities.map((commodity) => (
                            <Combobox.Option
                              key={commodity.id}
                              className={({ active }) =>
                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                  active ? 'bg-primary text-white' : 'text-gray-900'
                                }`
                              }
                              value={commodity.id}
                            >
                              {({ selected, active }) => (
                                <>
                                  <span
                                    className={`block truncate ${
                                      selected ? 'font-medium' : 'font-normal'
                                    }`}
                                  >
                                    {commodity.name}
                                  </span>
                                  {selected ? (
                                    <span
                                      className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                        active ? 'text-white' : 'text-primary'
                                      }`}
                                    >
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Combobox.Option>
                          ))}
                          {hasMoreCommodities && (
                            <div 
                              className="relative cursor-pointer select-none py-2 px-4 text-center text-gray-700 hover:bg-gray-100"
                              onClick={loadMoreCommodities}
                            >
                              {isLoadingMoreCommodities ? 'Loading more...' : 'Load more commodities'}
                            </div>
                          )}
                        </>
                      )}
                    </Combobox.Options>
                  </Transition>
                </div>
              </Combobox>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="commodity_description">Description</Label>
              <Textarea
                id="commodity_description"
                name="commodity_description"
                value={currentItem.commodity_description}
                onChange={handleItemChange}
                placeholder="Detailed description of the commodity..."
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={handleItemChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit_id">Unit</Label>
                <Combobox
                  value={currentItem.unit_id}
                  onChange={(value) => handleItemSelectChange('unit_id', value)}
                >
                  <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-input shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-300 sm:text-sm">
                      <Combobox.Input
                        className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                        displayValue={(unitId: string) => 
                          units.find(u => u.id === unitId)?.name || ''
                        }
                        onChange={(event) => setUnitSearch(event.target.value)}
                        placeholder="Select unit..."
                      />
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </Combobox.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                      afterLeave={() => setUnitSearch('')}
                    >
                      <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {filteredUnits.length === 0 && unitSearch !== '' ? (
                          <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            Nothing found.
                          </div>
                        ) : (
                          filteredUnits.map((unit) => (
                            <Combobox.Option
                              key={unit.id}
                              className={({ active }) =>
                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                  active ? 'bg-primary text-white' : 'text-gray-900'
                                }`
                              }
                              value={unit.id}
                            >
                              {({ selected, active }) => (
                                <>
                                  <span
                                    className={`block truncate ${
                                      selected ? 'font-medium' : 'font-normal'
                                    }`}
                                  >
                                    {unit.name}
                                  </span>
                                  {selected ? (
                                    <span
                                      className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                        active ? 'text-white' : 'text-primary'
                                      }`}
                                    >
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Combobox.Option>
                          ))
                        )}
                      </Combobox.Options>
                    </Transition>
                  </div>
                </Combobox>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleSaveItem}>
              {isEditingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Client Dialog */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{clientDialogMode === 'add' ? 'Add New Client' : 'Edit Client'}</DialogTitle>
            <DialogDescription>
              {clientDialogMode === 'add' 
                ? 'Enter the details to create a new client.' 
                : 'Update the client information.'}
            </DialogDescription>
          </DialogHeader>
          
          {clientError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{clientError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name</Label>
              <Input
                id="name"
                name="name"
                value={clientForm.name}
                onChange={handleClientFormChange}
                placeholder="Enter client name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={clientForm.email}
                onChange={handleClientFormChange}
                placeholder="Enter client email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={clientForm.phone}
                onChange={handleClientFormChange}
                placeholder="Enter client phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={clientForm.address}
                onChange={handleClientFormChange}
                placeholder="Enter client address"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleSaveClient}>
              {clientDialogMode === 'add' ? 'Add Client' : 'Update Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this client? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClient}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{contactDialogMode === 'add' ? 'Add New Contact' : 'Edit Contact'}</DialogTitle>
            <DialogDescription>
              {contactDialogMode === 'add' 
                ? 'Enter details for the new contact person.' 
                : 'Update the contact person details.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {contactError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{contactError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input 
                id="full_name"
                name="full_name"
                value={contactForm.full_name}
                onChange={handleContactFormChange}
                placeholder="Full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input 
                id="position"
                name="position"
                value={contactForm.position}
                onChange={handleContactFormChange}
                placeholder="Position/Title (optional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                name="email"
                type="email"
                value={contactForm.email}
                onChange={handleContactFormChange}
                placeholder="Email address (optional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone"
                name="phone"
                value={contactForm.phone}
                onChange={handleContactFormChange}
                placeholder="Phone number (optional)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveContact}>
              {contactDialogMode === 'add' ? 'Add Contact' : 'Update Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Confirmation Dialog */}
      <Dialog open={isConfirmDeleteContactOpen} onOpenChange={setIsConfirmDeleteContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteContactOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteContact}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipper Dialog */}
      <Dialog open={shipperDialogOpen} onOpenChange={setShipperDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {shipperDialogMode === 'add' ? 'Add New Shipper' : 'Edit Shipper'}
            </DialogTitle>
            <DialogDescription>
              {shipperDialogMode === 'add' 
                ? 'Enter the details of the new shipper.' 
                : 'Update the shipper information.'}
            </DialogDescription>
          </DialogHeader>
          
          {shipperError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{shipperError}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSaveShipper} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="shipper-name">Name</Label>
              <Input
                id="shipper-name"
                name="name"
                value={shipperForm.name}
                onChange={handleShipperFormChange}
                placeholder="Shipper name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shipper-email">Email</Label>
              <Input
                id="shipper-email"
                name="email"
                type="email"
                value={shipperForm.email}
                onChange={handleShipperFormChange}
                placeholder="Email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shipper-phone">Phone</Label>
              <Input
                id="shipper-phone"
                name="phone"
                value={shipperForm.phone}
                onChange={handleShipperFormChange}
                placeholder="Phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shipper-address">Address</Label>
              <Textarea
                id="shipper-address"
                name="address"
                value={shipperForm.address}
                onChange={handleShipperFormChange}
                placeholder="Address"
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShipperDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Shipper Confirmation Dialog */}
      <Dialog open={isConfirmDeleteShipperOpen} onOpenChange={setIsConfirmDeleteShipperOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete Shipper</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this shipper? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button" 
              variant="outline" 
              onClick={() => setIsConfirmDeleteShipperOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteShipper} 
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buyer Dialog */}
      <Dialog open={buyerDialogOpen} onOpenChange={setBuyerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {buyerDialogMode === 'add' ? 'Add New Buyer' : 'Edit Buyer'}
            </DialogTitle>
            <DialogDescription>
              {buyerDialogMode === 'add' 
                ? 'Enter the details of the new buyer.' 
                : 'Update the buyer information.'}
            </DialogDescription>
          </DialogHeader>
          
          {buyerError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{buyerError}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSaveBuyer} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="buyer-name">Name</Label>
              <Input
                id="buyer-name"
                name="name"
                value={buyerForm.name}
                onChange={handleBuyerFormChange}
                placeholder="Buyer name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="buyer-email">Email</Label>
              <Input
                id="buyer-email"
                name="email"
                type="email"
                value={buyerForm.email}
                onChange={handleBuyerFormChange}
                placeholder="Email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="buyer-phone">Phone</Label>
              <Input
                id="buyer-phone"
                name="phone"
                value={buyerForm.phone}
                onChange={handleBuyerFormChange}
                placeholder="Phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="buyer-address">Address</Label>
              <Textarea
                id="buyer-address"
                name="address"
                value={buyerForm.address}
                onChange={handleBuyerFormChange}
                placeholder="Address"
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBuyerDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Buyer Confirmation Dialog */}
      <Dialog open={isConfirmDeleteBuyerOpen} onOpenChange={setIsConfirmDeleteBuyerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete Buyer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this buyer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button" 
              variant="outline" 
              onClick={() => setIsConfirmDeleteBuyerOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteBuyer} 
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
