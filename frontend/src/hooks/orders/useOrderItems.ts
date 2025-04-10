import { useState, useCallback, useEffect, useMemo } from 'react'
import { OrderItem, Commodity, Unit } from '@/types/orders'
import { fetchOrderItems, createOrderItem, updateOrderItem, deleteOrderItem as apiDeleteOrderItem } from '@/utils/supabase/client'
import { useAsyncAction } from '../common/useAsyncAction'
import { v4 as uuidv4 } from 'uuid'
import { toast } from '@/lib/toast'

const DEFAULT_ITEM: OrderItem = {
  commodity_id: '',
  quantity: 1,
  unit_id: '',
  commodity_description: null
}

interface ItemDialogState {
  isOpen: boolean
  isEdit: boolean
  editingIndex: number | null
  currentItem: OrderItem
}

interface UseOrderItemsProps {
  orderId?: string
  initialItems?: OrderItem[]
  commodities?: Commodity[]
  units?: Unit[]
}

/**
 * Hook để quản lý các mục đơn hàng
 */
export function useOrderItems({
  orderId: initialOrderId,
  initialItems = [],
  commodities = [],
  units = []
}: UseOrderItemsProps = {}) {
  // State
  const [items, setItems] = useState<OrderItem[]>(initialItems)

  // Add a state for orderId so it can be updated
  const [orderId, setOrderId] = useState<string | undefined>(initialOrderId);

  // Update orderId if initialOrderId changes
  useEffect(() => {
    if (initialOrderId !== orderId) {

      setOrderId(initialOrderId);
    }
  }, [initialOrderId, orderId]);



  // Store last valid orderId to prevent undefined state
  const [lastValidOrderId, setLastValidOrderId] = useState<string | undefined>(initialOrderId);

  useEffect(() => {
    if (orderId) {
      setLastValidOrderId(orderId);
    }
  }, [orderId]);



  const [itemDialog, setItemDialog] = useState<ItemDialogState>({
    isOpen: false,
    isEdit: false,
    editingIndex: null,
    currentItem: DEFAULT_ITEM
  })
  const [itemError, setItemError] = useState<string | null>(null)
  const [isLoadingItems, setIsLoadingItems] = useState(false)

  // Loading states from useAsyncAction
  const { isLoading, execute } = useAsyncAction()
  const { isLoading: isDeleting, execute: executeDelete } = useAsyncAction()

  /**
   * Tải danh sách mục đơn hàng
   */
  const loadItems = useCallback(async () => {
    if (!orderId) {
      return;
    }

    try {

      setIsLoadingItems(true);
      setItemError(null); // Clear any previous errors

      const response = await fetchOrderItems(orderId);


      if (response.error) {
        setItemError(`Failed to load order items: ${response.error}`);
        return;
      }

      const { orderItems } = response;

      if (!Array.isArray(orderItems)) {
        setItemError('Unexpected data format from server');
        return;
      }

      // Process items to ensure consistent format for UI
      const processedItems = orderItems.map(item => ({
        ...item,
        id: item.id || '', // Ensure ID is always a string
        order_id: item.order_id || orderId, // Use the orderId if not provided
        commodity_id: item.commodity_id || '',
        quantity: typeof item.quantity === 'number' ? item.quantity : 0,
        unit_id: item.unit_id || '',
        commodity_description: item.commodity_description || null
      }));


      setItems(processedItems);
    } catch (err: any) {

      setItemError(`Failed to load order items: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoadingItems(false);
    }
  }, [orderId]);

  // Tải items khi orderId thay đổi
  useEffect(() => {
    if (orderId) {
      loadItems()
    }
  }, [orderId, loadItems])

  /**
   * Mở form thêm mục đơn hàng mới
   */
  const openAddItemForm = useCallback(() => {
    setItemDialog({
      isOpen: true,
      isEdit: false,
      editingIndex: null,
      currentItem: {
        ...DEFAULT_ITEM,
        order_id: orderId
      }
    })
    setItemError(null)
  }, [orderId])

  /**
   * Mở form chỉnh sửa mục đơn hàng
   */
  const openEditItemForm = useCallback(async (indexOrItem: number | OrderItem) => {
    let item: OrderItem
    let index: number | null = null

    if (typeof indexOrItem === 'number') {
      index = indexOrItem
      item = items[indexOrItem]
      if (!item) {

        return
      }
    } else {
      item = indexOrItem
      index = items.findIndex(i => i.id === item.id)
    }

    // Nếu có commodity_id nhưng không có commodity trong item,
    // hoặc không tìm thấy commodity trong danh sách commodities hiện tại
    if (item.commodity_id && (!item.commodities || !commodities.find(c => c.id === item.commodity_id))) {
      // Tìm thông tin commodity từ danh sách hoặc API
      const foundCommodity = commodities.find(c => c.id === item.commodity_id)

      if (!foundCommodity) {
        // Tìm thêm thông tin chi tiết qua API (nếu có)
        try {
          const { fetchCommodity } = await import('@/utils/supabase/client')
          const { commodity } = await fetchCommodity(item.commodity_id)

          if (commodity) {
            // Cập nhật commodity cho item
            item.commodities = {
              id: commodity.id,
              name: commodity.name,
              description: commodity.description || null
            }
          }
        } catch (err) {

        }
      }
    }

    // Tương tự cho unit
    if (item.unit_id && (!item.units || !units.find(u => u.id === item.unit_id))) {
      // Tìm thông tin unit từ danh sách
      const foundUnit = units.find(u => u.id === item.unit_id)

      if (foundUnit) {
        item.units = {
          id: foundUnit.id,
          name: foundUnit.name
        }
      } else {
        // Nếu không tìm thấy unit trong danh sách, có thể tìm thêm từ API nếu cần
        try {
          const { fetchUnit } = await import('@/utils/supabase/client')
          const { unit } = await fetchUnit(item.unit_id)

          if (unit) {
            // Cập nhật unit cho item
            item.units = {
              id: unit.id,
              name: unit.name
            }
          }
        } catch (err) {

        }
      }
    }

    setItemDialog({
      isOpen: true,
      isEdit: true,
      editingIndex: index,
      currentItem: { ...item }
    })
    setItemError(null)
  }, [items, commodities, units])

  /**
   * Đóng form mục đơn hàng
   */
  const closeItemForm = useCallback(() => {
    setItemDialog(prev => ({
      ...prev,
      isOpen: false
    }))
    setItemError(null)
  }, [])

  /**
   * Cập nhật trường của mục đơn hàng hiện tại
   */
  const updateItemField = useCallback((name: keyof OrderItem, value: any) => {
    setItemDialog(prev => ({
      ...prev,
      currentItem: {
        ...prev.currentItem,
        [name]: value
      }
    }))

    // Xóa lỗi khi người dùng sửa
    setItemError(null)
  }, [])

  /**
   * Xử lý thay đổi input từ form
   */
  const handleItemChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const numValue = name === 'quantity' ? parseFloat(value) : value
    updateItemField(name as keyof OrderItem, numValue)
  }, [updateItemField])

  /**
   * Xử lý thay đổi commodity
   */
  const handleCommodityChange = useCallback((commodityId: string) => {
    // Tìm thông tin commodity
    const selectedCommodity = commodities.find(c => c.id === commodityId)

    setItemDialog(prev => ({
      ...prev,
      currentItem: {
        ...prev.currentItem,
        commodity_id: commodityId,
        commodities: selectedCommodity ? {
          id: selectedCommodity.id,
          name: selectedCommodity.name,
          description: selectedCommodity.description || null
        } : undefined
      }
    }))

    setItemError(null)
  }, [commodities])

  /**
   * Xử lý thay đổi unit
   */
  const handleUnitChange = useCallback((unitId: string) => {
    // Tìm thông tin unit
    const selectedUnit = units.find(u => u.id === unitId)

    setItemDialog(prev => ({
      ...prev,
      currentItem: {
        ...prev.currentItem,
        unit_id: unitId,
        units: selectedUnit ? {
          id: selectedUnit.id,
          name: selectedUnit.name
        } : undefined
      }
    }))

    setItemError(null)
  }, [units])

  /**
   * Lưu mục đơn hàng
   */
  const saveItem = useCallback(
    async (itemOrEvent: OrderItem | any, immediateOrderId?: string): Promise<OrderItem | null> => {
      // If the argument is a React event, extract data from the current dialog
      if (itemOrEvent && (itemOrEvent._reactName || itemOrEvent.nativeEvent || itemOrEvent.preventDefault || itemOrEvent.target || itemOrEvent instanceof Event)) {


        // Prevent default event behavior if it's a form submission
        if (typeof itemOrEvent.preventDefault === 'function') {
          itemOrEvent.preventDefault();
        }

        // Use the current item from the dialog instead of the event
        if (itemDialog.currentItem) {
          itemOrEvent = { ...itemDialog.currentItem };
        } else {

          setItemError("Unable to save: No item data available");
          return null;
        }
      }

      // Make sure we have a valid item object by creating a copy
      let processedItem: OrderItem = { ...itemOrEvent as OrderItem };

      // Ensure item has required properties
      if (!processedItem.commodity_id || !processedItem.unit_id) {


        // Try to get missing data from dialog if available
        if (itemDialog.currentItem) {
          processedItem.commodity_id = processedItem.commodity_id || itemDialog.currentItem.commodity_id;
          processedItem.unit_id = processedItem.unit_id || itemDialog.currentItem.unit_id;
          processedItem.quantity = processedItem.quantity || itemDialog.currentItem.quantity || 1;
        }

        // If still missing required fields, show error
        if (!processedItem.commodity_id || !processedItem.unit_id) {
          const errorMessage = "Please select a commodity and unit";

          setItemError(errorMessage);
          return null;
        }
      }

      // Determine which orderId to use, with fallbacks
      const effectiveOrderId = immediateOrderId || orderId || lastValidOrderId;



      if (!effectiveOrderId) {


        // Create a proper temporary item with required fields and temporary ID
        const tempItem: OrderItem = {
          id: `temp_${uuidv4()}`,
          commodity_id: processedItem.commodity_id || '',
          quantity: typeof processedItem.quantity === 'number' ? processedItem.quantity : 1,
          unit_id: processedItem.unit_id || '',
          commodity_description: processedItem.commodity_description || null
        };

        // Add to temporary items
        setItems((prevItems) => {
          const updatedItems = [...prevItems, tempItem];

          return updatedItems;
        });

        // Close the dialog
        if (itemDialog.isOpen) {
          closeItemForm();
        }

        toast.toast({
          title: "Item saved temporarily",
          description: "This item will be saved when the order is created",
          variant: "default"
        });

        return tempItem;
      }

      try {
        // If we have a valid orderId, save to API

        // If the item has a temporary id, remove it
        if (processedItem.id && processedItem.id.startsWith("temp_")) {
          const { id, ...itemWithoutId } = processedItem;
          processedItem = itemWithoutId as OrderItem;
        }

        if (!processedItem.id) {
          // Creating a new item


          // Prepare item for creation, handling null values properly
          const itemToCreate = {
            commodity_id: processedItem.commodity_id,
            quantity: processedItem.quantity,
            unit_id: processedItem.unit_id,
            order_id: effectiveOrderId,
            commodity_description: processedItem.commodity_description || undefined
          };



          const response = await createOrderItem(itemToCreate);

          if (response.error) {

            toast.toast({
              title: "Error creating item",
              description: response.error || "An error occurred",
              variant: "destructive"
            });
            return null;
          }


          toast.toast({
            title: "Item created",
            description: "Order item has been created",
            variant: "default"
          });

          // Update the items state
          setItems((prevItems) => {
            const updatedItems = [...prevItems.filter((i) => i.id !== processedItem.id), response.orderItem];

            return updatedItems;
          });

          return response.orderItem;
        } else {
          // Updating an existing item


          // Extract only updatable fields to match the expected type
          const itemToUpdate = {
            commodity_id: processedItem.commodity_id,
            quantity: processedItem.quantity,
            unit_id: processedItem.unit_id,
            commodity_description: processedItem.commodity_description || undefined
          };



          if (!processedItem.id) {

            toast.toast({
              title: "Error updating item",
              description: "No item ID available",
              variant: "destructive"
            });
            return null;
          }

          const response = await updateOrderItem(processedItem.id, itemToUpdate);

          if (response.error) {

            toast.toast({
              title: "Error updating item",
              description: response.error || "An error occurred",
              variant: "destructive"
            });
            return null;
          }


          toast.toast({
            title: "Item updated",
            description: "Order item has been updated",
            variant: "default"
          });

          // Update the items state
          setItems((prevItems) => {
            const updatedItems = [...prevItems.filter((i) => i.id !== processedItem.id), response.orderItem];

            return updatedItems;
          });

          return response.orderItem;
        }
      } catch (error) {

        toast.toast({
          title: "Error saving item",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive"
        });
        return null;
      }
    },
    [orderId, lastValidOrderId, createOrderItem, updateOrderItem, setItems, itemDialog.currentItem, toast]
  );

  /**
   * Xóa mục đơn hàng
   */
  const deleteItem = useCallback(async (indexOrId: number | string) => {
    if (typeof indexOrId === 'string' && orderId) {
      // Xóa từ API
      await executeDelete(
        async () => {
          const { success, error } = await apiDeleteOrderItem(indexOrId)
          if (error) throw new Error(error)
          return { success, id: indexOrId }
        },
        (result) => {
          if (result.success) {
            setItems(prev => prev.filter(item => item.id !== indexOrId))
            toast.toast({
              title: "Item deleted",
              description: "The item has been successfully removed"
            });
          }
        },
        (error) => {

          toast.toast({
            title: "Error deleting item",
            description: error.message || "An unexpected error occurred",
            variant: "destructive"
          });
        }
      )
    } else if (typeof indexOrId === 'number') {
      // Xóa từ state cục bộ
      setItems(prev => prev.filter((_, i) => i !== indexOrId))
      toast.toast({
        title: "Item removed",
        description: "The item has been removed from the list"
      });
    }
  }, [orderId, executeDelete])

  /**
   * Tính tổng giá trị
   */
  const calculateTotal = useMemo(() => {
    return items.reduce((total, item) => {
      const unitPrice = (item as any).unit_price || 0
      const quantity = item.quantity || 0
      const itemTotal = (item as any).total_price || (unitPrice * quantity)
      return total + itemTotal
    }, 0)
  }, [items])

  return {
    items,
    setItems,
    itemDialog,
    isLoading: isLoadingItems || isLoading,
    isSaving: isLoading,
    itemError,
    loadItems,
    openAddItemForm,
    openEditItemForm,
    closeItemForm,
    handleItemChange,
    updateItemField,
    handleCommodityChange,
    handleUnitChange,
    saveItem,
    deleteItem,
    calculateTotal,
    setOrderId,
    temporaryItems: items.filter(item => item.id && item.id.startsWith('temp_'))
  }
}