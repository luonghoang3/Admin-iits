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
    <div className="min-h-screen bg-gray-50 pb-12" style={{ height: 'auto', overflow: 'visible' }}>
      {/* Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {clientMode === 'add' ? 'Add Client' : 'Edit Client'} 
                      {clientMode === 'edit' && (
                        <span className="ml-2 text-sm text-gray-500">
                          (Current Data: {JSON.stringify(clientForm)})
                        </span>
                      )}
                    </h3>
                    <div className="mt-2">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="clientName"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter name"
                            value={clientForm.name}
                            onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700">
                            Address
                          </label>
                          <input
                            type="text"
                            id="clientAddress"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter address"
                            value={clientForm.address}
                            onChange={(e) => setClientForm({...clientForm, address: e.target.value})}
                          />
                        </div>
                        <div>
                          <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <input
                            type="text"
                            id="clientPhone"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter phone"
                            value={clientForm.phone}
                            onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
                          />
                        </div>
                        <div>
                          <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            id="clientEmail"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter email"
                            value={clientForm.email}
                            onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                          />
                        </div>
                        
                        {clientMode === 'add' && (
                          <div className="mt-6 border-t border-gray-200 pt-6">
                            <h4 className="text-md font-medium leading-6 text-gray-900 mb-4">
                              Add Primary Contact (Optional)
                            </h4>
                            <div className="space-y-4">
                              <div>
                                <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  id="contactName"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  placeholder="Enter contact name"
                                  value={clientForm.contact_name}
                                  onChange={(e) => setClientForm({...clientForm, contact_name: e.target.value})}
                                />
                              </div>
                              <div>
                                <label htmlFor="contactPosition" className="block text-sm font-medium text-gray-700">
                                  Position
                                </label>
                                <input
                                  type="text"
                                  id="contactPosition"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  placeholder="Enter position"
                                  value={clientForm.contact_position}
                                  onChange={(e) => setClientForm({...clientForm, contact_position: e.target.value})}
                                />
                              </div>
                              <div>
                                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                                  Phone
                                </label>
                                <input
                                  type="text"
                                  id="contactPhone"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  placeholder="Enter phone"
                                  value={clientForm.contact_phone}
                                  onChange={(e) => setClientForm({...clientForm, contact_phone: e.target.value})}
                                />
                              </div>
                              <div>
                                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                                  Email
                                </label>
                                <input
                                  type="email"
                                  id="contactEmail"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  placeholder="Enter email"
                                  value={clientForm.contact_email}
                                  onChange={(e) => setClientForm({...clientForm, contact_email: e.target.value})}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleSaveClient}
                >
                  {clientMode === 'add' ? 'Add' : 'Save'}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setShowClientModal(false)}
                >
                  Cancel
                </button>
              </div>
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
      
      {/* Main Page Content */}
      <header className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Edit Order</h1>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Order'}
            </button>
          </div>
        </div>
      </header>
      
      <main className="py-6" style={{ height: 'auto', minHeight: 'auto', overflow: 'visible' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ height: 'auto', minHeight: 'auto', overflow: 'visible' }}>
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
            <form onSubmit={handleSubmit} className="space-y-8 overflow-visible" style={{ minHeight: 'auto', height: 'auto', maxHeight: 'none', position: 'relative' }}>
              <div className="bg-white shadow sm:rounded-lg overflow-visible" style={{ minHeight: 'auto', height: 'auto', maxHeight: 'none', position: 'relative' }}>
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    Order Information
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {orderType === 'import' ? 'Import' : 'Export'} • 
                    {department === 'marine' ? ' Marine' : 
                      department === 'agri' ? ' Agriculture' : ' Consumer Goods'}
                  </p>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label id="orderNumberLabel" htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Order Number
                      </label>
                      <input
                        type="text"
                        id="orderNumber"
                        value={orderNumber}
                        disabled
                        className="bg-gray-100 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 pl-3 pr-10 text-sm h-[38px]"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 pl-3 pr-10 text-sm h-[38px]"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 pl-3 pr-10 text-sm h-[38px]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label id="statusLabel" className="block text-sm font-medium text-gray-700 mb-1">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <Listbox value={status} onChange={setStatus}>
                        <div className="relative mt-1">
                          <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 h-[38px]">
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
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
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
                </div>
              </div>
              
              <div className="bg-white shadow sm:rounded-lg overflow-visible" style={{ minHeight: 'auto', height: 'auto', maxHeight: 'none', position: 'relative' }}>
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    Client & Contact Information
                  </h2>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2" style={{ overflow: 'visible' }}>
                    <div>
                      <label id="clientLabel" className="block text-sm font-medium text-gray-700 mb-1">
                        Client <span className="text-red-500">*</span>
                      </label>
                      <div className="flex" style={{ overflow: 'visible' }}>
                        <div className="relative flex-grow" style={{ overflow: 'visible' }}>
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
                            <div className="relative mt-1" style={{ overflow: 'visible' }}>
                              <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                <Combobox.Input
                                  className="w-full border-none h-[38px] py-2 pl-3 pr-10 text-sm text-gray-900 focus:ring-0"
                                  onChange={(event) => setClientQuery(event.target.value)}
                                  displayValue={(client: Client | null) => client?.name || ''}
                                  placeholder="Select a client"
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
                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
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
                        
                        <div className="ml-2 relative" style={{ overflow: 'visible' }}>
                          <button
                            id="client-menu-button"
                            type="button"
                            className="inline-flex items-center px-2 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-[38px]"
                            onClick={toggleClientMenu}
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                          
                          <div id="client-menu" className="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10" style={{ overflow: 'visible' }}>
                            <div className="py-1">
                              <button
                                onClick={openAddClientModal}
                                type="button"
                                className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                              >
                                <PlusIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
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
                                <PencilSquareIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
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
                                <TrashIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
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
                      <div className="flex">
                        <select
                          id="contact"
                          value={contactId || ''}
                          onChange={(e) => setContactId(e.target.value || null)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-[38px]"
                          disabled={!clientId || clientContacts.length === 0}
                        >
                          <option value="">Select a contact</option>
                          {clientContacts.map((contact) => (
                            <option key={contact.id} value={contact.id}>
                              {contact.full_name} {contact.position ? `(${contact.position})` : ''}
                            </option>
                          ))}
                        </select>
                        
                        <div className="ml-2 relative" style={{ overflow: 'visible' }}>
                          <button
                            id="contact-menu-button"
                            type="button"
                            className="inline-flex items-center px-2 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-[38px]"
                            onClick={toggleContactMenu}
                            disabled={!clientId}
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                          
                          <div id="contact-menu" className="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10" style={{ overflow: 'visible' }}>
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
                                <PlusIcon className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
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
                                <PencilSquareIcon className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" />
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
                                <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                                Delete Contact
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Shipping Information Section */}
              <div className="bg-white shadow sm:rounded-lg overflow-visible" style={{ minHeight: 'auto', height: 'auto', maxHeight: 'none', position: 'relative' }}>
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    Shipping Information
                  </h2>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label id="shipperLabel" className="block text-sm font-medium text-gray-700 mb-1">
                        Shipper (Optional)
                      </label>
                      <div className="flex">
                        <div className="relative flex-grow" style={{ overflow: 'visible' }}>
                          <Combobox value={shippers.find(s => s.id === shipperId) || null} onChange={(shipper: Shipper | null) => {
                            setShipperId(shipper?.id || null);
                          }}>
                            <div className="relative mt-1" style={{ overflow: 'visible' }}>
                              <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                <Combobox.Input
                                  className="w-full border-none h-[38px] py-2 pl-3 pr-10 text-sm text-gray-900 focus:ring-0"
                                  onChange={(event) => setShipperQuery(event.target.value)}
                                  displayValue={(shipper: Shipper | null) => shipper?.name || ''}
                                  placeholder="Select a shipper"
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
                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
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
                        
                        <div className="ml-2 relative" style={{ overflow: 'visible' }}>
                          <button
                            id="shipper-menu-button"
                            type="button"
                            className="inline-flex items-center px-2 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-[38px]"
                            onClick={toggleShipperMenu}
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                          
                          <div id="shipper-menu" className="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10" style={{ overflow: 'visible' }}>
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
                                <PlusIcon className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
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
                                <PencilSquareIcon className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" />
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
                                <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
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
                      <div className="flex">
                        <div className="relative flex-grow" style={{ overflow: 'visible' }}>
                          <Combobox value={buyers.find(b => b.id === buyerId) || null} onChange={(buyer: Buyer | null) => {
                            setBuyerId(buyer?.id || null);
                          }}>
                            <div className="relative mt-1" style={{ overflow: 'visible' }}>
                              <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                <Combobox.Input
                                  className="w-full border-none h-[38px] py-2 pl-3 pr-10 text-sm text-gray-900 focus:ring-0"
                                  onChange={(event) => setBuyerQuery(event.target.value)}
                                  displayValue={(buyer: Buyer | null) => buyer?.name || ''}
                                  placeholder="Select a buyer"
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
                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
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
                        
                        <div className="ml-2 relative" style={{ overflow: 'visible' }}>
                          <button
                            id="buyer-menu-button"
                            type="button"
                            className="inline-flex items-center px-2 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-[38px]"
                            onClick={toggleBuyerMenu}
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                          
                          <div id="buyer-menu" className="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10" style={{ overflow: 'visible' }}>
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
                                <PlusIcon className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
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
                                <PencilSquareIcon className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" />
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
                                <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                                Delete Buyer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Information Section */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    Additional Information
                  </h2>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <div>
                    <label id="notesLabel" htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter any additional notes about this order"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={4}
                    ></textarea>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
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