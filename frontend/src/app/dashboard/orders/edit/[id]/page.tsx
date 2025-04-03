'use client'

import { useState, useEffect, Fragment, useRef } from 'react'
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
import { fetchShippers, fetchBuyers } from '@/utils/supabase/shipping'
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
  
  // Sử dụng useRef thay vì window để lưu timeout ID
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
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
  const [isSearchingUnits, setIsSearchingUnits] = useState(false)
  
  // Add state for commodity search
  const [commodityQuery, setCommodityQuery] = useState("")
  const [isSearchingCommodities, setIsSearchingCommodities] = useState(false)
  
  // Add state for client search
  const [clientQuery, setClientQuery] = useState("")
  const [isSearchingClients, setIsSearchingClients] = useState(false)
  // Thêm ref để lưu trữ và giữ focus cho input search
  const clientSearchInputRef = useRef<HTMLInputElement>(null)
  const currentQueryRef = useRef("")
  // Thêm state để kiểm soát việc hiển thị danh sách gợi ý
  const [showClientList, setShowClientList] = useState(false)
  
  // Thêm state cho shippers và buyers
  const [shippers, setShippers] = useState<any[]>([])
  const [buyers, setBuyers] = useState<any[]>([])
  
  // Thêm state cho việc tìm kiếm và hiển thị dropdown cho Shipper
  const [shipperQuery, setShipperQuery] = useState("")
  const [isSearchingShippers, setIsSearchingShippers] = useState(false)
  const shipperSearchInputRef = useRef<HTMLInputElement>(null)
  const currentShipperQueryRef = useRef("")
  const [showShipperList, setShowShipperList] = useState(false)
  
  // Thêm state cho việc tìm kiếm và hiển thị dropdown cho Buyer
  const [buyerQuery, setBuyerQuery] = useState("")
  const [isSearchingBuyers, setIsSearchingBuyers] = useState(false)
  const buyerSearchInputRef = useRef<HTMLInputElement>(null)
  const currentBuyerQueryRef = useRef("")
  const [showBuyerList, setShowBuyerList] = useState(false)
  
  // Thêm state và ref cho dropdown tùy chỉnh của Commodity
  const commoditySearchInputRef = useRef<HTMLInputElement>(null)
  const currentCommodityQueryRef = useRef("")
  const [showCommodityList, setShowCommodityList] = useState(false)
  
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
        
        // Load shippers and buyers
        const { shippers: shippersData } = await fetchShippers()
        const { buyers: buyersData } = await fetchBuyers()
        
        if (shippersData) setShippers(shippersData)
        if (buyersData) setBuyers(buyersData)
        
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
      [name]: value === "none" ? null : value
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
    
    // Đóng tất cả dropdown khi mở form
    setShowCommodityList(false)
    setCommodityQuery("")
    setUnitSearch("")
  }
  
  const openEditItemForm = (item: OrderItem) => {
    // Dừng mọi tìm kiếm đang chạy
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Đảm bảo chúng ta có commodity name đã chọn
    const selectedCommodity = item.commodities;
    
    // Khởi tạo item đang edit
    setCurrentItem({
      id: item.id,
      commodity_id: item.commodity_id,
      quantity: item.quantity,
      unit_id: item.unit_id,
      commodity_description: item.commodity_description || ''
    });
    
    // Đặt trạng thái editing
    setIsEditingItem(true);
    setItemError(null);
    
    // Nếu commodity chưa được load trong danh sách, thêm vào
    if (selectedCommodity) {
      if (!commodities.some(c => c.id === item.commodity_id)) {
        setCommodities(prev => [selectedCommodity, ...prev]);
      }
    }
    
    // Reset query
    setCommodityQuery("");
    
    // Mở form
    setItemFormOpen(true);
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
  
  // Cập nhật hàm tìm kiếm commodity cho dropdown tùy chỉnh
  const handleCommoditySearch = async (query: string) => {
    setCommodityQuery(query)
    
    if (query === '') {
      try {
        setIsSearchingCommodities(true)
        
        // Gọi API tìm kiếm từ server
        const { commodities: allCommodities } = await fetchCommodities()
        
        if (allCommodities) {
          // Nếu có commodity được chọn, đảm bảo nó vẫn hiển thị trong danh sách
          if (currentItem.commodity_id) {
            const currentCommodity = commodities.find(c => c.id === currentItem.commodity_id)
            if (currentCommodity && !allCommodities.some(c => c.id === currentItem.commodity_id)) {
              setCommodities([currentCommodity, ...allCommodities])
              return
            }
          }
          setCommodities(allCommodities)
        }
      } catch (err) {
        console.error('Error loading all commodities:', err)
      } finally {
        setIsSearchingCommodities(false)
      }
      return
    }
    
    // Nếu chuỗi tìm kiếm ngắn, không làm gì cả
    if (query.length < 2) {
      return
    }
    
    try {
      setIsSearchingCommodities(true)
      
      // Gọi API tìm kiếm từ server
      const { commodities: searchResults } = await fetchCommodities(1, 20, query)
      
      if (searchResults) {
        // Nếu đã chọn một commodity, giữ lại commodity đó trong kết quả
        if (currentItem.commodity_id) {
          const currentCommodity = commodities.find(c => c.id === currentItem.commodity_id)
          if (currentCommodity && !searchResults.some(c => c.id === currentItem.commodity_id)) {
            // Thêm commodity đã chọn vào đầu danh sách kết quả
            setCommodities([currentCommodity, ...searchResults])
            return
          }
        }
        
        // Cập nhật danh sách commodities với kết quả tìm kiếm
        setCommodities(searchResults)
      }
    } catch (err) {
      console.error('Error searching commodities:', err)
    } finally {
      setIsSearchingCommodities(false)
    }
  }
  
  // Thêm useEffect để xử lý click bên ngoài dropdown commodity
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const commodityDropdown = document.getElementById('commodity-dropdown-container');
      if (commodityDropdown && !commodityDropdown.contains(event.target as Node)) {
        setShowCommodityList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Hàm xử lý tìm kiếm unit từ server
  const handleUnitSearch = async (query: string) => {
    setUnitSearch(query)
    
    // Nếu chuỗi tìm kiếm ngắn, chỉ lọc dữ liệu cục bộ
    if (query.length < 2) {
      return
    }
    
    try {
      setIsSearchingUnits(true)
      
      // Gọi API tìm kiếm từ server
      const { units: searchResults } = await fetchUnits(1, 20, query)
      
      if (searchResults) {
        // Nếu đang chỉnh sửa và đã chọn một unit, giữ lại unit đó trong kết quả
        if (isEditingItem && currentItem.unit_id) {
          const currentUnit = units.find(u => u.id === currentItem.unit_id)
          if (currentUnit && !searchResults.some(u => u.id === currentItem.unit_id)) {
            // Thêm unit đã chọn vào đầu danh sách kết quả
            setUnits([currentUnit, ...searchResults])
            return
          }
        }
        
        // Cập nhật danh sách units với kết quả tìm kiếm
        setUnits(searchResults)
      }
    } catch (err) {
      console.error('Error searching units:', err)
    } finally {
      setIsSearchingUnits(false)
    }
  }
  
  // Add filter function for units
  const filteredUnits = unitSearch === "" 
    ? units 
    : units.filter((unit) => 
        unit.name.toLowerCase().includes(unitSearch.toLowerCase())
      );
  
  // Tối ưu hàm tìm kiếm client để không mất focus
  const handleClientSearch = (query: string) => {
    // Chỉ cập nhật state, không gọi API ngay lập tức
    setClientQuery(query)
    currentQueryRef.current = query
    
    // Luôn hiển thị danh sách khi có người đang nhập
    setShowClientList(true)
    
    // Sử dụng debounce để không gọi API liên tục mỗi khi nhập
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performClientSearch(query)
    }, 300)
  }
  
  // Tách biệt hàm tìm kiếm thực tế
  const performClientSearch = async (query: string) => {
    // Nếu xóa hết, tải lại danh sách đầy đủ
    if (query === '') {
      try {
        setIsSearchingClients(true)
        const { clients: allClients } = await fetchClients(1, 100)
        if (allClients) {
          setClients(allClients)
        }
      } catch (err) {
        console.error('Error loading all clients:', err)
      } finally {
        setIsSearchingClients(false)
      }
      return
    }
    
    // Nếu chuỗi tìm kiếm ngắn, không làm gì cả
    if (query.length < 2) {
      return
    }
    
    try {
      setIsSearchingClients(true)
      
      // Gọi API tìm kiếm từ server
      const { clients: searchResults } = await fetchClients(1, 100, query)
      
      if (searchResults && currentQueryRef.current === query) {
        // Nếu đã chọn một client, giữ lại client đó trong kết quả
        if (formData.client_id) {
          const currentClient = clients.find(c => c.id === formData.client_id)
          if (currentClient && !searchResults.some(c => c.id === formData.client_id)) {
            // Thêm client đã chọn vào đầu danh sách kết quả
            setClients([currentClient, ...searchResults])
            return
          }
        }
        
        // Cập nhật danh sách clients với kết quả tìm kiếm
        setClients(searchResults)
      }
    } catch (err) {
      console.error('Error searching clients:', err)
    } finally {
      setIsSearchingClients(false)
    }
  }
  
  // Hàm xử lý click bên ngoài dropdown để đóng danh sách
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clientDropdown = document.getElementById('client-dropdown-container');
      if (clientDropdown && !clientDropdown.contains(event.target as Node)) {
        setShowClientList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Thêm hàm tìm kiếm shipper
  const handleShipperSearch = (query: string) => {
    setShipperQuery(query)
    currentShipperQueryRef.current = query
    
    setShowShipperList(true)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performShipperSearch(query)
    }, 300)
  }
  
  const performShipperSearch = async (query: string) => {
    if (query === '') {
      try {
        setIsSearchingShippers(true)
        const { shippers: allShippers } = await fetchShippers()
        if (allShippers) {
          setShippers(allShippers)
        }
      } catch (err) {
        console.error('Error loading all shippers:', err)
      } finally {
        setIsSearchingShippers(false)
      }
      return
    }
    
    if (query.length < 2) {
      return
    }
    
    try {
      setIsSearchingShippers(true)
      
      // Lọc danh sách shippers hiện có
      const filteredShippers = shippers.filter(shipper => 
        shipper.name.toLowerCase().includes(query.toLowerCase())
      )
      
      if (currentShipperQueryRef.current === query) {
        if (formData.shipper_id) {
          const currentShipper = shippers.find(c => c.id === formData.shipper_id)
          if (currentShipper && !filteredShippers.some(c => c.id === formData.shipper_id)) {
            setShippers([currentShipper, ...filteredShippers])
            return
          }
        }
        
        setShippers(filteredShippers)
      }
    } catch (err) {
      console.error('Error searching shippers:', err)
    } finally {
      setIsSearchingShippers(false)
    }
  }
  
  // Thêm useEffect để xử lý click bên ngoài dropdown shipper
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const shipperDropdown = document.getElementById('shipper-dropdown-container');
      if (shipperDropdown && !shipperDropdown.contains(event.target as Node)) {
        setShowShipperList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Thêm hàm tìm kiếm buyer
  const handleBuyerSearch = (query: string) => {
    setBuyerQuery(query)
    currentBuyerQueryRef.current = query
    
    setShowBuyerList(true)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performBuyerSearch(query)
    }, 300)
  }
  
  const performBuyerSearch = async (query: string) => {
    if (query === '') {
      try {
        setIsSearchingBuyers(true)
        const { buyers: allBuyers } = await fetchBuyers()
        if (allBuyers) {
          setBuyers(allBuyers)
        }
      } catch (err) {
        console.error('Error loading all buyers:', err)
      } finally {
        setIsSearchingBuyers(false)
      }
      return
    }
    
    if (query.length < 2) {
      return
    }
    
    try {
      setIsSearchingBuyers(true)
      
      // Lọc danh sách buyers hiện có
      const filteredBuyers = buyers.filter(buyer => 
        buyer.name.toLowerCase().includes(query.toLowerCase())
      )
      
      if (currentBuyerQueryRef.current === query) {
        if (formData.buyer_id) {
          const currentBuyer = buyers.find(c => c.id === formData.buyer_id)
          if (currentBuyer && !filteredBuyers.some(c => c.id === formData.buyer_id)) {
            setBuyers([currentBuyer, ...filteredBuyers])
            return
          }
        }
        
        setBuyers(filteredBuyers)
      }
    } catch (err) {
      console.error('Error searching buyers:', err)
    } finally {
      setIsSearchingBuyers(false)
    }
  }
  
  // Thêm useEffect để xử lý click bên ngoài dropdown buyer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const buyerDropdown = document.getElementById('buyer-dropdown-container');
      if (buyerDropdown && !buyerDropdown.contains(event.target as Node)) {
        setShowBuyerList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Thêm useEffect để ngăn text tự động bị chọn khi modal mở
  useEffect(() => {
    if (itemFormOpen) {
      // Đặt timeout ngắn để đảm bảo DOM đã được cập nhật
      const timer = setTimeout(() => {
        // Tìm input field trong commodity combobox
        const commodityInput = document.querySelector('#commodity_id') as HTMLInputElement;
        if (commodityInput) {
          // Di chuyển con trỏ về cuối text mà không chọn text
          commodityInput.setSelectionRange(commodityInput.value.length, commodityInput.value.length);
          // Bỏ focus để tránh text bị chọn
          commodityInput.blur();
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [itemFormOpen]);
  
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
                <div className="relative">
                  <label htmlFor="order_date" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                    Order Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="flex items-center absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <Input
                      type="date"
                      id="order_date"
                      name="order_date"
                      value={formData.order_date}
                      onChange={handleChange}
                      required
                      className="h-10 pl-9"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <label htmlFor="client_ref_code" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                    Client Reference Code
                  </label>
                  <div className="relative">
                    <div className="flex items-center absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <FileSpreadsheetIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      id="client_ref_code"
                      name="client_ref_code"
                      value={formData.client_ref_code}
                      onChange={handleChange}
                      placeholder="Client's reference code"
                      className="h-10 pl-9"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <label htmlFor="order_status" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                    Status
                  </label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleValueChange('status', value as 'draft' | 'confirmed' | 'completed' | 'cancelled')}
                  >
                    <SelectTrigger id="order_status" className="h-10">
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
                <div className="relative" id="client-dropdown-container">
                  <label htmlFor="client_search" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                    Client <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Ô input tìm kiếm */}
                  <div className="relative">
                    <Input
                      id="client_search"
                      placeholder={formData.client_id 
                        ? clients.find(c => c.id === formData.client_id)?.name || "Search for client..." 
                        : "Search for client..."}
                      value={clientQuery}
                      onChange={(e) => handleClientSearch(e.target.value)}
                      onFocus={() => setShowClientList(true)}
                      className="h-10 pr-8"
                      ref={clientSearchInputRef}
                    />
                    
                    {/* Icon hiển thị giá trị đã chọn hoặc đang tìm kiếm */}
                    <div 
                      className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                      onClick={() => {
                        if (!isSearchingClients) {
                          setShowClientList(!showClientList);
                          
                          // Nếu đang mở danh sách thì cần load dữ liệu
                          if (!showClientList) {
                            performClientSearch('');
                          }
                        }
                      }}
                    >
                      {isSearchingClients ? (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      ) : (
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </div>
                  </div>
                  
                  {/* Dropdown danh sách kết quả */}
                  {showClientList && (
                    <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-[200px] overflow-y-auto">
                      {clients.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-gray-500 text-center">
                          {clientQuery.length < 2 ? 'Type at least 2 characters to search' : 'No clients found'}
                        </div>
                      ) : (
                        <div className="py-1">
                          {clients.map(client => (
                            <div
                              key={client.id}
                              className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${formData.client_id === client.id ? 'bg-blue-100' : ''}`}
                              onClick={() => {
                                handleClientChange(client.id);
                                setClientQuery('');
                                setShowClientList(false);
                              }}
                            >
                              <div className="flex items-center">
                                {formData.client_id === client.id && (
                                  <CheckIcon className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                                )}
                                <span className={formData.client_id === client.id ? "font-medium" : ""}>
                                  {client.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <label htmlFor="order_contact" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                    Contact
                  </label>
                  <div id="contact-field">
                    <Select 
                      value={formData.contact_id} 
                      onValueChange={(value) => handleValueChange('contact_id', value)}
                      disabled={contacts.length === 0}
                    >
                      <SelectTrigger id="order_contact" className="h-10">
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
                
                <div className="relative">
                  <label htmlFor="notes" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                    Notes
                  </label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional information"
                    className="min-h-[40px] resize-none pt-2 px-3"
                  />
                </div>
              </div>
              
              {/* Cột 3: Shipper, Buyer, Vessel/Carrier, Bill of Lading, Bill of Lading Date */}
              <div className="space-y-4">
                <div className="relative" id="shipper-dropdown-container">
                  <label htmlFor="shipper_search" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                    Shipper
                  </label>
                  
                  {/* Ô input tìm kiếm */}
                  <div className="relative">
                    <Input
                      id="shipper_search"
                      placeholder={formData.shipper_id 
                        ? shippers.find(s => s.id === formData.shipper_id)?.name || "Select a shipper..." 
                        : "Select a shipper..."}
                      value={shipperQuery}
                      onChange={(e) => handleShipperSearch(e.target.value)}
                      onFocus={() => setShowShipperList(true)}
                      className="h-10 pr-8"
                      ref={shipperSearchInputRef}
                    />
                    
                    {/* Icon hiển thị giá trị đã chọn hoặc đang tìm kiếm */}
                    <div 
                      className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                      onClick={() => {
                        if (!isSearchingShippers) {
                          setShowShipperList(!showShipperList);
                          
                          if (!showShipperList) {
                            performShipperSearch('');
                          }
                        }
                      }}
                    >
                      {isSearchingShippers ? (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      ) : (
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </div>
                  </div>
                  
                  {/* Dropdown danh sách kết quả */}
                  {showShipperList && (
                    <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-[200px] overflow-y-auto">
                      {shippers.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-gray-500 text-center">
                          {shipperQuery.length < 2 ? 'Type at least 2 characters to search' : 'No shippers found'}
                        </div>
                      ) : (
                        <div className="py-1">
                          <div
                            className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50"
                            onClick={() => {
                              handleValueChange('shipper_id', 'none');
                              setShipperQuery('');
                              setShowShipperList(false);
                            }}
                          >
                            <div className="flex items-center">
                              {!formData.shipper_id && (
                                <CheckIcon className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                              )}
                              <span className={!formData.shipper_id ? "font-medium" : ""}>
                                None
                              </span>
                            </div>
                          </div>
                          {shippers.map(shipper => (
                            <div
                              key={shipper.id}
                              className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${formData.shipper_id === shipper.id ? 'bg-blue-100' : ''}`}
                              onClick={() => {
                                handleValueChange('shipper_id', shipper.id);
                                setShipperQuery('');
                                setShowShipperList(false);
                              }}
                            >
                              <div className="flex items-center">
                                {formData.shipper_id === shipper.id && (
                                  <CheckIcon className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                                )}
                                <span className={formData.shipper_id === shipper.id ? "font-medium" : ""}>
                                  {shipper.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="relative" id="buyer-dropdown-container">
                  <label htmlFor="buyer_search" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                    Buyer
                  </label>
                  
                  {/* Ô input tìm kiếm */}
                  <div className="relative">
                    <Input
                      id="buyer_search"
                      placeholder={formData.buyer_id 
                        ? buyers.find(b => b.id === formData.buyer_id)?.name || "Select a buyer..." 
                        : "Select a buyer..."}
                      value={buyerQuery}
                      onChange={(e) => handleBuyerSearch(e.target.value)}
                      onFocus={() => setShowBuyerList(true)}
                      className="h-10 pr-8"
                      ref={buyerSearchInputRef}
                    />
                    
                    {/* Icon hiển thị giá trị đã chọn hoặc đang tìm kiếm */}
                    <div 
                      className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                      onClick={() => {
                        if (!isSearchingBuyers) {
                          setShowBuyerList(!showBuyerList);
                          
                          if (!showBuyerList) {
                            performBuyerSearch('');
                          }
                        }
                      }}
                    >
                      {isSearchingBuyers ? (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      ) : (
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </div>
                  </div>
                  
                  {/* Dropdown danh sách kết quả */}
                  {showBuyerList && (
                    <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-[200px] overflow-y-auto">
                      {buyers.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-gray-500 text-center">
                          {buyerQuery.length < 2 ? 'Type at least 2 characters to search' : 'No buyers found'}
                        </div>
                      ) : (
                        <div className="py-1">
                          <div
                            className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50"
                            onClick={() => {
                              handleValueChange('buyer_id', 'none');
                              setBuyerQuery('');
                              setShowBuyerList(false);
                            }}
                          >
                            <div className="flex items-center">
                              {!formData.buyer_id && (
                                <CheckIcon className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                              )}
                              <span className={!formData.buyer_id ? "font-medium" : ""}>
                                None
                              </span>
                            </div>
                          </div>
                          {buyers.map(buyer => (
                            <div
                              key={buyer.id}
                              className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${formData.buyer_id === buyer.id ? 'bg-blue-100' : ''}`}
                              onClick={() => {
                                handleValueChange('buyer_id', buyer.id);
                                setBuyerQuery('');
                                setShowBuyerList(false);
                              }}
                            >
                              <div className="flex items-center">
                                {formData.buyer_id === buyer.id && (
                                  <CheckIcon className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                                )}
                                <span className={formData.buyer_id === buyer.id ? "font-medium" : ""}>
                                  {buyer.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <label htmlFor="vessel_carrier" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                    Vessel/Carrier
                  </label>
                  <div className="relative">
                    <div className="flex items-center absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ShipIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      id="vessel_carrier"
                      name="vessel_carrier"
                      value={formData.vessel_carrier}
                      onChange={handleChange}
                      placeholder="Vessel name"
                      className="h-10 pl-9"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <label htmlFor="bill_of_lading" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                    Bill of Lading
                  </label>
                  <div className="relative">
                    <div className="flex items-center absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <FileSpreadsheetIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      id="bill_of_lading"
                      name="bill_of_lading"
                      value={formData.bill_of_lading}
                      onChange={handleChange}
                      placeholder="BoL number"
                      className="h-10 pl-9"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <label htmlFor="bill_of_lading_date" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                    Bill of Lading Date
                  </label>
                  <div className="relative">
                    <div className="flex items-center absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <Input
                      type="date"
                      id="bill_of_lading_date"
                      name="bill_of_lading_date"
                      value={formData.bill_of_lading_date}
                      onChange={handleChange}
                      className="h-10 pl-9"
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
            {/* Commodity field */}
            <div className="relative">
              <label htmlFor="commodity_id" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                Commodity <span className="text-red-500">*</span>
              </label>
              <Combobox 
                value={commodities.find(c => c.id === currentItem.commodity_id) || null} 
                onChange={(commodity: Commodity | null) => {
                  handleItemSelectChange('commodity_id', commodity?.id || '');
                }}
              >
                <div className="relative">
                  <div className="relative w-full cursor-default overflow-hidden rounded-lg border border-input bg-white text-left focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    <Combobox.Input
                      id="commodity_id"
                      className="w-full border-none h-10 pl-3 pr-10 text-sm text-gray-900 focus:ring-0"
                      displayValue={(commodity: Commodity | null) => commodity?.name || ''}
                      onChange={(event) => handleCommoditySearch(event.target.value)}
                      placeholder="Select or search commodity"
                      autoComplete="off"
                      onFocus={(e) => {
                        e.target.setSelectionRange(e.target.value.length, e.target.value.length);
                      }}
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                      {isSearchingCommodities ? (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-1"></div>
                      ) : (
                        <ChevronUpDownIcon
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      )}
                    </Combobox.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Combobox.Options className="absolute z-[999] mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {commodities.length === 0 ? (
                        <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                          {isSearchingCommodities ? 'Searching...' : 
                            commodityQuery.length < 2 ? 'Type at least 2 characters to search' : 'No commodities found.'}
                        </div>
                      ) : (
                        commodities.map((commodity) => (
                          <Combobox.Option
                            key={commodity.id}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-blue-600 text-white' : 'text-gray-900'
                              }`
                            }
                            value={commodity}
                          >
                            {({ selected, active }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {commodity.name}
                                </span>
                                {commodity.description && (
                                  <span className={`block truncate text-xs ${active ? 'text-blue-200' : 'text-gray-500'}`}>
                                    {commodity.description}
                                  </span>
                                )}
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
              {/* Quantity field */}
              <div className="relative">
                <label htmlFor="item_quantity" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  id="item_quantity"
                  name="quantity"
                  value={currentItem.quantity}
                  onChange={handleItemChange}
                  min="0.01"
                  step="0.01"
                  className="h-10"
                />
              </div>
              
              {/* Unit field */}
              <div className="relative">
                <label htmlFor="unit_id" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                  Unit <span className="text-red-500">*</span>
                </label>
                <Combobox value={units.find(u => u.id === currentItem.unit_id) || null} onChange={(unit: Unit | null) => {
                  handleItemSelectChange('unit_id', unit?.id || '');
                }}>
                  <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg border border-input bg-white text-left focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                      <Combobox.Input
                        id="unit_id"
                        className="w-full border-none h-10 pl-3 pr-10 text-sm text-gray-900 focus:ring-0"
                        displayValue={(unit: Unit | null) => unit?.name || ''}
                        onChange={(event) => handleUnitSearch(event.target.value)}
                        placeholder="Select or search unit"
                      />
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        {isSearchingUnits ? (
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-1"></div>
                        ) : (
                          <ChevronUpDownIcon
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                        )}
                      </Combobox.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Combobox.Options className="absolute z-[999] mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {units.length === 0 ? (
                          <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                            {isSearchingUnits ? 'Đang tìm kiếm...' : 
                              unitSearch.length < 2 ? 'Nhập ít nhất 2 ký tự để tìm kiếm' : 'Không tìm thấy đơn vị nào phù hợp.'}
                          </div>
                        ) : (
                          units.map((unit) => (
                            <Combobox.Option
                              key={unit.id}
                              className={({ active }) =>
                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                  active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                }`
                              }
                              value={unit}
                            >
                              {({ selected, active }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
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
            
            {/* Description field */}
            <div className="relative">
              <label htmlFor="item_commodity_description" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 z-10">
                Commodity Description
              </label>
              <Textarea
                id="item_commodity_description"
                name="commodity_description"
                value={currentItem.commodity_description}
                onChange={handleItemChange}
                placeholder="Detailed description of this commodity"
                className="min-h-[40px] resize-none pt-2 px-3"
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