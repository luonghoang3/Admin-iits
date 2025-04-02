'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  fetchOrder,
  updateOrder,
  fetchClients,
  fetchClient,
  fetchOrderItems,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
  fetchCommodities,
  fetchUnits
} from '@/utils/supabase/client'
import { Combobox, Transition } from '@headlessui/react'

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
  XMarkIcon
} from "@heroicons/react/24/outline"
import { ChevronUpDownIcon } from "@heroicons/react/20/solid"

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
  shipper_id: string | null
  buyer_id: string | null
  vessel_carrier: string | null
  bill_of_lading: string | null
  bill_of_lading_date: string | null
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

interface Client {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
}

interface OrderItem {
  id: string
  order_id: string
  commodity_id: string
  quantity: number
  unit_id: string
  commodity_description: string | null
  commodities: {
    id: string
    name: string
    description: string | null
  }
  units: {
    id: string
    name: string
  }
  created_at: string
  updated_at: string
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

export default function EditOrderPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  
  // Order Items States
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [currentItem, setCurrentItem] = useState<{
    id?: string;
    commodity_id: string;
    quantity: number;
    unit_id: string;
    commodity_description: string;
  }>({
    commodity_id: '',
    quantity: 1,
    unit_id: '',
    commodity_description: ''
  })
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [isEditingItem, setIsEditingItem] = useState(false)
  const [itemError, setItemError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    client_id: '',
    contact_id: '',
    type: 'international' as 'international' | 'local',
    department: 'marine' as 'marine' | 'agri' | 'consumer_goods',
    status: 'draft' as 'draft' | 'confirmed' | 'completed' | 'cancelled',
    order_date: '',
    client_ref_code: '',
    notes: '',
    shipper_id: '',
    buyer_id: '',
    vessel_carrier: '',
    bill_of_lading: '',
    bill_of_lading_date: ''
  })
  
  // Add state for unit search
  const [unitOpen, setUnitOpen] = useState(false)
  const [unitSearch, setUnitSearch] = useState("")
  
  useEffect(() => {
    async function loadOrder() {
      try {
        // Fetch order details
        const { order, error } = await fetchOrder(orderId)
        
        if (error) {
          throw new Error(error)
        }
        
        if (order) {
          setOrder(order)
          setFormData({
            client_id: order.client_id || '',
            contact_id: order.contact_id || '',
            type: order.type || 'international',
            department: order.department || 'marine',
            status: order.status || 'draft',
            order_date: order.order_date || new Date().toISOString().split('T')[0],
            client_ref_code: order.client_ref_code || '',
            notes: order.notes || '',
            shipper_id: order.shipper_id || '',
            buyer_id: order.buyer_id || '',
            vessel_carrier: order.vessel_carrier || '',
            bill_of_lading: order.bill_of_lading || '',
            bill_of_lading_date: order.bill_of_lading_date || ''
          })
          
          // Load contacts for this client
          if (order.client_contacts) {
            setContacts(order.client_contacts)
          }
          
          // Load order items
          const { orderItems, error: itemsError } = await fetchOrderItems(orderId)
          if (itemsError) {
            console.error('Error loading order items:', itemsError)
          } else {
            setOrderItems(orderItems || [])
          }
          
          // Load commodities and units for selection in items form
          const { commodities: commoditiesData } = await fetchCommodities()
          const { units: unitsData } = await fetchUnits()
          
          if (commoditiesData) setCommodities(commoditiesData)
          if (unitsData) setUnits(unitsData)
          
        } else {
          throw new Error('Order not found')
        }
        
        // Load all clients for selection
        const { clients: clientsData, error: clientsError } = await fetchClients()
        
        if (clientsError) {
          console.error('Error loading clients:', clientsError)
        } else if (clientsData) {
          setClients(clientsData)
        }
      } catch (err: any) {
        console.error('Error loading order:', err)
        setError(err.message || 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }
    
    if (orderId) {
      loadOrder()
    }
  }, [orderId])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // For direct value setting (used with ShadCN Select)
  const handleValueChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Function to load contacts when client is changed
  const handleClientChange = async (clientId: string) => {
    if (!clientId) {
      setFormData(prev => ({
        ...prev,
        client_id: '',
        contact_id: ''
      }))
      setContacts([])
      return
    }
    
    try {
      // Show loading indicator only for contacts section
      const contactsEl = document.getElementById('contact-field')
      if (contactsEl) {
        contactsEl.classList.add('opacity-60', 'pointer-events-none')
      }
      
      // Update client_id in form data immediately
      setFormData(prev => ({
        ...prev,
        client_id: clientId,
        contact_id: '' // Clear selected contact
      }))
      
      console.log('Fetching contacts for client ID:', clientId)
      
      const { client, error } = await fetchClient(clientId)
      
      if (error) {
        console.error('Error fetching client details:', error)
        // Set a more specific error that doesn't interrupt the whole form
        setError(`Unable to load contacts for this client: ${error}`)
        setContacts([])
        return
      }
      
      if (client && client.contacts) {
        console.log('Contacts loaded:', client.contacts.length)
        setContacts(client.contacts)
        // Clear contact-specific error if successful
        if (error && error.includes('contact')) {
          setError(null)
        }
      } else {
        console.log('No contacts found for this client')
        setContacts([])
      }
    } catch (err: any) {
      console.error('Error during client fetch:', err)
      // Set a more specific error that doesn't interrupt the whole form
      setError(`Failed to load contacts: ${err.message || 'Unknown error'}`)
      setContacts([])
    } finally {
      // Remove loading indicator
      const contactsEl = document.getElementById('contact-field')
      if (contactsEl) {
        contactsEl.classList.remove('opacity-60', 'pointer-events-none')
      }
    }
  }
  
  // Order Item Functions
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
  
  const openEditItemForm = (item: OrderItem) => {
    setCurrentItem({
      id: item.id,
      commodity_id: item.commodity_id,
      quantity: item.quantity,
      unit_id: item.unit_id,
      commodity_description: item.commodity_description || ''
    })
    setIsEditingItem(true)
    setItemError(null)
    setItemFormOpen(true)
  }
  
  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentItem(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseFloat(value) || 0 : value
    }))
  }
  
  const handleItemSelectChange = (name: string, value: string) => {
    setCurrentItem(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSaveItem = async () => {
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
    
    setItemError(null)
    
    try {
      if (isEditingItem && currentItem.id) {
        // Update existing item
        const { orderItem, error } = await updateOrderItem(
          currentItem.id,
          {
            commodity_id: currentItem.commodity_id,
            quantity: currentItem.quantity,
            unit_id: currentItem.unit_id,
            commodity_description: currentItem.commodity_description || undefined
          }
        )
        
        if (error) throw new Error(error)
        
        // Update the items list
        setOrderItems(prev => 
          prev.map(item => item.id === currentItem.id ? 
            { ...item, 
              commodity_id: currentItem.commodity_id,
              quantity: currentItem.quantity,
              unit_id: currentItem.unit_id,
              commodity_description: currentItem.commodity_description === '' ? null : currentItem.commodity_description,
              commodities: commodities.find(c => c.id === currentItem.commodity_id) ? 
                { 
                  id: currentItem.commodity_id, 
                  name: commodities.find(c => c.id === currentItem.commodity_id)!.name,
                  description: commodities.find(c => c.id === currentItem.commodity_id)!.description
                } : item.commodities,
              units: units.find(u => u.id === currentItem.unit_id) ?
                {
                  id: currentItem.unit_id,
                  name: units.find(u => u.id === currentItem.unit_id)!.name
                } : item.units
            } : item
          )
        )
      } else {
        // Create new item
        const { orderItem, error } = await createOrderItem({
          order_id: orderId,
          commodity_id: currentItem.commodity_id,
          quantity: currentItem.quantity,
          unit_id: currentItem.unit_id,
          commodity_description: currentItem.commodity_description || undefined
        })
        
        if (error) throw new Error(error)
        
        if (orderItem) {
          // Add the new item to the list with commodity and unit details
          const newItem: OrderItem = {
            ...orderItem,
            commodities: commodities.find(c => c.id === currentItem.commodity_id) ? 
              { 
                id: currentItem.commodity_id, 
                name: commodities.find(c => c.id === currentItem.commodity_id)!.name,
                description: commodities.find(c => c.id === currentItem.commodity_id)!.description
              } : { id: currentItem.commodity_id, name: 'Unknown', description: null },
            units: units.find(u => u.id === currentItem.unit_id) ?
              {
                id: currentItem.unit_id,
                name: units.find(u => u.id === currentItem.unit_id)!.name
              } : { id: currentItem.unit_id, name: 'Unknown' }
          }
          setOrderItems(prev => [...prev, newItem])
        }
      }
      
      // Close the form
      setItemFormOpen(false)
    } catch (err: any) {
      console.error('Error saving order item:', err)
      setItemError(err.message || 'Failed to save order item')
    }
  }
  
  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        const { success, error } = await deleteOrderItem(itemId)
        
        if (error) throw new Error(error)
        
        if (success) {
          // Remove the item from the list
          setOrderItems(prev => prev.filter(item => item.id !== itemId))
        }
      } catch (err: any) {
        console.error('Error deleting order item:', err)
        setError(err.message || 'Failed to delete order item')
      }
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.client_id) {
      setError('Client is required')
      return
    }
    
    if (!formData.order_date) {
      setError('Order date is required')
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      
      // Sử dụng biến order từ state thay vì từ kết quả trả về
      const orderData = {
        client_id: formData.client_id,
        contact_id: formData.contact_id || null,
        type: order?.type || formData.type,
        department: order?.department || formData.department,
        status: formData.status,
        order_date: formData.order_date,
        client_ref_code: formData.client_ref_code || null,
        notes: formData.notes || null,
        shipper_id: formData.shipper_id || null,
        buyer_id: formData.buyer_id || null,
        vessel_carrier: formData.vessel_carrier || null,
        bill_of_lading: formData.bill_of_lading || null,
        bill_of_lading_date: formData.bill_of_lading_date || null
      };
      
      const { order: updatedOrder, error } = await updateOrder(orderId, orderData);
      
      if (error) {
        throw new Error(error)
      }
      
      // Redirect to order detail page
      router.push(`/dashboard/orders/${orderId}`)
    } catch (err: any) {
      console.error('Error saving order:', err)
      setError(err.message || 'Failed to save order')
      setSaving(false)
    }
  }
  
  // Helper function to render status badge
  const getStatusBadge = (status: string) => {
    let color = "bg-gray-100";
    
    switch(status) {
      case 'draft':
        color = "bg-yellow-100 text-yellow-800";
        break;
      case 'confirmed':
        color = "bg-blue-100 text-blue-800";
        break;
      case 'completed':
        color = "bg-green-100 text-green-800";
        break;
      case 'cancelled':
        color = "bg-red-100 text-red-800";
        break;
    }
    
    return (
      <Badge className={color + " font-medium"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }
  
  // Add filter function for units
  const filteredUnits = unitSearch === "" 
    ? units 
    : units.filter((unit) => 
        unit.name.toLowerCase().includes(unitSearch.toLowerCase())
      );
  
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading order information...</p>
        </div>
      </div>
    )
  }
  
  if (error && !order) {
    return (
      <div className="p-6 space-y-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/dashboard/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild className="h-8 w-8">
            <Link href={`/dashboard/orders/${orderId}`}>
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PackageIcon className="h-6 w-6" />
            Edit Order {order?.order_number && <span className="text-lg text-muted-foreground font-normal">({order.order_number})</span>}
          </h1>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/orders/${orderId}`}>Cancel</Link>
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Order Information</CardTitle>
              <CardDescription>
                Update the details for this order. Fields marked with * are required.
              </CardDescription>
              {order && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {getStatusBadge(order.status)}
                  
                  <Badge variant="outline" className="bg-slate-100">
                    {order.type === 'international' ? 'International' : 'Local'}
                  </Badge>
                  
                  <Badge variant="outline" className="bg-slate-100">
                    {order.department === 'marine' ? 'Marine' : 
                     order.department === 'agri' ? 'Agriculture' : 'Consumer Goods'}
                  </Badge>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Order Number</p>
              <p className="text-lg font-bold">{order?.order_number}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form id="orderForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cột 1: Order Date, Client Ref Code, Status */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="order_date" className="text-base">Order Date *</Label>
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    <Input
                      type="date"
                      id="order_date"
                      name="order_date"
                      value={formData.order_date}
                      onChange={handleChange}
                      required
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client_ref_code" className="text-base">Client Reference Code</Label>
                  <div className="flex items-center">
                    <FileSpreadsheetIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    <Input
                      type="text"
                      id="client_ref_code"
                      name="client_ref_code"
                      value={formData.client_ref_code}
                      onChange={handleChange}
                      placeholder="Client's reference code"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-base">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleValueChange('status', value as 'draft' | 'confirmed' | 'completed' | 'cancelled')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cột 2: Client, Contact, Notes */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id" className="text-base">Client *</Label>
                  <Select 
                    value={formData.client_id} 
                    onValueChange={(value) => handleClientChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_id" className="text-base">Contact</Label>
                  <div id="contact-field">
                    <Select 
                      value={formData.contact_id} 
                      onValueChange={(value) => handleValueChange('contact_id', value)}
                      disabled={contacts.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={contacts.length === 0 ? "No contacts available" : "Select a contact"} />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map(contact => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-base">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional information"
                    className="h-10 min-h-[40px] resize-none"
                  />
                </div>
              </div>
              
              {/* Cột 3: Vessel/Carrier, Bill of Lading, Bill of Lading Date */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vessel_carrier" className="text-base">Vessel/Carrier</Label>
                  <div className="flex items-center">
                    <ShipIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    <Input
                      type="text"
                      id="vessel_carrier"
                      name="vessel_carrier"
                      value={formData.vessel_carrier}
                      onChange={handleChange}
                      placeholder="Vessel name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bill_of_lading" className="text-base">Bill of Lading</Label>
                  <div className="flex items-center">
                    <FileSpreadsheetIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    <Input
                      type="text"
                      id="bill_of_lading"
                      name="bill_of_lading"
                      value={formData.bill_of_lading}
                      onChange={handleChange}
                      placeholder="BoL number"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bill_of_lading_date" className="text-base">Bill of Lading Date</Label>
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    <Input
                      type="date"
                      id="bill_of_lading_date"
                      name="bill_of_lading_date"
                      value={formData.bill_of_lading_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2 border-t p-4">
          <Button 
            variant="outline" 
            asChild
          >
            <Link href={`/dashboard/orders/${orderId}`}>Cancel</Link>
          </Button>
          <Button 
            type="submit" 
            form="orderForm"
            disabled={saving}
            className="gap-2"
          >
            {saving ? "Saving..." : <>
              <SaveIcon className="h-4 w-4" />
              Save Changes
            </>}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Order Items Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                Manage the items included in this order.
              </CardDescription>
            </div>
            <Button onClick={openAddItemForm} className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {orderItems.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No items added to this order yet. Click the "Add Item" button to add items.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Commodity Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.commodities?.name || 'Unknown'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.units?.name || 'Unknown'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.commodity_description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => openEditItemForm(item)}
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
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
      
      {/* Item Form Dialog */}
      <Dialog open={itemFormOpen} onOpenChange={setItemFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
            <DialogDescription>
              {isEditingItem 
                ? 'Update the details for this order item.' 
                : 'Add a new item to this order.'}
            </DialogDescription>
          </DialogHeader>
          
          {itemError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{itemError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="commodity_id">Commodity *</Label>
              <Select 
                value={currentItem.commodity_id} 
                onValueChange={(value) => handleItemSelectChange('commodity_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a commodity" />
                </SelectTrigger>
                <SelectContent>
                  {commodities.map(commodity => (
                    <SelectItem key={commodity.id} value={commodity.id}>
                      {commodity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={currentItem.quantity}
                  onChange={handleItemChange}
                  min="0.01"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit_id">Unit *</Label>
                <Combobox value={units.find(u => u.id === currentItem.unit_id) || null} onChange={(unit: Unit | null) => {
                  handleItemSelectChange('unit_id', unit?.id || '');
                }}>
                  <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-md border border-input bg-background text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <Combobox.Input
                        className="w-full border-none py-2 pl-3 pr-10 text-sm text-foreground focus:ring-0"
                        displayValue={(unit: Unit | null) => unit?.name || ''}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setUnitSearch(event.target.value)}
                        placeholder="Select or search unit"
                      />
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon
                          className="h-5 w-5 text-muted-foreground"
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
                      <Combobox.Options className="fixed z-50 mt-1 max-h-60 w-auto overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" style={{ position: 'fixed', top: 'auto', left: 'auto', width: 'auto', maxWidth: '300px', overflowY: 'auto' }}>
                        {filteredUnits.length === 0 && unitSearch !== '' ? (
                          <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                            No units found.
                          </div>
                        ) : (
                          filteredUnits.map((unit) => (
                            <Combobox.Option
                              key={unit.id}
                              className={({ active }: { active: boolean }) =>
                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                  active ? 'bg-primary text-primary-foreground' : 'text-foreground'
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
                                        active ? 'text-primary-foreground' : 'text-primary'
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
            
            <div className="space-y-2">
              <Label htmlFor="commodity_description">Commodity Description</Label>
              <Textarea
                id="commodity_description"
                name="commodity_description"
                value={currentItem.commodity_description}
                onChange={handleItemChange}
                placeholder="Detailed description of this commodity"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem}>
              {isEditingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 