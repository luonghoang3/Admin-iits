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
  const [shipperPage, setShipperPage] = useState(1)
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
  const [buyerPage, setBuyerPage] = useState(1)
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
      // Nếu có initialShipperId, tải shipper đó trước
      let selectedShipperData = null;
      if (initialShipperId) {
        const { data: shipperData, error: shipperError } = await fetchShipper(initialShipperId);
        if (!shipperError && shipperData) {
          selectedShipperData = shipperData as Shipper;
        }
      }

      // Fetch shippers with pagination
      const { data: shippersData, hasMore: hasMoreShippersData, error: shippersError } =
        await fetchShippers({ page: 1, limit: 15, searchQuery: '' })

      if (shippersError) {
        throw new Error(`Error fetching shippers: ${shippersError}`)
      }

      // Kết hợp shipper đã được gán với danh sách shipper
      let combinedShippers = shippersData as Shipper[];

      // Thêm selectedShipperData vào đầu danh sách nếu có
      if (selectedShipperData && !combinedShippers.some(s => s.id === selectedShipperData.id)) {
        combinedShippers = [selectedShipperData, ...combinedShippers];
      }

      // Loại bỏ trùng lặp
      const uniqueShippers = Array.from(
        new Map(combinedShippers.map(shipper => [shipper.id, shipper])).values()
      ) as Shipper[];

      setShippers(uniqueShippers)
      setHasMoreShippers(hasMoreShippersData)

      // Select the shipper if provided
      if (selectedShipperData) {
        setShipper(selectedShipperData)
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
      // Nếu có initialBuyerId, tải buyer đó trước
      let selectedBuyerData = null;
      if (initialBuyerId) {
        const { data: buyerData, error: buyerError } = await fetchBuyer(initialBuyerId);
        if (!buyerError && buyerData) {
          selectedBuyerData = buyerData as Buyer;
        }
      }

      // Fetch buyers with pagination
      const { data: buyersData, hasMore: hasMoreBuyersData, error: buyersError } =
        await fetchBuyers({ page: 1, limit: 15, searchQuery: '' })

      if (buyersError) {
        throw new Error(`Error fetching buyers: ${buyersError}`)
      }

      // Kết hợp buyer đã được gán với danh sách buyer
      let combinedBuyers = buyersData as Buyer[];

      // Thêm selectedBuyerData vào đầu danh sách nếu có
      if (selectedBuyerData && !combinedBuyers.some(b => b.id === selectedBuyerData.id)) {
        combinedBuyers = [selectedBuyerData, ...combinedBuyers];
      }

      // Loại bỏ trùng lặp
      const uniqueBuyers = Array.from(
        new Map(combinedBuyers.map(buyer => [buyer.id, buyer])).values()
      ) as Buyer[];

      setBuyers(uniqueBuyers)
      setHasMoreBuyers(hasMoreBuyersData)

      // Select the buyer if provided
      if (selectedBuyerData) {
        setBuyer(selectedBuyerData)
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
    setShipperPage(1) // Đặt lại trang về 1 khi tìm kiếm

    // Trigger search even for empty query to reset list if needed, or based on specific logic
    // if (query.length > 2 || query.length === 0) {
    setIsLoadingShippers(true)

    try {
      const itemsPerPage = 15;
      const { data, hasMore, error } = await fetchShippers({
        page: 1,
        limit: itemsPerPage,
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
      // Kiểm tra số lượng kết quả hiện tại trước khi tải thêm
      const { data: currentResults, hasMore: currentHasMore, error: checkError } =
        await fetchShippers({
          page: 1,
          limit: 15,
          searchQuery: shipperSearch
        });

      if (checkError) {
        console.error('Error checking current results:', checkError);
        setIsLoadingMoreShippers(false);
        return;
      }

      // Nếu số lượng kết quả hiện tại ít hơn 15, không cần tải thêm
      if (currentResults.length < 15) {
        console.log('Not enough results to load more:', currentResults.length);
        setHasMoreShippers(false);
        setIsLoadingMoreShippers(false);
        return;
      }

      // Tính toán số trang dựa trên số lượng mục mỗi trang là 15
      const itemsPerPage = 15;
      const nextPage = Math.floor(shippers.length / itemsPerPage) + 1;

      console.log(`Loading more shippers: page=${nextPage}, query="${shipperSearch}"`);
      const { data, hasMore, error } = await fetchShippers({
        page: nextPage,
        limit: itemsPerPage,
        searchQuery: shipperSearch
      })

      if (error) {
        // Nếu lỗi là "Requested Range Not Satisfiable", đặt hasMore = false và không hiển thị lỗi
        const errorStr = JSON.stringify(error);
        console.log('Error object:', errorStr);
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        console.log('Error details:', error.details);

        // Kiểm tra các trường hợp lỗi khác nhau
        const isPGRST103 = error.code === 'PGRST103';
        const hasRangeMessage = error.message && error.message.includes('Requested range not satisfiable');
        const hasRangeInStr = errorStr.includes('Requested range not satisfiable');
        const isEmptyError = errorStr === '{}';

        console.log('isPGRST103:', isPGRST103);
        console.log('hasRangeMessage:', hasRangeMessage);
        console.log('hasRangeInStr:', hasRangeInStr);
        console.log('isEmptyError:', isEmptyError);

        if (isEmptyError || hasRangeInStr || isPGRST103 || hasRangeMessage) {
          console.log('Reached end of results, no more data to load');
          setHasMoreShippers(false);
          setIsLoadingMoreShippers(false);
          return;
        }

        // Đặt hasMoreShippers = false để ngăn người dùng cố gắng tải thêm dữ liệu
        setHasMoreShippers(false);
        setIsLoadingMoreShippers(false);
        console.error(`Error loading more shippers: ${error}`);
        return;
      }

      if (data && data.length > 0) {
        // Thêm các shipper mới và loại bỏ trùng lặp dựa trên ID
        setShippers(prev => {
          // Kết hợp danh sách cũ và mới
          const combined = [...prev, ...data];

          // Loại bỏ trùng lặp dựa trên ID
          return Array.from(new Map(combined.map(shipper => [shipper.id, shipper])).values());
        })

        setShipperPage(nextPage)
        setHasMoreShippers(hasMore)
      } else {
        setHasMoreShippers(false)
      }
    } catch (error) {
      console.error('Error loading more shippers:', error)
      setHasMoreShippers(false);
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
    setBuyerPage(1) // Đặt lại trang về 1 khi tìm kiếm

    // Trigger search even for empty query
    // if (query.length > 2 || query.length === 0) {
    setIsLoadingBuyers(true)

    try {
      const itemsPerPage = 15;
      const { data, hasMore, error } = await fetchBuyers({
        page: 1,
        limit: itemsPerPage,
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
      // Kiểm tra số lượng kết quả hiện tại trước khi tải thêm
      const { data: currentResults, hasMore: currentHasMore, error: checkError } =
        await fetchBuyers({
          page: 1,
          limit: 15,
          searchQuery: buyerSearch
        });

      if (checkError) {
        console.error('Error checking current results:', checkError);
        setIsLoadingMoreBuyers(false);
        return;
      }

      // Nếu số lượng kết quả hiện tại ít hơn 15, không cần tải thêm
      if (currentResults.length < 15) {
        console.log('Not enough results to load more:', currentResults.length);
        setHasMoreBuyers(false);
        setIsLoadingMoreBuyers(false);
        return;
      }

      // Tính toán số trang dựa trên số lượng mục mỗi trang là 15
      const itemsPerPage = 15;
      const nextPage = Math.floor(buyers.length / itemsPerPage) + 1;

      console.log(`Loading more buyers: page=${nextPage}, query="${buyerSearch}"`);
      const { data, hasMore, error } = await fetchBuyers({
        page: nextPage,
        limit: itemsPerPage,
        searchQuery: buyerSearch
      })

      if (error) {
        // Nếu lỗi là "Requested Range Not Satisfiable", đặt hasMore = false và không hiển thị lỗi
        const errorStr = JSON.stringify(error);
        console.log('Error object:', errorStr);
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        console.log('Error details:', error.details);

        // Kiểm tra các trường hợp lỗi khác nhau
        const isPGRST103 = error.code === 'PGRST103';
        const hasRangeMessage = error.message && error.message.includes('Requested range not satisfiable');
        const hasRangeInStr = errorStr.includes('Requested range not satisfiable');
        const isEmptyError = errorStr === '{}';

        console.log('isPGRST103:', isPGRST103);
        console.log('hasRangeMessage:', hasRangeMessage);
        console.log('hasRangeInStr:', hasRangeInStr);
        console.log('isEmptyError:', isEmptyError);

        if (isEmptyError || hasRangeInStr || isPGRST103 || hasRangeMessage) {
          console.log('Reached end of results, no more data to load');
          setHasMoreBuyers(false);
          setIsLoadingMoreBuyers(false);
          return;
        }

        // Đặt hasMoreBuyers = false để ngăn người dùng cố gắng tải thêm dữ liệu
        setHasMoreBuyers(false);
        setIsLoadingMoreBuyers(false);
        console.error(`Error loading more buyers: ${error}`);
        return;
      }

      if (data && data.length > 0) {
        // Thêm các buyer mới và loại bỏ trùng lặp dựa trên ID
        setBuyers(prev => {
          // Kết hợp danh sách cũ và mới
          const combined = [...prev, ...data];

          // Loại bỏ trùng lặp dựa trên ID
          return Array.from(new Map(combined.map(buyer => [buyer.id, buyer])).values());
        })

        setBuyerPage(nextPage)
        setHasMoreBuyers(hasMore)
      } else {
        setHasMoreBuyers(false)
      }
    } catch (error) {
      console.error('Error loading more buyers:', error)
      setHasMoreBuyers(false);
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