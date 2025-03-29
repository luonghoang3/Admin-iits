'use client'

import { useState, useEffect, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Combobox, Transition, Listbox, Menu } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, EllipsisVerticalIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid'
import { createClient } from '@/utils/supabase/client'
import { fetchOrder, updateOrder, fetchClients } from '@/utils/supabase/client'
import { fetchShippers, fetchBuyers, fetchShipper, createShipper, updateShipper, deleteShipper, fetchBuyer, createBuyer, updateBuyer, deleteBuyer } from '@/utils/supabase/shipping'

interface Client {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
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

interface Shipper {
  id: string
  name: string
}

interface Buyer {
  id: string
  name: string
}

interface Order {
  id: string
  order_number: string
  client_id: string
  contact_id?: string | null
  shipper_id?: string | null
  buyer_id?: string | null
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
  vessel_carrier?: string
  bill_of_lading?: string
  bill_of_lading_date?: string
}

export default function EditOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const [clients, setClients] = useState<Client[]>([])
  const [shippers, setShippers] = useState<Shipper[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Order State
  const [orderType, setOrderType] = useState<'import' | 'export'>('import')
  const [department, setDepartment] = useState<'marine' | 'agri' | 'consumer_goods'>('marine')
  const [status, setStatus] = useState<'draft' | 'confirmed' | 'completed' | 'cancelled'>('draft')
  const [orderDate, setOrderDate] = useState('')
  const [refNumber, setRefNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [vessel, setVessel] = useState('')
  const [billOfLading, setBillOfLading] = useState('')
  const [billOfLadingDate, setBillOfLadingDate] = useState('')
  
  // Client/Contact State
  const [clientId, setClientId] = useState('')
  const [clientContacts, setClientContacts] = useState<Contact[]>([])
  const [contactId, setContactId] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactQuery, setContactQuery] = useState('')
  const [clientQuery, setClientQuery] = useState('')
  
  // Shipper/Buyer State
  const [shipperId, setShipperId] = useState<string | null>(null)
  const [buyerId, setBuyerId] = useState<string | null>(null)
  
  // Client modal and form state
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
  
  // Contact modal and form state
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactMode, setContactMode] = useState<'add' | 'edit'>('add')
  const [contactForm, setContactForm] = useState({
    full_name: '',
    position: '',
    phone: '',
    email: ''
  })
  
  // Shipper modal and form state
  const [showShipperModal, setShowShipperModal] = useState(false)
  const [shipperMode, setShipperMode] = useState<'add' | 'edit'>('add')
  const [shipperForm, setShipperForm] = useState({
    name: '',
    address: '',
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
  
  // Add query states for search
  const [shipperQuery, setShipperQuery] = useState('')
  const [buyerQuery, setBuyerQuery] = useState('') 
  
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
          console.log('Loaded clients:', clientData)
          setClients(clientData)
        }
        
        // Fetch shippers for dropdown
        const { shippers: shipperData, error: shippersError } = await fetchShippers()
        
        if (shippersError) {
          console.error('Could not load shippers:', shippersError)
        } else if (shipperData) {
          setShippers(shipperData)
        }
        
        // Fetch buyers for dropdown
        const { buyers: buyerData, error: buyersError } = await fetchBuyers()
        
        if (buyersError) {
          console.error('Could not load buyers:', buyersError)
        } else if (buyerData) {
          setBuyers(buyerData)
        }
        
        // Fetch order details
        const { order, error: orderError } = await fetchOrder(orderId)
        
        if (orderError) {
          setError(`Could not load order: ${orderError}`)
        } else if (order) {
          // Set form values
          setClientId(order.client_id)
          setOrderType(order.type === 'international' ? 'import' : 'export')
          setDepartment(order.department)
          setStatus(order.status)
          setOrderDate(order.order_date ? order.order_date.split('T')[0] : '')
          setRefNumber(order.client_ref_code || '')
          setNotes(order.notes || '')
          setOrderNumber(order.order_number)
          setShipperId(order.shipper_id || null)
          setBuyerId(order.buyer_id || null)
          setVessel(order.vessel_carrier || '')
          setBillOfLading(order.bill_of_lading || '')
          setBillOfLadingDate(order.bill_of_lading_date ? order.bill_of_lading_date.split('T')[0] : '')
          
          // Fetch latest contacts for the client
          if (order.client_id) {
            try {
              const { data: contacts, error: contactsError } = await supabase
                .from('contacts')
                .select('*')
                .eq('client_id', order.client_id)
                .order('created_at', { ascending: false });
                
              if (contactsError) throw contactsError;
              
              setClientContacts(contacts || []);
              
              // If there's a contact_id in the order, use it, otherwise select the most recent
              if (order.contact_id) {
                setContactId(order.contact_id);
              } else if (contacts && contacts.length > 0) {
                setContactId(contacts[0].id);
              } else {
                setContactId(null);
              }
            } catch (err: any) {
              console.error('Error fetching client contacts:', err);
            }
          }
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
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setClientContacts(contacts || []);
        
        // Automatically select the newest contact if available
        if (contacts && contacts.length > 0) {
          setContactId(contacts[0].id);
        }
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
        shipper_id: shipperId,
        buyer_id: buyerId,
        status,
        order_date: orderDate,
        client_ref_code: refNumber || null,
        notes: notes || null,
        vessel_carrier: vessel || null,
        bill_of_lading: billOfLading || null,
        bill_of_lading_date: billOfLadingDate || null
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
  
  // Shipper management functions
  function openAddShipperModal() {
    setShipperForm({
      name: '',
      address: '',
      phone: '',
      email: ''
    })
    setShipperMode('add')
    setShowShipperModal(true)
  }
  
  function openEditShipperModal() {
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
  
  async function handleDeleteShipper() {
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
        setShipperId(null)
      }
    } catch (err: any) {
      console.error('Error deleting shipper:', err)
      setError(err.message || 'An error occurred while deleting shipper')
    }
  }
  
  // Buyer management functions
  function openAddBuyerModal() {
    setBuyerForm({
      name: '',
      address: '',
      phone: '',
      email: ''
    })
    setBuyerMode('add')
    setShowBuyerModal(true)
  }
  
  function openEditBuyerModal() {
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
  
  async function handleDeleteBuyer() {
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
        setBuyerId(null)
      }
    } catch (err: any) {
      console.error('Error deleting buyer:', err)
      setError(err.message || 'An error occurred while deleting buyer')
    }
  }
  
  // Client management functions
  function openAddClientModal() {
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
    
    // Hide the dropdown menu
    const menuElement = document.getElementById('client-menu');
    if (menuElement) {
      menuElement.classList.add('hidden');
    }
  }
  
  function openEditClientModal() {
    if (!clientId) {
      console.log('No client ID selected')
      return
    }
    
    // Hide the menu when clicking Edit
    const menuElement = document.getElementById('client-menu');
    if (menuElement) {
      menuElement.classList.add('hidden');
    }
    
    console.log('Opening edit modal for client ID:', clientId)
    const currentClient = clients.find(c => c.id === clientId)
    if (!currentClient) {
      console.log('Client not found in clients list', clients)
      return
    }
    
    console.log('Found client in list:', currentClient)
    
    // Set known data from the client list
    setClientForm({
      name: currentClient.name || '',
      address: currentClient.address || '',
      phone: currentClient.phone || '',
      email: currentClient.email || '',
      contact_name: '',
      contact_position: '',
      contact_phone: '',
      contact_email: ''
    })
    setClientMode('edit')
    setShowClientModal(true)
    
    // Optionally fetch more data if needed
    const fetchAdditionalDetails = async () => {
      try {
        console.log('Fetching client details for ID:', clientId)
        const supabase = createClient()
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single()
        
        console.log('Supabase response:', { data, error })
        
        if (error) throw error
        
        if (data) {
          // Update with complete data from database
          setClientForm(prevForm => ({
            ...prevForm,
            name: data.name || prevForm.name,
            address: data.address || prevForm.address,
            phone: data.phone || prevForm.phone,
            email: data.email || prevForm.email
          }))
        }
      } catch (err: any) {
        console.error('Error fetching additional client details:', err)
        // Don't set error since we already have basic data
      }
    }
    
    // Fetch additional data in background
    fetchAdditionalDetails()
  }
  
  async function handleSaveClient() {
    try {
      setError(null)
      const supabase = createClient()
      
      if (clientMode === 'add') {
        // Add new client
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: clientForm.name,
            address: clientForm.address || null,
            phone: clientForm.phone || null,
            email: clientForm.email || null
          })
          .select('*')
          .single()
        
        if (clientError) throw clientError
        
        if (clientData) {
          // Add contact if provided
          if (clientForm.contact_name) {
            const { error: contactError } = await supabase
              .from('contacts')
              .insert({
                client_id: clientData.id,
                full_name: clientForm.contact_name,
                position: clientForm.contact_position || null,
                phone: clientForm.contact_phone || null,
                email: clientForm.contact_email || null
              })
            
            if (contactError) throw contactError
          }
          
          // Update clients list and select the new client
          setClients([...clients, clientData])
          setClientId(clientData.id)
          
          // Load contacts for this client
          handleClientChange({ target: { value: clientData.id } } as React.ChangeEvent<HTMLSelectElement>)
          
          setShowClientModal(false)
        }
      } else {
        // Edit mode
        if (!clientId) return
        
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .update({
            name: clientForm.name,
            address: clientForm.address || null,
            phone: clientForm.phone || null,
            email: clientForm.email || null
          })
          .eq('id', clientId)
          .select('*')
          .single()
        
        if (clientError) throw clientError
        
        if (clientData) {
          // Update clients list
          setClients(clients.map(c => c.id === clientData.id ? clientData : c))
          setShowClientModal(false)
        }
      }
    } catch (err: any) {
      console.error('Error saving client:', err)
      setError(err.message || 'An error occurred while saving client')
    }
  }
  
  async function handleDeleteClient() {
    if (!clientId || !window.confirm('Are you sure you want to delete this client?')) {
      return
    }
    
    // Hide the menu when confirming delete
    const menuElement = document.getElementById('client-menu');
    if (menuElement) {
      menuElement.classList.add('hidden');
    }
    
    try {
      setError(null)
      const supabase = createClient()
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
      
      if (error) throw error
      
      // Update clients list and clear selection
      setClients(clients.filter(c => c.id !== clientId))
      setClientId('')
      setClientContacts([])
      setContactId(null)
      
    } catch (err: any) {
      console.error('Error deleting client:', err)
      setError(err.message || 'An error occurred while deleting client')
    }
  }
  
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
    
    const currentContact = clientContacts.find(c => c.id === contactId)
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
          setClientContacts([data, ...clientContacts])
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
          setClientContacts(clientContacts.map(c => c.id === data.id ? data : c))
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
      setClientContacts(clientContacts.filter(c => c.id !== contactId))
      setContactId(null)
      
      // If there are other contacts, select the first one
      if (clientContacts.length > 1) {
        const remainingContacts = clientContacts.filter(c => c.id !== contactId)
        if (remainingContacts.length > 0) {
          setContactId(remainingContacts[0].id)
        }
      }
    } catch (err: any) {
      console.error('Error deleting contact:', err)
      setError(err.message || 'An error occurred while deleting contact')
    }
  }
  
  // Filter data for comboboxes
  const filteredContacts = contactQuery === ''
    ? contacts
    : contacts.filter((contact) =>
        contact.full_name &&
        contact.full_name.toLowerCase().includes(contactQuery.toLowerCase())
      )
  
  const filteredClients = clientQuery === ''
    ? clients
    : clients.filter((client) =>
        client.name && 
        client.name.toLowerCase().includes(clientQuery.toLowerCase())
      )
      
  const filteredShippers = shipperQuery === ''
    ? shippers
    : shippers.filter((shipper) =>
        shipper.name && 
        shipper.name.toLowerCase().includes(shipperQuery.toLowerCase())
      )
      
  const filteredBuyers = buyerQuery === ''
    ? buyers
    : buyers.filter((buyer) =>
        buyer.name && 
        buyer.name.toLowerCase().includes(buyerQuery.toLowerCase())
      )
  
  // Function to toggle client menu
  function toggleClientMenu() {
    const menuElement = document.getElementById('client-menu');
    if (menuElement) {
      menuElement.classList.toggle('hidden');
    }
  }
  
  // Function to toggle contact menu
  function toggleContactMenu() {
    const menuElement = document.getElementById('contact-menu');
    if (menuElement) {
      menuElement.classList.toggle('hidden');
    }
  }
  
  // Function to toggle shipper menu
  function toggleShipperMenu() {
    const menuElement = document.getElementById('shipper-menu');
    if (menuElement) {
      menuElement.classList.toggle('hidden');
    }
  }
  
  // Function to toggle buyer menu
  function toggleBuyerMenu() {
    const menuElement = document.getElementById('buyer-menu');
    if (menuElement) {
      menuElement.classList.toggle('hidden');
    }
  }
  
  // Add click outside listener for menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Client menu
      const clientMenuElement = document.getElementById('client-menu');
      const clientMenuButton = document.getElementById('client-menu-button');
      
      if (
        clientMenuElement && 
        !clientMenuElement.classList.contains('hidden') && 
        !clientMenuElement.contains(event.target as Node) && 
        clientMenuButton && 
        !clientMenuButton.contains(event.target as Node)
      ) {
        clientMenuElement.classList.add('hidden');
      }
      
      // Contact menu
      const contactMenuElement = document.getElementById('contact-menu');
      const contactMenuButton = document.getElementById('contact-menu-button');
      
      if (
        contactMenuElement && 
        !contactMenuElement.classList.contains('hidden') && 
        !contactMenuElement.contains(event.target as Node) && 
        contactMenuButton && 
        !contactMenuButton.contains(event.target as Node)
      ) {
        contactMenuElement.classList.add('hidden');
      }
      
      // Shipper menu
      const shipperMenuElement = document.getElementById('shipper-menu');
      const shipperMenuButton = document.getElementById('shipper-menu-button');
      
      if (
        shipperMenuElement && 
        !shipperMenuElement.classList.contains('hidden') && 
        !shipperMenuElement.contains(event.target as Node) && 
        shipperMenuButton && 
        !shipperMenuButton.contains(event.target as Node)
      ) {
        shipperMenuElement.classList.add('hidden');
      }
      
      // Buyer menu
      const buyerMenuElement = document.getElementById('buyer-menu');
      const buyerMenuButton = document.getElementById('buyer-menu-button');
      
      if (
        buyerMenuElement && 
        !buyerMenuElement.classList.contains('hidden') && 
        !buyerMenuElement.contains(event.target as Node) && 
        buyerMenuButton && 
        !buyerMenuButton.contains(event.target as Node)
      ) {
        buyerMenuElement.classList.add('hidden');
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-100" style={{ overflow: 'visible' }}>
      <main className="py-10" style={{ overflow: 'visible' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" style={{ overflow: 'visible' }}>
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg text-gray-500">Loading...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 overflow-visible" style={{ minHeight: 'auto', height: 'auto', maxHeight: 'none', position: 'relative', overflow: 'visible', isolation: 'isolate' }}>
              <div className="bg-white shadow sm:rounded-lg overflow-visible" style={{ minHeight: 'auto', height: 'auto', maxHeight: 'none', position: 'relative', overflow: 'visible' }}>
                <div className="px-4 py-3 sm:px-5">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    Order Information
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {orderType === 'import' ? 'Import' : 'Export'} • 
                    {department === 'marine' ? ' Marine' : 
                      department === 'agri' ? ' Agriculture' : ' Consumer Goods'}
                  </p>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-3 sm:p-4">
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label id="orderNumberLabel" htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Order Number
                      </label>
                      <input
                        type="text"
                        id="orderNumber"
                        value={orderNumber}
                        disabled
                        className="bg-gray-100 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 pl-3 pr-10 text-sm h-[34px]"
                      />
                    </div>
                    
                    <div>
                      <label id="refNumberLabel" htmlFor="refNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Reference Number (Optional)
                      </label>
                      <input
                        type="text"
                        id="refNumber"
                        value={refNumber}
                        onChange={(e) => setRefNumber(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 pl-3 pr-10 text-sm h-[34px]"
                        placeholder="Enter reference number"
                      />
                    </div>
                    
                    <div>
                      <label id="orderDateLabel" htmlFor="orderDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Order Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="orderDate"
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 pl-3 pr-10 text-sm h-[34px]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label id="statusLabel" className="block text-sm font-medium text-gray-700 mb-1">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <Listbox value={status} onChange={setStatus}>
                        <div className="relative mt-1" style={{ position: "relative", zIndex: 60, overflow: "visible", transform: "translate3d(0,0,0)" }}>
                          <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 h-[34px]">
                            <span className="block truncate">
                              {status === 'draft' ? 'Draft' : 
                                status === 'confirmed' ? 'Confirmed' : 
                                status === 'completed' ? 'Completed' : 'Cancelled'}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-[999] mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" style={{ position: 'fixed', top: 'auto', left: 'auto', width: 'auto', maxWidth: '300px', overflowY: 'auto' }}>
                              {['draft', 'confirmed', 'completed', 'cancelled'].map((statusOption) => (
                                <Listbox.Option
                                  key={statusOption}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                    }`
                                  }
                                  value={statusOption}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {statusOption === 'draft' ? 'Draft' : 
                                          statusOption === 'confirmed' ? 'Confirmed' : 
                                          statusOption === 'completed' ? 'Completed' : 'Cancelled'}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2" style={{ overflow: 'visible', isolation: 'isolate', perspective: 'none' }}>
                      <div>
                        <label id="clientLabel" className="block text-sm font-medium text-gray-700 mb-1">
                          Client <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center space-x-2">
                          <div className="relative flex-grow">
                            <Combobox value={clients.find(c => c.id === clientId) || null} onChange={(client: Client | null) => {
                              if (client) {
                                setClientId(client.id)
                                handleClientChange({ target: { value: client.id } } as React.ChangeEvent<HTMLSelectElement>)
                              } else {
                                setClientId('')
                                setClientContacts([])
                                setContactId(null)
                              }
                            }}>
                              <div className="relative" style={{ position: "relative", zIndex: 50, overflow: "visible", transform: "translate3d(0,0,0)" }}>
                                <div className="relative w-full cursor-default overflow-visible rounded-md border border-gray-300 bg-white text-left shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                  <Combobox.Input
                                    className="w-full border-none h-[34px] py-1.5 pl-3 pr-10 text-sm text-gray-900 focus:ring-0"
                                    onChange={(event) => setClientQuery(event.target.value)}
                                    displayValue={(client: Client | null) => client?.name || ''}
                                    placeholder="Select a client"
                                  />
                                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronUpDownIcon
                                      className="h-4 w-4 text-gray-400"
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
                                      <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                        No client found.
                                      </div>
                                    ) : (
                                      filteredClients.map((client) => (
                                        <Combobox.Option
                                          key={client.id}
                                          className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                              active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                            }`
                                          }
                                          value={client}
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
                          
                          <div className="relative">
                            <button
                              id="client-menu-button"
                              type="button"
                              className="inline-flex items-center justify-center px-1.5 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-[34px] w-[34px]"
                              onClick={toggleClientMenu}
                            >
                              <EllipsisVerticalIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                            
                            <div id="client-menu" className="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                              <div className="py-1">
                                <button
                                  onClick={openAddClientModal}
                                  type="button"
                                  className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                >
                                  <PlusIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                                  Add New Client
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openEditClientModal();
                                  }}
                                  type="button"
                                  disabled={!clientId}
                                  className={`group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${!clientId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <PencilSquareIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                                  Edit Client
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteClient();
                                  }}
                                  type="button"
                                  disabled={!clientId}
                                  className={`group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${!clientId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <TrashIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                                  Delete Client
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label id="contactLabel" className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Person
                        </label>
                        <div className="flex items-center space-x-2">
                          <div className="relative flex-grow">
                            <select
                              id="contact"
                              value={contactId || ''}
                              onChange={(e) => setContactId(e.target.value || null)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-[34px] py-1.5 pl-3 pr-10 text-sm"
                              disabled={!clientId || clientContacts.length === 0}
                            >
                              <option value="">Select a contact</option>
                              {clientContacts.map((contact) => (
                                <option key={contact.id} value={contact.id}>
                                  {contact.full_name} {contact.position ? `(${contact.position})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="relative">
                            <button
                              id="contact-menu-button"
                              type="button"
                              className="inline-flex items-center justify-center px-1.5 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-[34px] w-[34px]"
                              onClick={toggleContactMenu}
                              disabled={!clientId}
                            >
                              <EllipsisVerticalIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                            
                            <div id="contact-menu" className="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openAddContactModal();
                                  }}
                                  type="button"
                                  disabled={!clientId}
                                  className={`group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${!clientId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <PlusIcon className="mr-3 h-4 w-4 text-blue-500" aria-hidden="true" />
                                  Add New Contact
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openEditContactModal();
                                  }}
                                  type="button"
                                  disabled={!contactId}
                                  className={`group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${!contactId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <PencilSquareIcon className="mr-3 h-4 w-4 text-gray-500" aria-hidden="true" />
                                  Edit Contact
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteContact();
                                  }}
                                  type="button"
                                  disabled={!contactId}
                                  className={`group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${!contactId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <TrashIcon className="mr-3 h-4 w-4 text-red-500" aria-hidden="true" />
                                  Delete Contact
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-5" style={{ overflow: 'visible', isolation: 'isolate', perspective: 'none' }}>
                      <div>
                        <label id="shipperLabel" className="block text-sm font-medium text-gray-700 mb-1">
                          Shipper (Optional)
                        </label>
                        <div className="flex items-center space-x-2">
                          <div className="relative flex-grow">
                            <Combobox value={shippers.find(s => s.id === shipperId) || null} onChange={(shipper: Shipper | null) => {
                              setShipperId(shipper?.id || null);
                            }}>
                              <div className="relative" style={{ position: "relative", zIndex: 30, overflow: "visible", transform: "translate3d(0,0,0)" }}>
                                <div className="relative w-full cursor-default overflow-visible rounded-md border border-gray-300 bg-white text-left shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                  <Combobox.Input
                                    className="w-full border-none h-[34px] py-1.5 pl-3 pr-10 text-sm text-gray-900 focus:ring-0"
                                    onChange={(event) => setShipperQuery(event.target.value)}
                                    displayValue={(shipper: Shipper | null) => shipper?.name || ''}
                                    placeholder="Select a shipper"
                                  />
                                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronUpDownIcon
                                      className="h-4 w-4 text-gray-400"
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
                                      <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                        No shipper found.
                                      </div>
                                    ) : (
                                      filteredShippers.map((shipper) => (
                                        <Combobox.Option
                                          key={shipper.id}
                                          className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                              active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                            }`
                                          }
                                          value={shipper}
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
                          
                          <div className="relative">
                            <button
                              id="shipper-menu-button"
                              type="button"
                              className="inline-flex items-center justify-center px-1.5 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-[34px] w-[34px]"
                              onClick={toggleShipperMenu}
                            >
                              <EllipsisVerticalIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                            
                            <div id="shipper-menu" className="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openAddShipperModal();
                                  }}
                                  type="button"
                                  className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                >
                                  <PlusIcon className="mr-3 h-4 w-4 text-blue-500" aria-hidden="true" />
                                  Add New Shipper
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openEditShipperModal();
                                  }}
                                  type="button"
                                  disabled={!shipperId}
                                  className={`group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${!shipperId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <PencilSquareIcon className="mr-3 h-4 w-4 text-gray-500" aria-hidden="true" />
                                  Edit Shipper
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteShipper();
                                  }}
                                  type="button"
                                  disabled={!shipperId}
                                  className={`group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${!shipperId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <TrashIcon className="mr-3 h-4 w-4 text-red-500" aria-hidden="true" />
                                  Delete Shipper
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label id="buyerLabel" className="block text-sm font-medium text-gray-700 mb-1">
                          Buyer (Optional)
                        </label>
                        <div className="flex items-center space-x-2">
                          <div className="relative flex-grow">
                            <Combobox value={buyers.find(b => b.id === buyerId) || null} onChange={(buyer: Buyer | null) => {
                              setBuyerId(buyer?.id || null);
                            }}>
                              <div className="relative" style={{ position: "relative", zIndex: 20, overflow: "visible", transform: "translate3d(0,0,0)" }}>
                                <div className="relative w-full cursor-default overflow-visible rounded-md border border-gray-300 bg-white text-left shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                  <Combobox.Input
                                    className="w-full border-none h-[34px] py-1.5 pl-3 pr-10 text-sm text-gray-900 focus:ring-0"
                                    onChange={(event) => setBuyerQuery(event.target.value)}
                                    displayValue={(buyer: Buyer | null) => buyer?.name || ''}
                                    placeholder="Select a buyer"
                                  />
                                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronUpDownIcon
                                      className="h-4 w-4 text-gray-400"
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
                                      <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                        No buyer found.
                                      </div>
                                    ) : (
                                      filteredBuyers.map((buyer) => (
                                        <Combobox.Option
                                          key={buyer.id}
                                          className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                              active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                            }`
                                          }
                                          value={buyer}
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
                          
                          <div className="relative">
                            <button
                              id="buyer-menu-button"
                              type="button"
                              className="inline-flex items-center justify-center px-1.5 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-[34px] w-[34px]"
                              onClick={toggleBuyerMenu}
                            >
                              <EllipsisVerticalIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                            
                            <div id="buyer-menu" className="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openAddBuyerModal();
                                  }}
                                  type="button"
                                  className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                >
                                  <PlusIcon className="mr-3 h-4 w-4 text-blue-500" aria-hidden="true" />
                                  Add New Buyer
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openEditBuyerModal();
                                  }}
                                  type="button"
                                  disabled={!buyerId}
                                  className={`group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${!buyerId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <PencilSquareIcon className="mr-3 h-4 w-4 text-gray-500" aria-hidden="true" />
                                  Edit Buyer
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteBuyer();
                                  }}
                                  type="button"
                                  disabled={!buyerId}
                                  className={`group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${!buyerId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <TrashIcon className="mr-3 h-4 w-4 text-red-500" aria-hidden="true" />
                                  Delete Buyer
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label id="vesselLabel" htmlFor="vessel" className="block text-sm font-medium text-gray-700 mb-1">
                          Vessel/Carrier (Optional)
                        </label>
                        <input
                          type="text"
                          id="vessel"
                          value={vessel}
                          onChange={(e) => setVessel(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 pl-3 pr-10 text-sm h-[34px]"
                          placeholder="Enter vessel or carrier name"
                        />
                      </div>
                      
                      <div>
                        <label id="billOfLadingLabel" htmlFor="billOfLading" className="block text-sm font-medium text-gray-700 mb-1">
                          Bill of Lading (Optional)
                        </label>
                        <input
                          type="text"
                          id="billOfLading"
                          value={billOfLading}
                          onChange={(e) => setBillOfLading(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 pl-3 pr-10 text-sm h-[34px]"
                          placeholder="Enter bill of lading number"
                        />
                      </div>
                      
                      <div>
                        <label id="billOfLadingDateLabel" htmlFor="billOfLadingDate" className="block text-sm font-medium text-gray-700 mb-1">
                          Bill of Lading Date (Optional)
                        </label>
                        <input
                          type="date"
                          id="billOfLadingDate"
                          value={billOfLadingDate}
                          onChange={(e) => setBillOfLadingDate(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 pl-3 pr-10 text-sm h-[34px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Order Details Section */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-3 sm:px-5">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    Order Details
                  </h2>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-3 sm:p-4">
                  <div className="rounded-md bg-blue-50 p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1 md:flex md:justify-between">
                        <p className="text-sm text-blue-700">
                          Phần này sẽ hiển thị chi tiết đơn hàng như danh sách sản phẩm, số lượng, giá cả và các tính toán tổng số.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Placeholder for future order details table/form */}
                  <div className="mt-4 border border-dashed border-gray-300 rounded-md p-6 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có dữ liệu chi tiết</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Chi tiết đơn hàng sẽ được hiển thị tại đây
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6" style={{ position: 'relative', zIndex: 10 }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Order'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
} 