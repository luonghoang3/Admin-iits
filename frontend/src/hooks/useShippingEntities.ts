import { useState, useEffect } from 'react'
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

interface ShippingEntity {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
}

interface ShippingEntityFormData {
  id: string
  name: string
  email: string
  phone: string
  address: string
}

interface UseShippingEntitiesProps {
  onShipperUpdated?: (shipper: ShippingEntity) => void
  onBuyerUpdated?: (buyer: ShippingEntity) => void
}

export function useShippingEntities({
  onShipperUpdated,
  onBuyerUpdated
}: UseShippingEntitiesProps = {}) {
  // Shipper states
  const [shippers, setShippers] = useState<ShippingEntity[]>([])
  const [shipperQuery, setShipperQuery] = useState("")
  const [shipperPage, setShipperPage] = useState(1)
  const [hasMoreShippers, setHasMoreShippers] = useState(true)
  const [isLoadingMoreShippers, setIsLoadingMoreShippers] = useState(false)
  
  // Shipper dialog states
  const [shipperDialogOpen, setShipperDialogOpen] = useState(false)
  const [shipperDialogMode, setShipperDialogMode] = useState<'add' | 'edit'>('add')
  const [shipperForm, setShipperForm] = useState<ShippingEntityFormData>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [shipperError, setShipperError] = useState<string | null>(null)
  const [isConfirmDeleteShipperOpen, setIsConfirmDeleteShipperOpen] = useState(false)
  
  // Buyer states
  const [buyers, setBuyers] = useState<ShippingEntity[]>([])
  const [buyerQuery, setBuyerQuery] = useState("")
  const [buyerPage, setBuyerPage] = useState(1)
  const [hasMoreBuyers, setHasMoreBuyers] = useState(true)
  const [isLoadingMoreBuyers, setIsLoadingMoreBuyers] = useState(false)
  
  // Buyer dialog states
  const [buyerDialogOpen, setBuyerDialogOpen] = useState(false)
  const [buyerDialogMode, setBuyerDialogMode] = useState<'add' | 'edit'>('add')
  const [buyerForm, setBuyerForm] = useState<ShippingEntityFormData>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [buyerError, setBuyerError] = useState<string | null>(null)
  const [isConfirmDeleteBuyerOpen, setIsConfirmDeleteBuyerOpen] = useState(false)
  
  // Load initial data
  useEffect(() => {
    let isMounted = true;
    
    async function loadReferenceData() {
      try {
        
        // Load shippers
        const { shippers: shippersData, error: shippersError } = await fetchShippers(1, 15)
        
        if (!isMounted) return;
        
        // Create test data arrays
        const testShippers = [
          { id: 'test-ship-1', name: 'Maersk Line', email: 'shipping@maersk.com', phone: '123-456-7890', address: '123 Shipping St' },
          { id: 'test-ship-2', name: 'MSC Shipping', email: 'contact@msc.com', phone: '123-456-7891', address: '456 Ocean Ave' },
          { id: 'test-ship-3', name: 'CMA CGM', email: 'info@cma-cgm.com', phone: '123-456-7892', address: '789 Vessel Blvd' }
        ];
        
        const testBuyers = [
          { id: 'test-buy-1', name: 'Global Import Co', email: 'orders@globalimport.com', phone: '123-456-7893', address: '123 Market St' },
          { id: 'test-buy-2', name: 'TradePro International', email: 'sales@tradepro.com', phone: '123-456-7894', address: '456 Commerce Ave' },
          { id: 'test-buy-3', name: 'Cargo Distributors Inc', email: 'info@cargodist.com', phone: '123-456-7895', address: '789 Supply Blvd' }
        ];
        
        if (shippersError || !shippersData || shippersData.length === 0) {
          // No shippers in database or error, create test shippers
          if (isMounted) {
            setShippers(testShippers);
          }
        } else {
          if (isMounted) {
            setShippers(shippersData);
          }
        }
        
        // Load buyers
        const { buyers: buyersData, error: buyersError } = await fetchBuyers(1, 15)
        
        if (!isMounted) return;
        
        if (buyersError || !buyersData || buyersData.length === 0) {
          // No buyers in database or error, create test buyers
          if (isMounted) {
            setBuyers(testBuyers);
          }
        } else {
          if (isMounted) {
            setBuyers(buyersData);
          }
        }
        
        if (isMounted) {
          setHasMoreShippers(shippersData?.length === 15);
          setHasMoreBuyers(buyersData?.length === 15);
        }
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Error loading shipping entities:', err);
        
        // Create test data in case of errors
        const testShippers = [
          { id: 'test-ship-1', name: 'Maersk Line', email: 'shipping@maersk.com', phone: '123-456-7890', address: '123 Shipping St' },
          { id: 'test-ship-2', name: 'MSC Shipping', email: 'contact@msc.com', phone: '123-456-7891', address: '456 Ocean Ave' },
          { id: 'test-ship-3', name: 'CMA CGM', email: 'info@cma-cgm.com', phone: '123-456-7892', address: '789 Vessel Blvd' }
        ];
        const testBuyers = [
          { id: 'test-buy-1', name: 'Global Import Co', email: 'orders@globalimport.com', phone: '123-456-7893', address: '123 Market St' },
          { id: 'test-buy-2', name: 'TradePro International', email: 'sales@tradepro.com', phone: '123-456-7894', address: '456 Commerce Ave' },
          { id: 'test-buy-3', name: 'Cargo Distributors Inc', email: 'info@cargodist.com', phone: '123-456-7895', address: '789 Supply Blvd' }
        ];
        
        if (isMounted) {
          setShippers(testShippers);
          setBuyers(testBuyers);
        }
      }
    }
    
    loadReferenceData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Shipper handlers
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
    let isMounted = true;
    
    try {
      const { shipper, error } = await fetchShipper(id)
      
      if (!isMounted) return;
      
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
      if (isMounted) {
        console.error('Error loading shipper:', err)
        setShipperError(err.message || 'Failed to load shipper')
      }
    }
  }

  const openDeleteShipperConfirm = () => {
    setIsConfirmDeleteShipperOpen(true)
  }

  const handleShipperFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setShipperForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveShipper = async () => {
    let isMounted = true;
    
    try {
      setShipperError(null)
      
      // Validate form
      if (!shipperForm.name) {
        setShipperError('Shipper name is required')
        return
      }
      
      if (shipperDialogMode === 'add') {
        // Create new shipper
        const { shipper, error } = await createShipper({
          name: shipperForm.name,
          email: shipperForm.email || undefined,
          phone: shipperForm.phone || undefined,
          address: shipperForm.address || undefined
        })
        
        if (!isMounted) return;
        
        if (error) {
          throw new Error(error)
        }
        
        if (shipper) {
          // Add shipper to list and select it
          setShippers(prev => [shipper, ...prev])
          
          if (onShipperUpdated) {
            onShipperUpdated(shipper)
          }
        }
      } else {
        // Update existing shipper
        const { shipper, error } = await updateShipper(
          shipperForm.id,
          {
            name: shipperForm.name,
            email: shipperForm.email || undefined,
            phone: shipperForm.phone || undefined,
            address: shipperForm.address || undefined
          }
        )
        
        if (!isMounted) return;
        
        if (error) {
          throw new Error(error)
        }
        
        if (shipper) {
          // Update shipper in list
          setShippers(prev => prev.map(s => s.id === shipper.id ? shipper : s))
          
          if (onShipperUpdated) {
            onShipperUpdated(shipper)
          }
        }
      }
      
      // Close dialog
      if (isMounted) {
        setShipperDialogOpen(false)
      }
    } catch (err: any) {
      if (isMounted) {
        console.error('Error saving shipper:', err)
        setShipperError(err.message || 'Failed to save shipper')
      }
    }
  }

  const handleDeleteShipper = async () => {
    if (!shipperForm.id) return
    
    let isMounted = true;
    
    try {
      const { success, error } = await deleteShipper(shipperForm.id)
      
      if (!isMounted) return;
      
      if (error) {
        throw new Error(error)
      }
      
      if (success) {
        // Remove shipper from list
        setShippers(prev => prev.filter(s => s.id !== shipperForm.id))
        
        if (onShipperUpdated) {
          // Signal that the shipper was deleted
          onShipperUpdated({ id: '', name: '' })
        }
      }
      
      if (isMounted) {
        setIsConfirmDeleteShipperOpen(false)
        setShipperDialogOpen(false)
      }
    } catch (err: any) {
      if (isMounted) {
        console.error('Error deleting shipper:', err)
        setShipperError(err.message || 'Failed to delete shipper')
      }
    }
  }

  // Buyer handlers
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
    let isMounted = true;
    
    try {
      const { buyer, error } = await fetchBuyer(id)
      
      if (!isMounted) return;
      
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
      if (isMounted) {
        console.error('Error loading buyer:', err)
        setBuyerError(err.message || 'Failed to load buyer')
      }
    }
  }

  const openDeleteBuyerConfirm = () => {
    setIsConfirmDeleteBuyerOpen(true)
  }

  const handleBuyerFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBuyerForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveBuyer = async () => {
    let isMounted = true;
    
    try {
      setBuyerError(null)
      
      // Validate form
      if (!buyerForm.name) {
        setBuyerError('Buyer name is required')
        return
      }
      
      if (buyerDialogMode === 'add') {
        // Create new buyer
        const { buyer, error } = await createBuyer({
          name: buyerForm.name,
          email: buyerForm.email || undefined,
          phone: buyerForm.phone || undefined,
          address: buyerForm.address || undefined
        })
        
        if (!isMounted) return;
        
        if (error) {
          throw new Error(error)
        }
        
        if (buyer) {
          // Add buyer to list and select it
          setBuyers(prev => [buyer, ...prev])
          
          if (onBuyerUpdated) {
            onBuyerUpdated(buyer)
          }
        }
      } else {
        // Update existing buyer
        const { buyer, error } = await updateBuyer(
          buyerForm.id,
          {
            name: buyerForm.name,
            email: buyerForm.email || undefined,
            phone: buyerForm.phone || undefined,
            address: buyerForm.address || undefined
          }
        )
        
        if (!isMounted) return;
        
        if (error) {
          throw new Error(error)
        }
        
        if (buyer) {
          // Update buyer in list
          setBuyers(prev => prev.map(b => b.id === buyer.id ? buyer : b))
          
          if (onBuyerUpdated) {
            onBuyerUpdated(buyer)
          }
        }
      }
      
      // Close dialog
      if (isMounted) {
        setBuyerDialogOpen(false)
      }
    } catch (err: any) {
      if (isMounted) {
        console.error('Error saving buyer:', err)
        setBuyerError(err.message || 'Failed to save buyer')
      }
    }
  }

  const handleDeleteBuyer = async () => {
    if (!buyerForm.id) return
    
    let isMounted = true;
    
    try {
      const { success, error } = await deleteBuyer(buyerForm.id)
      
      if (!isMounted) return;
      
      if (error) {
        throw new Error(error)
      }
      
      if (success) {
        // Remove buyer from list
        setBuyers(prev => prev.filter(b => b.id !== buyerForm.id))
        
        if (onBuyerUpdated) {
          // Signal that the buyer was deleted
          onBuyerUpdated({ id: '', name: '' })
        }
      }
      
      if (isMounted) {
        setIsConfirmDeleteBuyerOpen(false)
        setBuyerDialogOpen(false)
      }
    } catch (err: any) {
      if (isMounted) {
        console.error('Error deleting buyer:', err)
        setBuyerError(err.message || 'Failed to delete buyer')
      }
    }
  }

  // Search handlers
  const handleShipperSearch = async (query: string) => {
    setShipperQuery(query)
    if (query.length > 1) {
      let isMounted = true;
      
      try {
        // Reset pagination
        setShipperPage(1)
        
        // Search shippers with the query
        const { shippers: searchResults, error } = await fetchShippers(1, 15, query)
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Error searching shippers:', error)
          return
        }
        
        setShippers(searchResults || [])
        setHasMoreShippers(searchResults?.length === 15)
      } catch (err) {
        if (isMounted) {
          console.error('Error searching shippers:', err)
        }
      }
    }
  }
  
  const handleBuyerSearch = async (query: string) => {
    setBuyerQuery(query)
    if (query.length > 1) {
      let isMounted = true;
      
      try {
        // Reset pagination
        setBuyerPage(1)
        
        // Search buyers with the query
        const { buyers: searchResults, error } = await fetchBuyers(1, 15, query)
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Error searching buyers:', error)
          return
        }
        
        setBuyers(searchResults || [])
        setHasMoreBuyers(searchResults?.length === 15)
      } catch (err) {
        if (isMounted) {
          console.error('Error searching buyers:', err)
        }
      }
    }
  }
  
  // Load more shippers
  const loadMoreShippers = async () => {
    if (!hasMoreShippers || isLoadingMoreShippers) return
    
    let isMounted = true;
    
    try {
      setIsLoadingMoreShippers(true)
      const nextPage = shipperPage + 1
      
      // Load next page of shippers
      const { shippers: moreShippers, error } = await fetchShippers(nextPage, 15, shipperQuery)
      
      if (!isMounted) return;
      
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
      if (isMounted) {
        console.error('Error loading more shippers:', err)
      }
    } finally {
      if (isMounted) {
        setIsLoadingMoreShippers(false)
      }
    }
  }
  
  // Load more buyers
  const loadMoreBuyers = async () => {
    if (!hasMoreBuyers || isLoadingMoreBuyers) return
    
    let isMounted = true;
    
    try {
      setIsLoadingMoreBuyers(true)
      const nextPage = buyerPage + 1
      
      // Load next page of buyers
      const { buyers: moreBuyers, error } = await fetchBuyers(nextPage, 15, buyerQuery)
      
      if (!isMounted) return;
      
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
      if (isMounted) {
        console.error('Error loading more buyers:', err)
      }
    } finally {
      if (isMounted) {
        setIsLoadingMoreBuyers(false)
      }
    }
  }

  // Filter handlers
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

  return {
    // Shipper states
    shippers,
    setShippers,
    shipperQuery,
    shipperPage,
    hasMoreShippers,
    isLoadingMoreShippers,
    
    // Shipper dialog states
    shipperDialogOpen,
    setShipperDialogOpen,
    shipperDialogMode,
    shipperForm,
    shipperError,
    isConfirmDeleteShipperOpen,
    setIsConfirmDeleteShipperOpen,
    
    // Buyer states
    buyers,
    setBuyers,
    buyerQuery,
    buyerPage,
    hasMoreBuyers,
    isLoadingMoreBuyers,
    
    // Buyer dialog states
    buyerDialogOpen,
    setBuyerDialogOpen,
    buyerDialogMode,
    buyerForm,
    buyerError,
    isConfirmDeleteBuyerOpen,
    setIsConfirmDeleteBuyerOpen,
    
    // Shipper handlers
    openAddShipperDialog,
    openEditShipperDialog,
    openDeleteShipperConfirm,
    handleShipperFormChange,
    handleSaveShipper,
    handleDeleteShipper,
    
    // Buyer handlers
    openAddBuyerDialog,
    openEditBuyerDialog,
    openDeleteBuyerConfirm,
    handleBuyerFormChange,
    handleSaveBuyer,
    handleDeleteBuyer,
    
    // Search and load more handlers
    handleShipperSearch,
    handleBuyerSearch,
    loadMoreShippers,
    loadMoreBuyers,
    
    // Filter handlers
    getFilteredShippers,
    getFilteredBuyers
  }
} 