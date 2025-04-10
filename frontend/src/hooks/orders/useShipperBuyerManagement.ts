'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import {
  fetchShippers,
  fetchShipper,
  createShipper,
  updateShipper,
  deleteShipper
} from '@/utils/supabase/shipping'
import {
  fetchBuyers,
  fetchBuyer,
  createBuyer,
  updateBuyer,
  deleteBuyer
} from '@/utils/supabase/buyers'
import { Shipper, Buyer } from '@/types/orders'

interface UseShipperBuyerManagementProps {
  initialShipperId?: string
  initialBuyerId?: string
  onChange?: (data: { shipperId?: string; buyerId?: string }) => void
}

export default function useShipperBuyerManagement({
  initialShipperId,
  initialBuyerId,
  onChange
}: UseShipperBuyerManagementProps) {
  const { toast } = useToast()
  
  // Shipper state
  const [shipper, setShipper] = useState<Shipper | null>(null)
  const [shippers, setShippers] = useState<Shipper[]>([])
  const [shipperSearch, setShipperSearch] = useState('')
  const [hasMoreShippers, setHasMoreShippers] = useState(false)
  const [isLoadingShippers, setIsLoadingShippers] = useState(false)
  const [isLoadingMoreShippers, setIsLoadingMoreShippers] = useState(false)
  const [shipperDialogOpen, setShipperDialogOpen] = useState(false)
  const [shipperDialogMode, setShipperDialogMode] = useState<'add' | 'edit'>('add')
  const [isConfirmDeleteShipperOpen, setIsConfirmDeleteShipperOpen] = useState(false)
  const [shipperError, setShipperError] = useState<string | null>(null)
  const [shipperForm, setShipperForm] = useState({
    id: '',
    name: '',
    address: '',
    phone: '',
    email: ''
  })
  
  // Buyer state
  const [buyer, setBuyer] = useState<Buyer | null>(null)
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [buyerSearch, setBuyerSearch] = useState('')
  const [hasMoreBuyers, setHasMoreBuyers] = useState(false)
  const [isLoadingBuyers, setIsLoadingBuyers] = useState(false)
  const [isLoadingMoreBuyers, setIsLoadingMoreBuyers] = useState(false)
  const [buyerDialogOpen, setBuyerDialogOpen] = useState(false)
  const [buyerDialogMode, setBuyerDialogMode] = useState<'add' | 'edit'>('add')
  const [isConfirmDeleteBuyerOpen, setIsConfirmDeleteBuyerOpen] = useState(false)
  const [buyerError, setBuyerError] = useState<string | null>(null)
  const [buyerForm, setBuyerForm] = useState({
    id: '',
    name: '',
    address: '',
    phone: '',
    email: ''
  })

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    setIsLoadingShippers(true)
    setIsLoadingBuyers(true)
    
    try {
      // Fetch shippers
      const { data: shippersData, hasMore: hasMoreShippersData, error: shippersError } = 
        await fetchShippers({ page: 1, searchQuery: '' })
      
      if (shippersError) {
        throw new Error(`Error fetching shippers: ${shippersError}`)
      }
      
      setShippers(shippersData as Shipper[])
      setHasMoreShippers(hasMoreShippersData)
      
      // Fetch initial shipper if provided
      if (initialShipperId) {
        const { data: shipperData, error: shipperError } = 
          await fetchShipper(initialShipperId)
        
        if (shipperError) {
          console.error(`Error fetching initial shipper: ${shipperError}`)
        } else if (shipperData) {
          setShipper(shipperData as Shipper)
        }
      }
    } catch (error) {
      console.error('Error fetching shippers:', error)
      toast({
        title: 'Error',
        description: 'Failed to load shippers',
        variant: 'destructive'
      })
    } finally {
      setIsLoadingShippers(false)
    }
    
    try {
      // Fetch buyers
      const { data: buyersData, hasMore: hasMoreBuyersData, error: buyersError } = 
        await fetchBuyers({ page: 1, searchQuery: '' })
      
      if (buyersError) {
        throw new Error(`Error fetching buyers: ${buyersError}`)
      }
      
      setBuyers(buyersData as Buyer[])
      setHasMoreBuyers(hasMoreBuyersData)
      
      // Fetch initial buyer if provided
      if (initialBuyerId) {
        const { data: buyerData, error: buyerError } = 
          await fetchBuyer(initialBuyerId)
        
        if (buyerError) {
          console.error(`Error fetching initial buyer: ${buyerError}`)
        } else if (buyerData) {
          setBuyer(buyerData as Buyer)
        }
      }
    } catch (error) {
      console.error('Error fetching buyers:', error)
      toast({
        title: 'Error',
        description: 'Failed to load buyers',
        variant: 'destructive'
      })
    } finally {
      setIsLoadingBuyers(false)
    }
  }, [initialShipperId, initialBuyerId, toast])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  // Shipper handlers
  const onShipperSearch = async (query: string) => {
    setShipperSearch(query)

    // Trigger search even for empty query to reset list if needed, or based on specific logic
    // if (query.length > 2 || query.length === 0) { 
    setIsLoadingShippers(true)

    try {
      const { data, hasMore, error } = await fetchShippers({ 
        page: 1, 
        searchQuery: query 
      })

      if (error) {
        throw new Error(`Error searching shippers: ${error}`)
      }

      let updatedShippers = data as Shipper[];
      // Ensure the currently selected shipper is included, even if not in search results
      if (shipper && !updatedShippers.some(s => s.id === shipper.id)) {
        updatedShippers = [shipper, ...updatedShippers];
      }

      setShippers(updatedShippers)
      setHasMoreShippers(hasMore)
    } catch (error) {
      console.error('Error searching shippers:', error)
      // Optionally show toast
    } finally {
      setIsLoadingShippers(false)
    }
    // }
  }

  const onLoadMoreShippers = async () => {
    if (isLoadingMoreShippers) return
    
    setIsLoadingMoreShippers(true)
    
    try {
      const { data, hasMore, error } = await fetchShippers({ 
        page: Math.ceil(shippers.length / 10) + 1, 
        searchQuery: shipperSearch 
      })
      
      if (error) {
        throw new Error(`Error loading more shippers: ${error}`)
      }
      
      setShippers([...shippers, ...(data as Shipper[])])
      setHasMoreShippers(hasMore)
    } catch (error) {
      console.error('Error loading more shippers:', error)
    } finally {
      setIsLoadingMoreShippers(false)
    }
  }

  const onShipperChange = (shipperId: string) => {
    const selectedShipper = shippers.find(s => s.id === shipperId) || null
    setShipper(selectedShipper)
    
    if (onChange) {
      onChange({ 
        shipperId: selectedShipper?.id, 
        buyerId: buyer?.id 
      })
    }
    // Reset search after selection
    setShipperSearch('') 
  }

  const openAddShipperDialog = () => {
    setShipperForm({
      id: '',
      name: '',
      address: '',
      phone: '',
      email: ''
    })
    setShipperError(null)
    setShipperDialogMode('add')
    setShipperDialogOpen(true)
  }

  const openEditShipperDialog = () => {
    if (!shipper) return
    
    setShipperForm({
      id: shipper.id,
      name: shipper.name,
      address: shipper.address || '',
      phone: shipper.phone || '',
      email: shipper.email || ''
    })
    setShipperError(null)
    setShipperDialogMode('edit')
    setShipperDialogOpen(true)
  }

  const openDeleteShipperConfirm = () => {
    if (!shipper) return
    setIsConfirmDeleteShipperOpen(true)
  }

  const handleShipperFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setShipperForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveShipper = async () => {
    setShipperError(null)
    
    if (!shipperForm.name.trim()) {
      setShipperError('Shipper name is required')
      return
    }

    try {
      let newShipper: Shipper
      
      if (shipperDialogMode === 'add') {
        const { data, error } = await createShipper({
          name: shipperForm.name,
          address: shipperForm.address || undefined,
          phone: shipperForm.phone || undefined,
          email: shipperForm.email || undefined
        })
        
        if (error) {
          throw new Error(`Error creating shipper: ${error}`)
        }
        
        newShipper = data
        
        // Add to list
        setShippers(prev => [data, ...prev])
        toast({
          title: 'Success',
          description: 'Shipper created successfully'
        })
      } else {
        if (!shipperForm.id) return
        
        const { data, error } = await updateShipper(shipperForm.id, {
          name: shipperForm.name,
          address: shipperForm.address || undefined,
          phone: shipperForm.phone || undefined,
          email: shipperForm.email || undefined
        })
        
        if (error) {
          throw new Error(`Error updating shipper: ${error}`)
        }
        
        newShipper = data
        
        // Update in list
        setShippers(prev => 
          prev.map(s => s.id === data.id ? data : s)
        )
        toast({
          title: 'Success',
          description: 'Shipper updated successfully'
        })
      }
      
      // Set as selected
      setShipper(newShipper)
      
      if (onChange) {
        onChange({ 
          shipperId: newShipper.id, 
          buyerId: buyer?.id 
        })
      }
      
      setShipperDialogOpen(false)
    } catch (error: any) {
      console.error('Error saving shipper:', error)
      setShipperError('Failed to save shipper. Please try again.')
    }
  }

  const handleDeleteShipper = async () => {
    if (!shipper) return
    
    try {
      const { error } = await deleteShipper(shipper.id)
      
      if (error) {
        throw new Error(`Error deleting shipper: ${error}`)
      }
      
      // Remove from list
      setShippers(prev => prev.filter(s => s.id !== shipper.id))
      
      // Clear selection
      setShipper(null)
      
      if (onChange) {
        onChange({ 
          shipperId: undefined, 
          buyerId: buyer?.id 
        })
      }
      
      toast({
        title: 'Success',
        description: 'Shipper deleted successfully'
      })
      
      setIsConfirmDeleteShipperOpen(false)
    } catch (error) {
      console.error('Error deleting shipper:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete shipper',
        variant: 'destructive'
      })
    }
  }

  // Buyer handlers
  const onBuyerSearch = async (query: string) => {
    setBuyerSearch(query)

    // Trigger search even for empty query
    // if (query.length > 2 || query.length === 0) {
    setIsLoadingBuyers(true)

    try {
      const { data, hasMore, error } = await fetchBuyers({ 
        page: 1, 
        searchQuery: query 
      })

      if (error) {
        throw new Error(`Error searching buyers: ${error}`)
      }

      let updatedBuyers = data as Buyer[];
      // Ensure the currently selected buyer is included
      if (buyer && !updatedBuyers.some(b => b.id === buyer.id)) {
        updatedBuyers = [buyer, ...updatedBuyers];
      }

      setBuyers(updatedBuyers)
      setHasMoreBuyers(hasMore)
    } catch (error) {
      console.error('Error searching buyers:', error)
      // Optionally show toast
    } finally {
      setIsLoadingBuyers(false)
    }
    // }
  }

  const onLoadMoreBuyers = async () => {
    if (isLoadingMoreBuyers) return
    
    setIsLoadingMoreBuyers(true)
    
    try {
      const { data, hasMore, error } = await fetchBuyers({ 
        page: Math.ceil(buyers.length / 10) + 1, 
        searchQuery: buyerSearch 
      })
      
      if (error) {
        throw new Error(`Error loading more buyers: ${error}`)
      }
      
      setBuyers([...buyers, ...(data as Buyer[])])
      setHasMoreBuyers(hasMore)
    } catch (error) {
      console.error('Error loading more buyers:', error)
    } finally {
      setIsLoadingMoreBuyers(false)
    }
  }

  const onBuyerChange = (buyerId: string) => {
    const selectedBuyer = buyers.find(b => b.id === buyerId) || null
    setBuyer(selectedBuyer)
    
    if (onChange) {
      onChange({ 
        shipperId: shipper?.id, 
        buyerId: selectedBuyer?.id 
      })
    }
    // Reset search after selection
    setBuyerSearch('') 
  }

  const openAddBuyerDialog = () => {
    setBuyerForm({
      id: '',
      name: '',
      address: '',
      phone: '',
      email: ''
    })
    setBuyerError(null)
    setBuyerDialogMode('add')
    setBuyerDialogOpen(true)
  }

  const openEditBuyerDialog = () => {
    if (!buyer) return
    
    setBuyerForm({
      id: buyer.id,
      name: buyer.name,
      address: buyer.address || '',
      phone: buyer.phone || '',
      email: buyer.email || ''
    })
    setBuyerError(null)
    setBuyerDialogMode('edit')
    setBuyerDialogOpen(true)
  }

  const openDeleteBuyerConfirm = () => {
    if (!buyer) return
    setIsConfirmDeleteBuyerOpen(true)
  }

  const handleBuyerFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBuyerForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveBuyer = async () => {
    setBuyerError(null)
    
    if (!buyerForm.name.trim()) {
      setBuyerError('Buyer name is required')
      return
    }

    try {
      let newBuyer: Buyer
      
      if (buyerDialogMode === 'add') {
        const { data, error } = await createBuyer({
          name: buyerForm.name,
          address: buyerForm.address || undefined,
          phone: buyerForm.phone || undefined,
          email: buyerForm.email || undefined
        })
        
        if (error) {
          throw new Error(`Error creating buyer: ${error}`)
        }
        
        newBuyer = data
        
        // Add to list
        setBuyers(prev => [data, ...prev])
        toast({
          title: 'Success',
          description: 'Buyer created successfully'
        })
      } else {
        if (!buyerForm.id) return
        
        const { data, error } = await updateBuyer(buyerForm.id, {
          name: buyerForm.name,
          address: buyerForm.address || undefined,
          phone: buyerForm.phone || undefined,
          email: buyerForm.email || undefined
        })
        
        if (error) {
          throw new Error(`Error updating buyer: ${error}`)
        }
        
        newBuyer = data
        
        // Update in list
        setBuyers(prev => 
          prev.map(b => b.id === data.id ? data : b)
        )
        toast({
          title: 'Success',
          description: 'Buyer updated successfully'
        })
      }
      
      // Set as selected
      setBuyer(newBuyer)
      
      if (onChange) {
        onChange({ 
          shipperId: shipper?.id, 
          buyerId: newBuyer.id 
        })
      }
      
      setBuyerDialogOpen(false)
    } catch (error: any) {
      console.error('Error saving buyer:', error)
      setBuyerError('Failed to save buyer. Please try again.')
    }
  }

  const handleDeleteBuyer = async () => {
    if (!buyer) return
    
    try {
      const { error } = await deleteBuyer(buyer.id)
      
      if (error) {
        throw new Error(`Error deleting buyer: ${error}`)
      }
      
      // Remove from list
      setBuyers(prev => prev.filter(b => b.id !== buyer.id))
      
      // Clear selection
      setBuyer(null)
      
      if (onChange) {
        onChange({ 
          shipperId: shipper?.id, 
          buyerId: undefined 
        })
      }
      
      toast({
        title: 'Success',
        description: 'Buyer deleted successfully'
      })
      
      setIsConfirmDeleteBuyerOpen(false)
    } catch (error) {
      console.error('Error deleting buyer:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete buyer',
        variant: 'destructive'
      })
    }
  }

  return {
    // Shipper state
    shipper,
    shippers,
    shipperSearch,
    hasMoreShippers,
    isLoadingShippers,
    isLoadingMoreShippers,
    shipperDialogOpen,
    shipperDialogMode,
    isConfirmDeleteShipperOpen,
    shipperError,
    shipperForm,
    
    // Buyer state
    buyer,
    buyers,
    buyerSearch,
    hasMoreBuyers,
    isLoadingBuyers,
    isLoadingMoreBuyers,
    buyerDialogOpen,
    buyerDialogMode,
    isConfirmDeleteBuyerOpen,
    buyerError,
    buyerForm,
    
    // Shipper handlers
    onShipperChange,
    onShipperSearch,
    onLoadMoreShippers,
    openAddShipperDialog,
    openEditShipperDialog,
    openDeleteShipperConfirm,
    handleShipperFormChange,
    handleSaveShipper,
    handleDeleteShipper,
    setShipperDialogOpen,
    setIsConfirmDeleteShipperOpen,
    
    // Buyer handlers
    onBuyerChange,
    onBuyerSearch,
    onLoadMoreBuyers,
    openAddBuyerDialog,
    openEditBuyerDialog,
    openDeleteBuyerConfirm,
    handleBuyerFormChange,
    handleSaveBuyer,
    handleDeleteBuyer,
    setBuyerDialogOpen,
    setIsConfirmDeleteBuyerOpen
  }
} 