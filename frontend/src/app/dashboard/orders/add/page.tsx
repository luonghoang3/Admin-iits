'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { Combobox, Transition, Menu, Listbox } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { createClient } from '@/utils/supabase/client'
import { createOrder, fetchClients, fetchNextOrderSequence } from '@/utils/supabase/client'
import { fetchShippers, fetchBuyers, fetchShipper, createShipper, updateShipper, deleteShipper, fetchBuyer, createBuyer, updateBuyer, deleteBuyer } from '@/utils/supabase/shipping'
import { fetchCommodities, fetchUnits, createOrderItem } from '@/utils/supabase/client'

interface Client {
  id: string
  name: string
}

interface Contact {
  id: string
  client_id: string
  full_name: string
  position?: string | null
  phone?: string | null
  email?: string | null
}

interface Shipper {
  id: string
  name: string
}

interface Buyer {
  id: string
  name: string
}

interface Commodity {
  id: string
  name: string
  description?: string | null
}

interface Unit {
  id: string
  name: string
  description?: string | null
}

interface OrderItem {
  id?: string
  commodity_id: string
  commodity?: Commodity
  quantity: number
  unit_id: string
  unit?: Unit
  commodity_description?: string
  isNew?: boolean
}

export default function AddOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [shippers, setShippers] = useState<Shipper[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // Search queries for comboboxes
  const [clientQuery, setClientQuery] = useState('')
  const [contactQuery, setContactQuery] = useState('')
  const [shipperQuery, setShipperQuery] = useState('')
  const [buyerQuery, setBuyerQuery] = useState('')
  const [commodityQuery, setCommodityQuery] = useState('')
  const [unitQuery, setUnitQuery] = useState('')
  
  // Form state
  const [clientId, setClientId] = useState('')
  const [contactId, setContactId] = useState('')
  const [shipperId, setShipperId] = useState('')
  const [buyerId, setBuyerId] = useState('')
  const [type, setType] = useState<'international' | 'local'>('international')
  const [department, setDepartment] = useState<'marine' | 'agri' | 'consumer_goods'>('marine')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]) // Today's date
  const [clientRefCode, setClientRefCode] = useState('')
  const [vessel, setVessel] = useState('')
  const [billOfLading, setBillOfLading] = useState('')
  const [billOfLadingDate, setBillOfLadingDate] = useState('')
  const [notes, setNotes] = useState('')
  const [previewOrderNumber, setPreviewOrderNumber] = useState('')
  
  // Order items state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [itemMode, setItemMode] = useState<'add' | 'edit'>('add')
  const [itemForm, setItemForm] = useState<OrderItem>({
    commodity_id: '',
    quantity: 1,
    unit_id: '',
    commodity_description: ''
  })
  
  // Modal states
  const [showShipperModal, setShowShipperModal] = useState(false)
  const [shipperMode, setShipperMode] = useState<'add' | 'edit'>('add')
  const [shipperForm, setShipperForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  })
  
  // Contact modal states
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactMode, setContactMode] = useState<'add' | 'edit'>('add')
  const [contactForm, setContactForm] = useState({
    full_name: '',
    position: '',
    phone: '',
    email: ''
  })
  
  // Buyer modal states
  const [showBuyerModal, setShowBuyerModal] = useState(false)
  const [buyerMode, setBuyerMode] = useState<'add' | 'edit'>('add')
  const [buyerForm, setBuyerForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  })
  
  // Client modal states
  const [showClientModal, setShowClientModal] = useState(false)
  const [clientMode, setClientMode] = useState<'add' | 'edit'>('add')
  const [clientForm, setClientForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    contact_name: '',
    contact_position: '',
    contact_phone: '',
    contact_email: ''
  })
  
  // Contact states
  const [contacts, setContacts] = useState<Contact[]>([])
  
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
        }
        
        // Fetch shippers for dropdown
        const { shippers: shipperData, error: shippersError } = await fetchShippers()
        
        if (shippersError) {
          setError(`Could not load shippers: ${shippersError}`)
        } else if (shipperData) {
          setShippers(shipperData)
        }
        
        // Fetch buyers for dropdown
        const { buyers: buyerData, error: buyersError } = await fetchBuyers()
        
        if (buyersError) {
          setError(`Could not load buyers: ${buyersError}`)
        } else if (buyerData) {
          setBuyers(buyerData)
        }
        
        // Fetch commodities for dropdown
        const { commodities: commodityData, error: commoditiesError } = await fetchCommodities()
        
        if (commoditiesError) {
          setError(`Could not load commodities: ${commoditiesError}`)
        } else if (commodityData) {
          setCommodities(commodityData)
        }
        
        // Fetch units for dropdown
        const { units: unitData, error: unitsError } = await fetchUnits()
        
        if (unitsError) {
          setError(`Could not load units: ${unitsError}`)
        } else if (unitData) {
          setUnits(unitData)
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
    setLoading(true)
    setError(null)
    
    try {
      if (!clientId) {
        throw new Error('Client is required')
      }
      
      // Step 1: Create the order
      const { order, error: orderError } = await createOrder({
        client_id: clientId,
        contact_id: contactId || null,
        shipper_id: shipperId || null,
        buyer_id: buyerId || null,
        type,
        department,
        order_date: orderDate,
        client_ref_code: clientRefCode || null,
        vessel_carrier: vessel || null,
        bill_of_lading: billOfLading || null,
        bill_of_lading_date: billOfLadingDate || null,
        order_number: previewOrderNumber || null
      })
      
      if (orderError) throw new Error(orderError)
      
      if (!order) throw new Error('Failed to create order')
      
      // Step 2: Create order items
      const orderItemPromises = orderItems.map(item => 
        createOrderItem({
          order_id: order.id,
          commodity_id: item.commodity_id,
          quantity: item.quantity,
          unit_id: item.unit_id,
          commodity_description: item.commodity_description
        })
      )
      
      // Execute all promises
      const orderItemResults = await Promise.all(orderItemPromises)
      
      // Check for any errors
      const itemErrors = orderItemResults.filter(result => result.error)
      if (itemErrors.length > 0) {
        console.error('Some items failed to save:', itemErrors)
      }
      
      // Redirect to order detail or list page
      router.push(`/dashboard/orders/${order.id}`)
    } catch (err: any) {
      console.error('Error creating order:', err)
      setError(err.message || 'Error creating order')
      setLoading(false)
    }
  }
  
  // Shipper management functions
  function openAddShipperModal(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setShipperForm({
      name: '',
      address: '',
      phone: '',
      email: ''
    })
    setShipperMode('add')
    setShowShipperModal(true)
  }
  
  function openEditShipperModal(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!shipperId) return
    
    const currentShipper = shippers.find(s => s.id === shipperId)
    if (!currentShipper) return
    
    // Need to fetch full shipper details
    const fetchShipperDetails = async () => {
      try {
        const { shipper, error } = await fetchShipper(shipperId)
        if (error) throw new Error(error)
        
        if (shipper) {
          setShipperForm({
            name: shipper.name || '',
            address: shipper.address || '',
            phone: shipper.phone || '',
            email: shipper.email || ''
          })
          setShipperMode('edit')
          setShowShipperModal(true)
        }
      } catch (err: any) {
        console.error('Error fetching shipper details:', err)
        setError(err.message || 'An error occurred while fetching shipper details')
      }
    }
    
    fetchShipperDetails()
  }
  
  async function handleSaveShipper() {
    try {
      setError(null)
      
      if (shipperMode === 'add') {
        const { shipper, error } = await createShipper(shipperForm)
        
        if (error) throw new Error(error)
        
        if (shipper) {
          // Update shippers list and select the new shipper
          setShippers([...shippers, shipper])
          setShipperId(shipper.id)
          setShowShipperModal(false)
        }
      } else {
        // Edit mode
        if (!shipperId) return
        
        const { shipper, error } = await updateShipper(shipperId, shipperForm)
        
        if (error) throw new Error(error)
        
        if (shipper) {
          // Update shippers list
          setShippers(shippers.map(s => s.id === shipper.id ? shipper : s))
          setShowShipperModal(false)
        }
      }
    } catch (err: any) {
      console.error('Error saving shipper:', err)
      setError(err.message || 'An error occurred while saving shipper')
    }
  }
  
  async function handleDeleteShipper(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!shipperId || !window.confirm('Are you sure you want to delete this shipper?')) {
      return
    }
    
    try {
      setError(null)
      
      const { success, error } = await deleteShipper(shipperId)
      
      if (error) throw new Error(error)
      
      if (success) {
        // Update shippers list and clear selection
        setShippers(shippers.filter(s => s.id !== shipperId))
        setShipperId('')
      }
    } catch (err: any) {
      console.error('Error deleting shipper:', err)
      setError(err.message || 'An error occurred while deleting shipper')
    }
  }
  
  // Buyer management functions
  function openAddBuyerModal(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setBuyerForm({
      name: '',
      address: '',
      phone: '',
      email: ''
    })
    setBuyerMode('add')
    setShowBuyerModal(true)
  }
  
  function openEditBuyerModal(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!buyerId) return
    
    const currentBuyer = buyers.find(b => b.id === buyerId)
    if (!currentBuyer) return
    
    // Need to fetch full buyer details
    const fetchBuyerDetails = async () => {
      try {
        const { buyer, error } = await fetchBuyer(buyerId)
        if (error) throw new Error(error)
        
        if (buyer) {
          setBuyerForm({
            name: buyer.name || '',
            address: buyer.address || '',
            phone: buyer.phone || '',
            email: buyer.email || ''
          })
          setBuyerMode('edit')
          setShowBuyerModal(true)
        }
      } catch (err: any) {
        console.error('Error fetching buyer details:', err)
        setError(err.message || 'An error occurred while fetching buyer details')
      }
    }
    
    fetchBuyerDetails()
  }
  
  async function handleSaveBuyer() {
    try {
      setError(null)
      
      if (buyerMode === 'add') {
        const { buyer, error } = await createBuyer(buyerForm)
        
        if (error) throw new Error(error)
        
        if (buyer) {
          // Update buyers list and select the new buyer
          setBuyers([...buyers, buyer])
          setBuyerId(buyer.id)
          setShowBuyerModal(false)
        }
      } else {
        // Edit mode
        if (!buyerId) return
        
        const { buyer, error } = await updateBuyer(buyerId, buyerForm)
        
        if (error) throw new Error(error)
        
        if (buyer) {
          // Update buyers list
          setBuyers(buyers.map(b => b.id === buyer.id ? buyer : b))
          setShowBuyerModal(false)
        }
      }
    } catch (err: any) {
      console.error('Error saving buyer:', err)
      setError(err.message || 'An error occurred while saving buyer')
    }
  }
  
  async function handleDeleteBuyer(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!buyerId || !window.confirm('Are you sure you want to delete this buyer?')) {
      return
    }
    
    try {
      setError(null)
      
      const { success, error } = await deleteBuyer(buyerId)
      
      if (error) throw new Error(error)
      
      if (success) {
        // Update buyers list and clear selection
        setBuyers(buyers.filter(b => b.id !== buyerId))
        setBuyerId('')
      }
    } catch (err: any) {
      console.error('Error deleting buyer:', err)
      setError(err.message || 'An error occurred while deleting buyer')
    }
  }
  
  // Client management functions
  function openAddClientModal(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setClientForm({
      name: '',
      address: '',
      phone: '',
      email: '',
      contact_name: '',
      contact_position: '',
      contact_phone: '',
      contact_email: ''
    })
    setClientMode('add')
    setShowClientModal(true)
  }
  
  function openEditClientModal(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!clientId) return
    
    const currentClient = clients.find(c => c.id === clientId)
    if (!currentClient) return
    
    // Need to fetch full client details
    const fetchClientDetails = async () => {
      try {
        const supabase = createClient()
        const { data: client, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single()
          
        if (error) throw new Error(error.message)
        
        if (client) {
          setClientForm({
            name: client.name || '',
            address: client.address || '',
            phone: client.phone || '',
            email: client.email || '',
            contact_name: '',
            contact_position: '',
            contact_phone: '',
            contact_email: ''
          })
          setClientMode('edit')
          setShowClientModal(true)
        }
      } catch (err: any) {
        console.error('Error fetching client details:', err)
        setError(err.message || 'An error occurred while fetching client details')
      }
    }
    
    fetchClientDetails()
  }
  
  async function handleSaveClient() {
    try {
      setError(null)
      const supabase = createClient()
      
      const newClient = {
        name: clientForm.name,
        address: clientForm.address || null,
        phone: clientForm.phone || null,
        email: clientForm.email || null
      }
      
      const contactData = clientForm.contact_name ? {
        full_name: clientForm.contact_name,
        position: clientForm.contact_position || null,
        phone: clientForm.contact_phone || null,
        email: clientForm.contact_email || null
      } : null
      
      if (clientMode === 'add') {
        const { data, error } = await supabase
          .from('clients')
          .insert([newClient])
          .select()
          .single()
        
        if (error) throw new Error(error.message)
        
        if (data) {
          // If contact info was provided, add a contact
          if (contactData) {
            const { data: newContact, error: contactError } = await supabase
              .from('contacts')
              .insert([{ ...contactData, client_id: data.id }])
              .select()
              .single()
            
            if (contactError) throw new Error(contactError.message)
            
            // Set the new contact as selected
            if (newContact) {
              setContactId(newContact.id)
            } else {
              // Reload contacts for this client
              loadClientContacts(data.id)
            }
          }
          
          // Update clients list and select the new client
          const newClientData = { id: data.id, name: data.name }
          setClients([...clients, newClientData])
          setClientId(data.id)
          
          // Load contacts for this client
          loadClientContacts(data.id)
          
          setShowClientModal(false)
        }
      } else {
        // Edit mode
        if (!clientId) return
        
        const { data, error } = await supabase
          .from('clients')
          .update(newClient)
          .eq('id', clientId)
          .select()
          .single()
        
        if (error) throw new Error(error.message)
        
        if (data) {
          // Update clients list
          setClients(clients.map(c => c.id === data.id ? { id: data.id, name: data.name } : c))
          
          // If contact info was provided, add a new contact
          if (contactData) {
            const { data: newContact, error: contactError } = await supabase
              .from('contacts')
              .insert([{ ...contactData, client_id: data.id }])
              .select()
              .single()
            
            if (contactError) throw new Error(contactError.message)
            
            // Set the new contact as selected
            if (newContact) {
              setContactId(newContact.id)
            } else {
              // Reload contacts for this client
              loadClientContacts(data.id)
            }
          }
          
          setShowClientModal(false)
        }
      }
    } catch (err: any) {
      console.error('Error saving client:', err)
      setError(err.message || 'An error occurred while saving client')
    }
  }
  
  async function handleDeleteClient(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!clientId || !window.confirm('Are you sure you want to delete this client?')) {
      return
    }
    
    try {
      setError(null)
      const supabase = createClient()
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
      
      if (error) throw new Error(error.message)
      
      // Update clients list and clear selection
      setClients(clients.filter(c => c.id !== clientId))
      setClientId('')
      setContacts([])
      setContactId('')
      
    } catch (err: any) {
      console.error('Error deleting client:', err)
      setError(err.message || 'An error occurred while deleting client')
    }
  }
  
  async function loadClientContacts(client_id: string) {
    if (!client_id) {
      setContacts([])
      setContactId('')
      return
    }
    
    try {
      const supabase = createClient()
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('client_id', client_id)
        .order('created_at', { ascending: false }) // Sort by created_at in descending order
      
      if (error) throw new Error(error.message)
      
      setContacts(contactsData || [])
      
      // Automatically select the newest contact if available
      if (contactsData && contactsData.length > 0) {
        setContactId(contactsData[0].id)
      } else {
        setContactId('')
      }
    } catch (err: any) {
      console.error('Error loading contacts:', err)
      setError(err.message || 'An error occurred while loading contacts')
    }
  }
  
  // Filter logic for comboboxes
  const filteredClients = clientQuery === ''
    ? clients
    : clients.filter((client) =>
        client.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(clientQuery.toLowerCase().replace(/\s+/g, ''))
      )
      
  const filteredContacts = contactQuery === ''
    ? contacts
    : contacts.filter((contact) =>
        contact.full_name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(contactQuery.toLowerCase().replace(/\s+/g, ''))
      )
      
  const filteredShippers = shipperQuery === ''
    ? shippers
    : shippers.filter((shipper) =>
        shipper.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(shipperQuery.toLowerCase().replace(/\s+/g, ''))
      )
      
  const filteredBuyers = buyerQuery === ''
    ? buyers
    : buyers.filter((buyer) =>
        buyer.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(buyerQuery.toLowerCase().replace(/\s+/g, ''))
      )
      
  const filteredCommodities = commodityQuery === ''
    ? commodities
    : commodities.filter((commodity) =>
        commodity.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(commodityQuery.toLowerCase().replace(/\s+/g, ''))
      )
      
  const filteredUnits = unitQuery === ''
    ? units
    : units.filter((unit) =>
        unit.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(unitQuery.toLowerCase().replace(/\s+/g, ''))
      )
  
  // Contact management functions
  function openAddContactModal() {
    if (!clientId) {
      setError('Please select a client first')
      return
    }
    
    setContactForm({
      full_name: '',
      position: '',
      phone: '',
      email: ''
    })
    setContactMode('add')
    setShowContactModal(true)
  }
  
  function openEditContactModal() {
    if (!contactId) return
    
    const currentContact = contacts.find(c => c.id === contactId)
    if (!currentContact) return
    
    // Set form with current contact details
    setContactForm({
      full_name: currentContact.full_name || '',
      position: currentContact.position || '',
      phone: currentContact.phone || '',
      email: currentContact.email || ''
    })
    setContactMode('edit')
    setShowContactModal(true)
  }
  
  async function handleSaveContact() {
    if (!clientId) {
      setError('Client is required')
      return
    }
    
    try {
      setError(null)
      const supabase = createClient()
      
      if (contactMode === 'add') {
        // Add new contact
        const { data, error } = await supabase
          .from('contacts')
          .insert({
            client_id: clientId,
            full_name: contactForm.full_name,
            position: contactForm.position || null,
            phone: contactForm.phone || null,
            email: contactForm.email || null
          })
          .select('*')
          .single()
        
        if (error) throw error
        
        if (data) {
          // Update contacts list and select the new contact
          setContacts([data, ...contacts])
          setContactId(data.id)
          setShowContactModal(false)
        }
      } else {
        // Edit mode
        if (!contactId) return
        
        const { data, error } = await supabase
          .from('contacts')
          .update({
            full_name: contactForm.full_name,
            position: contactForm.position || null,
            phone: contactForm.phone || null,
            email: contactForm.email || null
          })
          .eq('id', contactId)
          .select('*')
          .single()
        
        if (error) throw error
        
        if (data) {
          // Update contact in the list
          setContacts(contacts.map(c => c.id === data.id ? data : c))
          setShowContactModal(false)
        }
      }
    } catch (err: any) {
      console.error('Error saving contact:', err)
      setError(err.message || 'An error occurred while saving contact')
    }
  }
  
  async function handleDeleteContact() {
    if (!contactId || !window.confirm('Are you sure you want to delete this contact?')) {
      return
    }
    
    try {
      setError(null)
      const supabase = createClient()
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
      
      if (error) throw error
      
      // Update contacts list and clear selection
      setContacts(contacts.filter(c => c.id !== contactId))
      setContactId('')
      
      // If there are other contacts, select the first one
      if (contacts.length > 1) {
        const remainingContacts = contacts.filter(c => c.id !== contactId)
        if (remainingContacts.length > 0) {
          setContactId(remainingContacts[0].id)
        }
      }
    } catch (err: any) {
      console.error('Error deleting contact:', err)
      setError(err.message || 'An error occurred while deleting contact')
    }
  }
  
  // Order item helpers
  function openAddItemModal() {
    setItemForm({
      commodity_id: '',
      quantity: 1,
      unit_id: '',
      commodity_description: ''
    })
    setItemMode('add')
    setShowItemModal(true)
  }
  
  function openEditItemModal(index: number) {
    const item = orderItems[index]
    setItemForm({ ...item })
    setItemMode('edit')
    setEditingItemIndex(index)
    setShowItemModal(true)
  }
  
  function handleSaveItem() {
    try {
      // Validate form
      if (!itemForm.commodity_id) {
        throw new Error('Please select a commodity')
      }
      if (!itemForm.unit_id) {
        throw new Error('Please select a unit')
      }
      if (itemForm.quantity <= 0) {
        throw new Error('Quantity must be greater than 0')
      }
      
      // Find selected commodity and unit for display
      const selectedCommodity = commodities.find(c => c.id === itemForm.commodity_id)
      const selectedUnit = units.find(u => u.id === itemForm.unit_id)
      
      if (!selectedCommodity || !selectedUnit) {
        throw new Error('Selected commodity or unit not found')
      }
      
      const newItem: OrderItem = {
        ...itemForm,
        commodity: selectedCommodity,
        unit: selectedUnit,
        isNew: true
      }
      
      if (itemMode === 'add') {
        // Add new item
        setOrderItems([...orderItems, newItem])
      } else if (itemMode === 'edit' && editingItemIndex !== null) {
        // Update existing item
        const updatedItems = [...orderItems]
        updatedItems[editingItemIndex] = newItem
        setOrderItems(updatedItems)
      }
      
      // Close modal
      setShowItemModal(false)
      setEditingItemIndex(null)
    } catch (err: any) {
      alert(err.message)
    }
  }
  
  function handleDeleteItem(index: number) {
    if (confirm('Are you sure you want to delete this item?')) {
      const updatedItems = [...orderItems]
      updatedItems.splice(index, 1)
      setOrderItems(updatedItems)
    }
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8" style={{ overflow: 'visible' }}>
        <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 text-red-700">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Order Preview Section */}
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-1">Order Number</h2>
              <div className="text-2xl font-bold text-blue-600">{previewOrderNumber}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6" style={{ overflow: 'visible', isolation: 'isolate' }}>
          {/* Order Type & Details Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label id="orderTypeLabel" className="block text-sm font-medium text-gray-700 mb-1">
                  Order Type
                </label>
                <Listbox value={type} onChange={(selectedType) => handleTypeChange(selectedType)}>
                  <div className="relative" style={{ position: "relative", zIndex: 60, overflow: "visible", transform: "translate3d(0,0,0)" }}>
                    <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <span className="block truncate">
                        {type === 'international' ? 'International (I)' : 'Local (L)'}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-[999] mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" style={{ position: 'fixed', top: 'auto', left: 'auto', width: 'auto', maxWidth: '300px', overflowY: 'auto' }}>
                        <Listbox.Option
                          value="international"
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? 'bg-blue-600 text-white' : 'text-gray-900'
                            }`
                          }
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                International (I)
                              </span>
                              {selected ? (
                                <span
                                  className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                    active ? 'text-white' : 'text-blue-600'
                                  }`}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                        <Listbox.Option
                          value="local"
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? 'bg-blue-600 text-white' : 'text-gray-900'
                            }`
                          }
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                Local (L)
                              </span>
                              {selected ? (
                                <span
                                  className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                    active ? 'text-white' : 'text-blue-600'
                                  }`}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>
              
              <div>
                <label id="departmentLabel" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <Listbox value={department} onChange={(selectedDepartment) => handleDepartmentChange(selectedDepartment)}>
                  <div className="relative" style={{ position: "relative", zIndex: 60, overflow: "visible", transform: "translate3d(0,0,0)" }}>
                    <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <span className="block truncate">
                        {department === 'marine' ? 'Marine (MR)' : 
                         department === 'agri' ? 'Agriculture (AG)' : 
                         'Consumer Goods (CG)'}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-[999] mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" style={{ position: 'fixed', top: 'auto', left: 'auto', width: 'auto', maxWidth: '300px', overflowY: 'auto' }}>
                        <Listbox.Option
                          value="marine"
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? 'bg-blue-600 text-white' : 'text-gray-900'
                            }`
                          }
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                Marine (MR)
                              </span>
                              {selected ? (
                                <span
                                  className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                    active ? 'text-white' : 'text-blue-600'
                                  }`}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                        <Listbox.Option
                          value="agri"
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? 'bg-blue-600 text-white' : 'text-gray-900'
                            }`
                          }
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                Agriculture (AG)
                              </span>
                              {selected ? (
                                <span
                                  className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                    active ? 'text-white' : 'text-blue-600'
                                  }`}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                        <Listbox.Option
                          value="consumer_goods"
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? 'bg-blue-600 text-white' : 'text-gray-900'
                            }`
                          }
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                Consumer Goods (CG)
                              </span>
                              {selected ? (
                                <span
                                  className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                    active ? 'text-white' : 'text-blue-600'
                                  }`}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 pl-3 pr-10 text-sm h-[38px]"
                  required
                />
              </div>

              <div>
                <label id="clientRefCodeLabel" htmlFor="clientRefCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number (Optional)
                </label>
                <input
                  type="text"
                  id="clientRefCode"
                  value={clientRefCode}
                  onChange={(e) => setClientRefCode(e.target.value)}
                  placeholder="Enter client reference number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 pl-3 pr-10 text-sm h-[38px]"
                />
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label id="clientLabel" className="block text-sm font-medium text-gray-700 mb-1">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-grow">
                      <Combobox value={clients.find(c => c.id === clientId) || null} onChange={(client: Client | null) => {
                        if (client) {
                          setClientId(client.id);
                          // Load contacts for this client
                          if (client.id) {
                            loadClientContacts(client.id);
                          }
                        } else {
                          setClientId('');
                          setContacts([]);
                          setContactId('');
                        }
                      }}>
                        <div className="relative" style={{ position: "relative", zIndex: 50, overflow: "visible", transform: "translate3d(0,0,0)" }}>
                          <div className="relative w-full cursor-default overflow-visible rounded-md border border-gray-300 bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300" style={{ position: "relative", overflow: "visible" }}>
                            <Combobox.Input
                              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                              displayValue={(client: Client | null) => client?.name || ''}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setClientQuery(event.target.value)}
                              placeholder="Select Client"
                              required
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
                            afterLeave={() => setClientQuery('')}
                          >
                            <Combobox.Options className="fixed z-[999] mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" style={{ position: 'fixed', top: 'auto', left: 'auto', width: 'auto', maxWidth: '300px', overflowY: 'auto' }}>
                              {filteredClients.length === 0 && clientQuery !== '' ? (
                                <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                                  Nothing found.
                                </div>
                              ) : (
                                filteredClients.map((client) => (
                                  <Combobox.Option
                                    key={client.id}
                                    className={({ active }: { active: boolean }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                      }`
                                    }
                                    value={client}
                                  >
                                    {({ selected, active }: { selected: boolean; active: boolean }) => (
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
                                              active ? 'text-white' : 'text-blue-600'
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
                    
                    <Menu as="div" className="relative inline-block text-left">
                      <div>
                        <Menu.Button className="mt-1 p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200">
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
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={openAddClientModal}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex items-center w-full px-4 py-2 text-sm`}
                                >
                                  <PlusIcon className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
                                  Add New Client
                                </button>
                              )}
                            </Menu.Item>
                            
                            {clientId && (
                              <>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={openEditClientModal}
                                      className={`${
                                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                      } flex items-center w-full px-4 py-2 text-sm`}
                                    >
                                      <PencilSquareIcon className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" />
                                      Edit Client
                                    </button>
                                  )}
                                </Menu.Item>
                                
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={handleDeleteClient}
                                      className={`${
                                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                      } flex items-center w-full px-4 py-2 text-sm`}
                                    >
                                      <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                                      Delete Client
                                    </button>
                                  )}
                                </Menu.Item>
                              </>
                            )}
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
                
                <div>
                  <label id="contactLabel" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-grow">
                      <Combobox value={contacts.find(c => c.id === contactId) || null} onChange={(contact: Contact | null) => {
                        setContactId(contact?.id || '')
                      }}>
                        <div className="relative" style={{ position: "relative", zIndex: 40, overflow: "visible", transform: "translate3d(0,0,0)" }}>
                          <div className="relative w-full cursor-default overflow-visible rounded-md border border-gray-300 bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300" style={{ position: "relative", overflow: "visible" }}>
                            <Combobox.Input
                              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                              displayValue={(contact: Contact | null) => 
                                contact 
                                  ? `${contact.full_name}${contact.position ? ` (${contact.position})` : ''}`
                                  : ''
                              }
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setContactQuery(event.target.value)}
                              placeholder={!clientId ? "Select a client first" : contacts.length === 0 ? "No contacts available" : "Select Contact"}
                              disabled={!clientId || contacts.length === 0}
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
                            afterLeave={() => setContactQuery('')}
                          >
                            <Combobox.Options className="fixed z-[999] mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" style={{ position: 'fixed', top: 'auto', left: 'auto', width: 'auto', maxWidth: '300px', overflowY: 'auto' }}>
                              {filteredContacts.length === 0 ? (
                                <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                                  {contactQuery !== '' ? 'No matching contacts.' : 'No contacts available.'}
                                </div>
                              ) : (
                                filteredContacts.map((contact) => (
                                  <Combobox.Option
                                    key={contact.id}
                                    className={({ active }: { active: boolean }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                      }`
                                    }
                                    value={contact}
                                  >
                                    {({ selected, active }: { selected: boolean; active: boolean }) => (
                                      <>
                                        <span
                                          className={`block truncate ${
                                            selected ? 'font-medium' : 'font-normal'
                                          }`}
                                        >
                                          {contact.full_name} {contact.position ? `(${contact.position})` : ''}
                                        </span>
                                        {selected ? (
                                          <span
                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                              active ? 'text-white' : 'text-blue-600'
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
                    
                    <Menu as="div" className="relative inline-block text-left">
                      <div>
                        <Menu.Button className="mt-1 p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200">
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
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openAddContactModal();
                                  }}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex items-center w-full px-4 py-2 text-sm`}
                                >
                                  <PlusIcon className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
                                  Add New Contact
                                </button>
                              )}
                            </Menu.Item>
                            
                            {contactId && (
                              <>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openEditContactModal();
                                      }}
                                      className={`${
                                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                      } flex items-center w-full px-4 py-2 text-sm`}
                                    >
                                      <PencilSquareIcon className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" />
                                      Edit Contact
                                    </button>
                                  )}
                                </Menu.Item>
                                
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteContact();
                                      }}
                                      className={`${
                                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                      } flex items-center w-full px-4 py-2 text-sm`}
                                    >
                                      <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                                      Delete Contact
                                    </button>
                                  )}
                                </Menu.Item>
                              </>
                            )}
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Shipping and Additional Shipping Information */}
          <div className="mt-6 grid grid-cols-5 gap-6" style={{ isolation: 'isolate', perspective: 'none', overflow: 'visible' }}>
            <div className="col-span-1">
              <label id="shipperLabel" className="block text-sm font-medium text-gray-700 mb-1">
                Shipper (Optional)
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-grow">
                  <Combobox value={shippers.find(s => s.id === shipperId) || null} onChange={(shipper: Shipper | null) => {
                    setShipperId(shipper?.id || '');
                  }}>
                    <div className="relative">
                      <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300">
                        <Combobox.Input
                          className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                          displayValue={(shipper: Shipper | null) => shipper?.name || ''}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setShipperQuery(event.target.value)}
                          placeholder="Select Shipper (Optional)"
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
                        afterLeave={() => setShipperQuery('')}
                      >
                        <Combobox.Options className="fixed z-[999] mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" style={{ position: 'fixed', top: 'auto', left: 'auto', width: 'auto', maxWidth: '300px', overflowY: 'auto' }}>
                          {filteredShippers.length === 0 && shipperQuery !== '' ? (
                            <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                              Nothing found.
                            </div>
                          ) : (
                            filteredShippers.map((shipper) => (
                              <Combobox.Option
                                key={shipper.id}
                                className={({ active }: { active: boolean }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                  }`
                                }
                                value={shipper}
                              >
                                {({ selected, active }: { selected: boolean; active: boolean }) => (
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
                                          active ? 'text-white' : 'text-blue-600'
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
                
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button className="mt-1 p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200">
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
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={openAddShipperModal}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex items-center w-full px-4 py-2 text-sm`}
                            >
                              <PlusIcon className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
                              Add New Shipper
                            </button>
                          )}
                        </Menu.Item>
                        
                        {shipperId && (
                          <>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={openEditShipperModal}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex items-center w-full px-4 py-2 text-sm`}
                                >
                                  <PencilSquareIcon className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" />
                                  Edit Shipper
                                </button>
                              )}
                            </Menu.Item>
                            
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={handleDeleteShipper}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex items-center w-full px-4 py-2 text-sm`}
                                >
                                  <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                                  Delete Shipper
                                </button>
                              )}
                            </Menu.Item>
                          </>
                        )}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
            
            <div className="col-span-1">
              <label id="buyerLabel" className="block text-sm font-medium text-gray-700 mb-1">
                Buyer (Optional)
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-grow">
                  <Combobox value={buyers.find(b => b.id === buyerId) || null} onChange={(buyer: Buyer | null) => {
                    setBuyerId(buyer?.id || '');
                  }}>
                    <div className="relative">
                      <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300">
                        <Combobox.Input
                          className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                          displayValue={(buyer: Buyer | null) => buyer?.name || ''}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setBuyerQuery(event.target.value)}
                          placeholder="Select Buyer (Optional)"
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
                        afterLeave={() => setBuyerQuery('')}
                      >
                        <Combobox.Options className="fixed z-[999] mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" style={{ position: 'fixed', top: 'auto', left: 'auto', width: 'auto', maxWidth: '300px', overflowY: 'auto' }}>
                          {filteredBuyers.length === 0 && buyerQuery !== '' ? (
                            <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                              Nothing found.
                            </div>
                          ) : (
                            filteredBuyers.map((buyer) => (
                              <Combobox.Option
                                key={buyer.id}
                                className={({ active }: { active: boolean }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                  }`
                                }
                                value={buyer}
                              >
                                {({ selected, active }: { selected: boolean; active: boolean }) => (
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
                                          active ? 'text-white' : 'text-blue-600'
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
                
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button className="mt-1 p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200">
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
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={openAddBuyerModal}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex items-center w-full px-4 py-2 text-sm`}
                            >
                              <PlusIcon className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
                              Add New Buyer
                            </button>
                          )}
                        </Menu.Item>
                        
                        {buyerId && (
                          <>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={openEditBuyerModal}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex items-center w-full px-4 py-2 text-sm`}
                                >
                                  <PencilSquareIcon className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" />
                                  Edit Buyer
                                </button>
                              )}
                            </Menu.Item>
                            
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={handleDeleteBuyer}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex items-center w-full px-4 py-2 text-sm`}
                                >
                                  <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                                  Delete Buyer
                                </button>
                              )}
                            </Menu.Item>
                          </>
                        )}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
            
            <div className="col-span-1">
              <label id="vesselCarrierLabel" className="block text-sm font-medium text-gray-700 mb-1">
                Vessel/Carrier (Optional)
              </label>
              <input
                type="text"
                id="vesselCarrier"
                value={vessel}
                onChange={(e) => setVessel(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter vessel or carrier"
              />
            </div>
            
            <div className="col-span-1">
              <label id="billOfLadingLabel" className="block text-sm font-medium text-gray-700 mb-1">
                Bill of Lading (Optional)
              </label>
              <input
                type="text"
                id="billOfLading"
                value={billOfLading}
                onChange={(e) => setBillOfLading(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter bill of lading number"
              />
            </div>
            
            <div className="col-span-1">
              <label id="billOfLadingDateLabel" className="block text-sm font-medium text-gray-700 mb-1">
                Bill of Lading Date (Optional)
              </label>
              <input
                type="date"
                id="billOfLadingDate"
                value={billOfLadingDate}
                onChange={(e) => setBillOfLadingDate(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6 mt-6">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => router.push('/dashboard/orders')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Shipper Modal */}
      {showShipperModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {shipperMode === 'add' ? 'Add New Shipper' : 'Edit Shipper'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="shipperName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="shipperName"
                  value={shipperForm.name}
                  onChange={(e) => setShipperForm({...shipperForm, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="shipperAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="shipperAddress"
                  value={shipperForm.address}
                  onChange={(e) => setShipperForm({...shipperForm, address: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="shipperPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="shipperPhone"
                  value={shipperForm.phone}
                  onChange={(e) => setShipperForm({...shipperForm, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="shipperEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="shipperEmail"
                  value={shipperForm.email}
                  onChange={(e) => setShipperForm({...shipperForm, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowShipperModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveShipper}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {shipperMode === 'add' ? 'Add Shipper' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Buyer Modal */}
      {showBuyerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {buyerMode === 'add' ? 'Add New Buyer' : 'Edit Buyer'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="buyerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="buyerName"
                  value={buyerForm.name}
                  onChange={(e) => setBuyerForm({...buyerForm, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="buyerAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="buyerAddress"
                  value={buyerForm.address}
                  onChange={(e) => setBuyerForm({...buyerForm, address: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="buyerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="buyerPhone"
                  value={buyerForm.phone}
                  onChange={(e) => setBuyerForm({...buyerForm, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="buyerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="buyerEmail"
                  value={buyerForm.email}
                  onChange={(e) => setBuyerForm({...buyerForm, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowBuyerModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBuyer}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {buyerMode === 'add' ? 'Add Buyer' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {clientMode === 'add' ? 'Add New Client' : 'Edit Client'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="clientName"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="clientAddress"
                  value={clientForm.address}
                  onChange={(e) => setClientForm({...clientForm, address: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="clientPhone"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="clientEmail"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-700 mb-3">Add Contact (Optional)</h4>
                
                <div className="space-y-3">
                  <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      value={clientForm.contact_name}
                      onChange={(e) => setClientForm({...clientForm, contact_name: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="contactPosition" className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      id="contactPosition"
                      value={clientForm.contact_position}
                      onChange={(e) => setClientForm({...clientForm, contact_position: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="contactPhone"
                      value={clientForm.contact_phone}
                      onChange={(e) => setClientForm({...clientForm, contact_phone: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      value={clientForm.contact_email}
                      onChange={(e) => setClientForm({...clientForm, contact_email: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClient}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {clientMode === 'add' ? 'Add Client' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {contactMode === 'add' ? 'Add New Contact' : 'Edit Contact'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="contactFullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contactFullName"
                  value={contactForm.full_name}
                  onChange={(e) => setContactForm({...contactForm, full_name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="contactPosition" className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  id="contactPosition"
                  value={contactForm.position}
                  onChange={(e) => setContactForm({...contactForm, position: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveContact}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {contactMode === 'add' ? 'Add Contact' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* After the last form section, add this new section */}
      <div className="mt-8 bg-white border rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold border-b pb-3 mb-4 flex justify-between items-center">
          <span>Order Items</span>
          <button
            type="button"
            onClick={openAddItemModal}
            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Item
          </button>
        </h2>
        
        {orderItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No items added yet. Click "Add Item" to add products to this order.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commodity Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderItems.map((item, index) => (
                  <tr key={index} className={item.isNew ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.commodity?.name}</div>
                      {item.commodity?.description && (
                        <div className="text-xs text-gray-500">{item.commodity.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.unit?.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {item.commodity_description || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditItemModal(index)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Submit button at the bottom */}
      <div className="mt-8 flex justify-end">
        <button
          type="button" 
          onClick={() => router.push('/dashboard/orders')}
          className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || orderItems.length === 0}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Order...' : 'Create Order'}
        </button>
      </div>
      
      {/* Order Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {itemMode === 'add' ? 'Add New Item' : 'Edit Item'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commodity <span className="text-red-500">*</span>
                </label>
                <Combobox value={commodities.find(c => c.id === itemForm.commodity_id) || null} onChange={(commodity: Commodity | null) => {
                  setItemForm({...itemForm, commodity_id: commodity?.id || ''});
                }}>
                  <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300">
                      <Combobox.Input
                        className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                        displayValue={(commodity: Commodity | null) => commodity?.name || ''}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCommodityQuery(event.target.value)}
                        placeholder="Select Commodity"
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
                      afterLeave={() => setCommodityQuery('')}
                    >
                      <Combobox.Options className="absolute z-[999] mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {filteredCommodities.length === 0 && commodityQuery !== '' ? (
                          <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                            Nothing found.
                          </div>
                        ) : (
                          filteredCommodities.map((commodity) => (
                            <Combobox.Option
                              key={commodity.id}
                              className={({ active }: { active: boolean }) =>
                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                  active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                }`
                              }
                              value={commodity}
                            >
                              {({ selected, active }: { selected: boolean; active: boolean }) => (
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
                                        active ? 'text-white' : 'text-blue-600'
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({...itemForm, quantity: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <Combobox value={units.find(u => u.id === itemForm.unit_id) || null} onChange={(unit: Unit | null) => {
                    setItemForm({...itemForm, unit_id: unit?.id || ''});
                  }}>
                    <div className="relative">
                      <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300">
                        <Combobox.Input
                          className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                          displayValue={(unit: Unit | null) => unit?.name || ''}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setUnitQuery(event.target.value)}
                          placeholder="Select Unit"
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
                        afterLeave={() => setUnitQuery('')}
                      >
                        <Combobox.Options className="fixed z-[999] mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" style={{ position: 'fixed', top: 'auto', left: 'auto', width: 'auto', maxWidth: '300px', overflowY: 'auto' }}>
                          {filteredUnits.length === 0 && unitQuery !== '' ? (
                            <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                              Nothing found.
                            </div>
                          ) : (
                            filteredUnits.map((unit) => (
                              <Combobox.Option
                                key={unit.id}
                                className={({ active }: { active: boolean }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                  }`
                                }
                                value={unit}
                              >
                                {({ selected, active }: { selected: boolean; active: boolean }) => (
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
                                          active ? 'text-white' : 'text-blue-600'
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commodity Description
                </label>
                <textarea
                  rows={3}
                  value={itemForm.commodity_description || ''}
                  onChange={(e) => setItemForm({...itemForm, commodity_description: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {itemMode === 'add' ? 'Add Item' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 