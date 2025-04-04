import { useState, useEffect } from 'react'
import { 
  fetchClients, 
  fetchClient,
  fetchOrderItems,
  fetchCommodities,
  fetchUnits,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
} from '@/utils/supabase/client'
import { fetchShippers, fetchBuyers } from '@/utils/supabase/shipping'
import { createClient } from '@/utils/supabase/client'

// Types
interface OrderFormData {
  id?: string;
  client_id: string;
  contact_id?: string;
  type: 'international' | 'local';
  department: 'marine' | 'agriculture' | 'consumer goods';
  order_date: string;
  client_ref_code?: string | null;
  order_number?: string;
  notes?: string | null;
  shipper_id?: string;
  buyer_id?: string;
  vessel_carrier?: string;
  bill_of_lading?: string;
  bill_of_lading_date?: string | null;
  status?: 'draft' | 'confirmed' | 'completed' | 'cancelled';
}

interface OrderItem {
  id?: string
  order_id?: string
  commodity_id: string
  quantity: number
  unit_id: string
  commodity_description: string | null
  commodities?: {
    id: string
    name: string
    description: string | null
  }
  units?: {
    id: string
    name: string
  }
  created_at?: string
  updated_at?: string
}

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
}

interface Contact {
  id: string
  client_id: string
  full_name: string
  position?: string
  email?: string
  phone?: string
}

interface Commodity {
  id: string
  name: string
  description: string | null
}

interface Unit {
  id: string
  name: string
}

interface UseOrderFormProps {
  initialOrderData?: OrderFormData
  orderId?: string
}

export function useOrderForm({ initialOrderData, orderId }: UseOrderFormProps = {}) {
  // Main form state
  const [formData, setFormData] = useState<OrderFormData>(initialOrderData || {
    client_id: '',
    contact_id: undefined,
    type: 'international',
    department: 'marine',
    order_date: new Date().toISOString().substring(0, 10),
    client_ref_code: null,
    order_number: undefined,
    notes: null,
    shipper_id: undefined,
    buyer_id: undefined,
    vessel_carrier: undefined,
    bill_of_lading: undefined,
    bill_of_lading_date: null,
    status: 'draft'
  })

  // Items state 
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [currentItem, setCurrentItem] = useState<OrderItem>({
    commodity_id: '',
    quantity: 1,
    unit_id: '',
    commodity_description: ''
  })
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [itemError, setItemError] = useState<string | null>(null)
  const [isEditingItem, setIsEditingItem] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)

  // Reference data
  const [clients, setClients] = useState<Client[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [shippers, setShippers] = useState<any[]>([])
  const [buyers, setBuyers] = useState<any[]>([])

  // UI states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search states
  const [clientQuery, setClientQuery] = useState("")
  const [commoditySearch, setCommoditySearch] = useState("")
  const [unitSearch, setUnitSearch] = useState("")
  const [shipperQuery, setShipperQuery] = useState("")
  const [buyerQuery, setBuyerQuery] = useState("")

  // Pagination states
  const [clientPage, setClientPage] = useState(1)
  const [commodityPage, setCommodityPage] = useState(1)
  const [shipperPage, setShipperPage] = useState(1)
  const [buyerPage, setBuyerPage] = useState(1)
  const [hasMoreClients, setHasMoreClients] = useState(true)
  const [hasMoreCommodities, setHasMoreCommodities] = useState(true)
  const [hasMoreShippers, setHasMoreShippers] = useState(true)
  const [hasMoreBuyers, setHasMoreBuyers] = useState(true)
  const [isLoadingMoreClients, setIsLoadingMoreClients] = useState(false)
  const [isLoadingMoreCommodities, setIsLoadingMoreCommodities] = useState(false)
  const [isLoadingMoreShippers, setIsLoadingMoreShippers] = useState(false) 
  const [isLoadingMoreBuyers, setIsLoadingMoreBuyers] = useState(false)

  // Load reference data
  useEffect(() => {
    let isMounted = true;
    
    async function loadReferenceData() {
      try {
        setLoading(true)
        
        // Load initial clients (first 15 only)
        const { clients: clientsData, error: clientsError } = await fetchClients(1, 15)
        
        if (!isMounted) return;
        
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
        
        if (!isMounted) return;
        
        if (commoditiesData) {
          setCommodities(commoditiesData)
          setHasMoreCommodities(commoditiesData.length === 15)
        }
        if (unitsData) setUnits(unitsData)
        
        // Load initial shippers (first 15 only)
        const { shippers: shippersData } = await fetchShippers(1, 15)
        if (!isMounted) return;
        
        if (shippersData) {
          setShippers(shippersData)
          setHasMoreShippers(shippersData.length === 15)
        }
        
        // Load initial buyers (first 15 only)
        const { buyers: buyersData } = await fetchBuyers(1, 15)
        if (!isMounted) return;
        
        if (buyersData) {
          setBuyers(buyersData)
          setHasMoreBuyers(buyersData.length === 15)
        }
      } catch (err: any) {
        if (!isMounted) return;
        
        console.error('Error loading reference data:', err)
        setError(err.message || 'Failed to load reference data')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    loadReferenceData()
    
    return () => {
      isMounted = false;
    };
  }, [])

  // Load order items when orderId changes
  useEffect(() => {
    let isMounted = true;
    
    const loadOrderItems = async () => {
      if (!orderId) return;
      
      try {
        // Get order items through the API
        const { orderItems: items, error } = await fetchOrderItems(orderId)
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Error loading order items:', error)
          return;
        }
        
        if (items && items.length > 0) {
          // Process items to ensure they have the right format for rendering
          const processedItems = items.map(item => {
            // Ensure the item has the right structure for the UI
            return {
              id: item.id,
              order_id: item.order_id,
              commodity_id: item.commodity_id,
              quantity: item.quantity,
              unit_id: item.unit_id,
              commodity_description: item.commodity_description,
              // Ensure commodities and units are properly structured
              commodities: item.commodities ? {
                id: item.commodities.id,
                name: item.commodities.name,
                description: item.commodities.description
              } : undefined,
              units: item.units ? {
                id: item.units.id,
                name: item.units.name
              } : undefined,
              created_at: item.created_at,
              updated_at: item.updated_at
            };
          });
          
          if (isMounted) {
            setOrderItems(processedItems);
          }
        } else {
          if (isMounted) {
            setOrderItems([]);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error in loadOrderItems:', err)
          setOrderItems([]);
        }
      }
    }
    
    if (orderId) {
      loadOrderItems()
    }
    
    return () => {
      isMounted = false;
    };
  }, [orderId])

  // Item form handlers
  const openAddItemForm = () => {
    setCurrentItem({
      commodity_id: '',
      quantity: 1,
      unit_id: '',
      commodity_description: ''
    })
    setIsEditingItem(false)
    setEditingItemIndex(null)
    setItemError(null)
    setItemFormOpen(true)
  }
  
  const openEditItemForm = (index: number) => {
    if (!orderItems || orderItems.length === 0) {
      console.error("Cannot edit item - orderItems is empty");
      return;
    }
    
    if (index < 0 || index >= orderItems.length) {
      console.error(`Invalid index ${index} for orderItems with length ${orderItems.length}`);
      return;
    }
    
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
  
  const handleSaveItem = async () => {
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
    
    try {
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
      
      if (orderId) {
        // We're in edit mode with a real DB connection
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
          
          if (error) {
            console.error("Error updating item:", error);
            throw new Error(error);
          }
          
          // Update the items list
          setOrderItems(prev => 
            prev.map(item => item.id === currentItem.id ? itemWithDetails : item)
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
          
          if (error) {
            console.error("Error creating item:", error);
            throw new Error(error);
          }
          
          if (orderItem) {
            const newItem: OrderItem = {
              ...orderItem,
              commodities: selectedCommodity ? {
                id: selectedCommodity.id,
                name: selectedCommodity.name,
                description: selectedCommodity.description
              } : { id: currentItem.commodity_id, name: 'Unknown', description: null },
              units: selectedUnit ? {
                id: selectedUnit.id,
                name: selectedUnit.name
              } : { id: currentItem.unit_id, name: 'Unknown' }
            }
            setOrderItems(prev => [...prev, newItem])
          }
        }
      } else {
        // We're in add mode, just update the local state
        if (isEditingItem && editingItemIndex !== null) {
          // Update existing item
          const updatedItems = [...orderItems]
          updatedItems[editingItemIndex] = itemWithDetails
          setOrderItems(updatedItems)
        } else {
          // Add new item
          setOrderItems(prev => [...prev, itemWithDetails])
        }
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
    } catch (err: any) {
      console.error('Error saving order item:', err)
      setItemError(err.message || 'Failed to save order item')
    }
  }
  
  const handleDeleteItem = async (indexOrId: number | string) => {
    if (orderId && typeof indexOrId === 'string') {
      // In edit mode with a real DB item
      if (confirm('Are you sure you want to delete this item?')) {
        try {
          const { success, error } = await deleteOrderItem(indexOrId)
          
          if (error) throw new Error(error)
          
          if (success) {
            // Remove the item from the list
            setOrderItems(prev => prev.filter(item => item.id !== indexOrId))
          }
        } catch (err: any) {
          console.error('Error deleting order item:', err)
          setError(err.message || 'Failed to delete order item')
        }
      }
    } else if (typeof indexOrId === 'number') {
      // In add mode with local items
      setOrderItems(prev => prev.filter((_, i) => i !== indexOrId))
    }
  }

  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleValueChange = (name: string, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === "none" ? null : value
    }))
  }

  // Search handlers
  const handleClientSearch = async (query: string) => {
    setClientQuery(query)
    try {
      setLoading(true)
      setClientPage(1)
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

  const handleCommoditySearch = async (query: string) => {
    setCommoditySearch(query)
    
    try {
      // Reset pagination
      setCommodityPage(1)
      
      // Search commodities with the query
      const { commodities: searchResults } = await fetchCommodities(1, 15, query)
      
      if (searchResults) {
        setCommodities(searchResults)
        setHasMoreCommodities(searchResults.length === 15)
      }
    } catch (err) {
      console.error('Error searching commodities:', err)
    }
  }

  const handleShipperSearch = async (query: string) => {
    setShipperQuery(query)
    try {
      setLoading(true)
      setShipperPage(1)
      const { shippers: searchResults, error } = await fetchShippers(1, 15, query)
      
      if (error) {
        console.error('Error searching shippers:', error)
        return
      }
      
      setShippers(searchResults || [])
      setHasMoreShippers(searchResults?.length === 15)
    } catch (err) {
      console.error('Error searching shippers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBuyerSearch = async (query: string) => {
    setBuyerQuery(query)
    try {
      setLoading(true)
      setBuyerPage(1)
      const { buyers: searchResults, error } = await fetchBuyers(1, 15, query)
      
      if (error) {
        console.error('Error searching buyers:', error)
        return
      }
      
      setBuyers(searchResults || [])
      setHasMoreBuyers(searchResults?.length === 15)
    } catch (err) {
      console.error('Error searching buyers:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter functions
  const getFilteredCommodities = () => {
    if (commoditySearch === '') {
      return commodities
    }
    
    return commodities.filter(commodity =>
      commodity.name.toLowerCase().includes(commoditySearch.toLowerCase())
    )
  }
  
  // Get filtered units based on search
  const getFilteredUnits = () => {
    if (unitSearch === '') {
      return units
    }
    
    return units.filter(unit =>
      unit.name.toLowerCase().includes(unitSearch.toLowerCase())
    )
  }

  const getFilteredClients = () => {
    return clientQuery === ''
      ? clients
      : clients.filter(client =>
          client.name
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(clientQuery.toLowerCase().replace(/\s+/g, ''))
        )
  }

  const getFilteredShippers = () => {
    return shipperQuery === ''
      ? shippers
      : shippers.filter(shipper =>
          shipper.name
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(shipperQuery.toLowerCase().replace(/\s+/g, ''))
        )
  }

  const getFilteredBuyers = () => {
    return buyerQuery === ''
      ? buyers
      : buyers.filter(buyer =>
          buyer.name
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(buyerQuery.toLowerCase().replace(/\s+/g, ''))
        )
  }

  // Load more commodities
  const loadMoreCommodities = async () => {
    if (!hasMoreCommodities || isLoadingMoreCommodities) return
    
    try {
      setIsLoadingMoreCommodities(true)
      const nextPage = commodityPage + 1
      
      // Load next page of commodities
      const { commodities: moreCommodities } = await fetchCommodities(nextPage, 15, commoditySearch)
      
      if (moreCommodities && moreCommodities.length > 0) {
        setCommodities(prev => [...prev, ...moreCommodities])
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

  return {
    // State
    formData,
    setFormData,
    orderItems,
    setOrderItems,
    currentItem,
    loading,
    saving,
    setSaving,
    error,
    setError,
    itemFormOpen,
    itemError,
    isEditingItem,
    
    // Reference data
    clients,
    commodities,
    units,
    shippers,
    buyers,
    
    // Search states
    clientQuery,
    commoditySearch,
    unitSearch,
    shipperQuery,
    buyerQuery,
    
    // Search handlers
    handleClientSearch,
    handleCommoditySearch,
    handleShipperSearch,
    handleBuyerSearch,
    setCommoditySearch,
    setUnitSearch,
    
    // Filtered data getters
    getFilteredCommodities,
    getFilteredUnits,
    getFilteredClients,
    getFilteredShippers,
    getFilteredBuyers,
    
    // Item form handlers
    openAddItemForm,
    openEditItemForm,
    handleItemChange,
    handleItemSelectChange,
    handleSaveItem,
    handleDeleteItem,
    setItemFormOpen,
    
    // Form handlers
    handleChange,
    handleValueChange,
    hasMoreCommodities,
    isLoadingMoreCommodities,
    loadMoreCommodities
  }
} 