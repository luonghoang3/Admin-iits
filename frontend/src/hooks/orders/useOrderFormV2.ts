import { useState, useCallback, useEffect, useMemo } from 'react'
import type { OrderFormData, OrderItem } from '@/types/orders'
import {
  fetchOrder,
  createOrder,
  updateOrder,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem
} from '@/utils/supabase/client'
import { toast } from '@/lib/toast'
import { useFormState } from '../common/useFormState'
import { useAsyncAction } from '../common/useAsyncAction'
import { useShippingEntities } from './useShippingEntities'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

const DEFAULT_ORDER_DATA: OrderFormData = {
  client_id: '',
  type: 'international',
  team_id: 'e7697f59-05cc-434e-b679-fde4c53b7d7c', // Marine team ID
  order_date: new Date().toISOString().split('T')[0],
  status: 'draft'
}

interface UseOrderFormProps {
  mode?: 'create' | 'edit'
  orderId?: string
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

/**
 * Hook quản lý form đơn hàng với kiến trúc mới
 */
export function useOrderFormV2({
  mode = 'create',
  orderId,
  onSuccess,
  onError
}: UseOrderFormProps = {}) {
  const isEditMode = mode === 'edit'
  const router = useRouter()

  // Form state
  const {
    values: formData,
    setValues: setFormData,
    handleChange: handleFormChange,
    setValue: setFieldValue,
    isDirty: isFormDirty,
    reset: resetForm,
    errors: formErrors,
    setErrors: setFormErrors
  } = useFormState<OrderFormData>(DEFAULT_ORDER_DATA)

  // State for tracking save status and data loading
  const [isSaved, setIsSaved] = useState(false)
  const [hasLoadedData, setHasLoadedData] = useState(false)

  // --- Simplified Local Order Item State Management ---
  const [localOrderItems, setLocalOrderItems] = useState<OrderItem[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false) // Local loading state for items
  const [itemError, setItemError] = useState<string | null>(null) // Local item error state
  const [isProcessingItems, setIsProcessingItems] = useState(false); // Add back processing state

  // Add effect to track when items are loaded
  useEffect(() => {
    // If we have items and still in loading state, update loading state
    if (localOrderItems.length > 0 && isLoadingItems) {
      setIsLoadingItems(false);
    }
  }, [localOrderItems, isLoadingItems]);

  // Function to add an item locally
  const addLocalItem = (item: Omit<OrderItem, 'id'>) => {
    const newItem = { ...item, id: `temp_${uuidv4()}` }; // Assign temporary ID

    setLocalOrderItems(prev => {
      const updatedItems = [...prev, newItem];

      return updatedItems;
    });
  }

  // Function to update an item locally by temporary ID or index
  const updateLocalItem = (idOrIndex: string | number, updatedFields: Partial<OrderItem>) => {
    setLocalOrderItems(prev => {
      const updatedItems = prev.map((item, index) => {
        if (item.id === idOrIndex || index === idOrIndex) {
          return { ...item, ...updatedFields };
        }
        return item;
      });
      return updatedItems;
    });
  }

  // Function to remove an item locally by temporary ID or index
  const removeLocalItem = (idOrIndex: string | number) => {
    setLocalOrderItems(prev => prev.filter((item, index) =>
      item.id !== idOrIndex && index !== idOrIndex
    ))
  }
  // --- End Simplified Item Management ---

  // Shipping entities
  const shippingEntities = useShippingEntities()

  // Loading state
  const { isLoading: isSaving, execute: executeSave } = useAsyncAction()
  const { isLoading: isLoadingOrder, execute: executeLoad } = useAsyncAction()
  const isLoading = useMemo(() => isLoadingOrder || isLoadingItems, [isLoadingOrder, isLoadingItems]);

  // Load order data and items in edit mode - only once
  useEffect(() => {
    if (isEditMode && orderId && !hasLoadedData) {
      loadOrderDataAndItems(orderId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, orderId, hasLoadedData])

  const loadOrderDataAndItems = useCallback(async (id: string) => {
    try {
      // Start loading order data and items
      setIsLoadingItems(true);
      setItemError(null);

      // First load the order
      const { order, error: orderError } = await fetchOrder(id);
      if (orderError) {
        throw new Error(`Order fetch failed: ${orderError}`);
      }
      if (!order) {
        throw new Error('Order not found');
      }

      // Format main order data
      setFormData(order);

      // Then load the items
      const { fetchOrderItems } = await import('@/utils/supabase/client');
      const { orderItems, error: itemsError } = await fetchOrderItems(id);

      if (itemsError) {
        // Handle error loading order items
        setItemError(`Failed to load order items: ${itemsError}`);
        setIsLoadingItems(false);
        return;
      }

      // Process the loaded items

      // Set loaded items to local state with normalized properties
      const processedItems = orderItems?.map(item => ({
        ...item,
        commodity_description: item.commodity_description ?? null,
        // Ensure nested objects are preserved
        commodities: item.commodities || null,
        units: item.units || null,
        // Also add commodity and unit for consistency
        commodity: item.commodity || item.commodities || null,
        unit: item.unit || item.units || null
      })) || [];

      setLocalOrderItems(processedItems);

      // Update loading state and mark data as loaded
      setIsLoadingItems(false);
      setHasLoadedData(true);

    } catch (error: any) {
      toast.toast({
        title: 'Error loading order data',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive'
      });
      onError?.(error);
      setIsLoadingItems(false);
    }
  }, [setFormData, onError, toast]); // Dependencies

  /* Lưu đơn hàng */
  const saveOrder = useCallback(async () => {
    const isValid = !formErrors || Object.keys(formErrors).length === 0
    if (!isValid || isSaving) return

    try {
      return await executeSave(async () => {
        // No need to convert department anymore

        // Remove fields that don't exist in the database
        const {
          client_contacts,
          client_name,
          selected_contact,
          clients, // Remove clients object
          ...cleanFormData
        } = formData;

        const apiFormData = {
          ...cleanFormData
        }

        let savedOrderId = orderId
        let isNewOrder = false

        if (!savedOrderId) {
          isNewOrder = true
          const { order, error } = await createOrder(apiFormData)
          if (error) throw new Error(error.message || error) // Use error.message
          if (!order) throw new Error("Order creation failed")
          savedOrderId = order.id


          // --- Save Local Items for NEW Order ---
          if (localOrderItems.length > 0) {

            setIsProcessingItems(true); // Set processing state
            const itemSavePromises = localOrderItems.map(item => {
              const { id, ...itemData } = item // Remove temp ID
              if (!savedOrderId) {

                  return Promise.resolve({ success: false, error: 'Missing Order ID' }); // Indicate failure
              }
              const payload = {
                ...itemData,
                order_id: savedOrderId,
                commodity_description: itemData.commodity_description ?? undefined
              };

              return createOrderItem(payload)
                .then(({ orderItem, error }) => { // Destructure the result
                  if (error) {

                    return { success: false, error: error.message || error };
                  } else {

                    return { success: true, item: orderItem };
                  }
                })
                .catch(err => {

                  return { success: false, error: err.message || 'Unknown API error' };
              });
            });
            const results = await Promise.all(itemSavePromises);

            setIsProcessingItems(false); // Clear processing state
            // Check if all items were saved successfully
            const allSucceeded = results.every(r => r?.success);
            if (allSucceeded) {
                // Optionally clear local items after successful save of ALL items
                // setLocalOrderItems([]);

            } else {

                // Handle partial success? Maybe show a specific error message.
                toast.toast({ title: "Warning", description: "Order saved, but some items could not be added.", variant: "destructive" })
            }
          } else {

          }
          // --- End Save Local Items ---

        } else {
          // --- Update Existing Order ---
          const { error } = await updateOrder(savedOrderId, apiFormData);

          if (error) {
            console.error('Error from updateOrder:', error);
            // Handle different error types
            if (typeof error === 'string') {
              throw new Error(error);
            } else if (error instanceof Error) {
              throw error;
            } else if (typeof error === 'object' && error !== null) {
              throw new Error(error.message || JSON.stringify(error) || 'Unknown error updating order');
            } else {
              throw new Error('Unknown error updating order');
            }
          }

          // --- Sync Items for EXISTING Order ---
          if (localOrderItems.length > 0) {
            setIsProcessingItems(true); // Set processing state

            try {
              // Import necessary functions
              const { deleteOrderItemsByOrderId, createOrderItem } = await import('@/utils/supabase/client');

              // Delete all existing items for this order
              const { success: deleteSuccess, error: deleteError } = await deleteOrderItemsByOrderId(savedOrderId);

              if (deleteError) {
                console.error('Error deleting existing order items:', deleteError);
                throw new Error('Failed to delete existing items');
              }

              // Create new items
              // Create promises for saving each item
              const itemSavePromises = localOrderItems.map(async (item) => {
                try {
                  const { id, ...itemData } = item; // Remove temp ID

                  // Clean up item data to remove non-database fields
                  const { commodity, commodities, unit, units, ...cleanItemData } = itemData;

                  // Ensure required fields are present and have correct types
                  if (!cleanItemData.commodity_id || typeof cleanItemData.commodity_id !== 'string') {
                    throw new Error('Missing or invalid commodity_id in item data');
                  }

                  if (!cleanItemData.unit_id || typeof cleanItemData.unit_id !== 'string') {
                    throw new Error('Missing or invalid unit_id in item data');
                  }

                  if (typeof cleanItemData.quantity !== 'number' || isNaN(cleanItemData.quantity) || cleanItemData.quantity <= 0) {
                    throw new Error('Invalid quantity in item data');
                  }

                  // Validate UUID format for IDs
                  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

                  if (!uuidRegex.test(savedOrderId)) {
                    throw new Error('Invalid order_id format');
                  }

                  if (!uuidRegex.test(cleanItemData.commodity_id)) {
                    throw new Error('Invalid commodity_id format');
                  }

                  if (!uuidRegex.test(cleanItemData.unit_id)) {
                    throw new Error('Invalid unit_id format');
                  }

                  const payload = {
                    order_id: savedOrderId,
                    commodity_id: cleanItemData.commodity_id,
                    unit_id: cleanItemData.unit_id,
                    quantity: cleanItemData.quantity,
                    commodity_description: cleanItemData.commodity_description ?? undefined
                  };
                  const { orderItem, error } = await createOrderItem(payload);

                  if (error) {
                    return { success: false, error: error.message || error };
                  } else {
                    return { success: true, item: orderItem };
                  }
                } catch (err: any) {
                  return { success: false, error: err.message || 'Unknown API error' };
                }
              });

              // Use Promise.allSettled to handle errors better
              const results = await Promise.allSettled(itemSavePromises);

              // Count successful and failed items
              const successfulItems = results.filter(
                r => r.status === 'fulfilled' && r.value.success
              ).length;

              const failedItems = results.filter(
                r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
              ).length;

              // Show warning if any items failed
              if (failedItems > 0) {
                toast.toast({
                  title: "Warning",
                  description: `Order updated with ${successfulItems} items, but ${failedItems} items could not be added.`,
                  variant: "destructive"
                });
              }
            } catch (error) {
              console.error('Error syncing order items:', error);
              toast.toast({
                title: "Warning",
                description: "Order updated, but there was an issue updating items.",
                variant: "destructive"
              });
            } finally {
              setIsProcessingItems(false); // Clear processing state
            }
          }
          // --- End Sync Items ---
        }

        toast.toast({
          title: isNewOrder ? "Đơn hàng đã được tạo thành công" : "Đơn hàng đã được cập nhật thành công",
          description: "Các thay đổi đã được lưu thành công."
        });

        // Set status
        setIsSaved(true);

        // Call success callback with saved order ID
        onSuccess?.({ id: savedOrderId });

        // Navigate after successful save
        if (isNewOrder) {
          // For new orders, navigate to the order detail page
          router.push(`/dashboard/orders/${savedOrderId}`);
        } else {
          // For existing orders, navigate back to the orders list
          router.push('/dashboard/orders');
        }

        return savedOrderId;
      });
    } catch (error: any) {
      console.error('Error in saveOrder:', error);

      // Improve error handling
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = error.message || JSON.stringify(error);
      } else {
        errorMessage = 'Unknown error occurred while saving order';
      }

      toast.toast({
        title: "Error saving order",
        description: errorMessage,
        variant: "destructive"
      });
      onError?.(error);
      return false;
    }
  }, [
    orderId,
    formData,
    localOrderItems,
    formErrors,
    isSaving,
    executeSave,
    createOrder,
    updateOrder,
    setIsSaved,
    onSuccess,
    onError,
    router
  ]);

  return {
    // Form state
    formData,
    setFormData,
    handleFormChange,
    setFieldValue,
    formErrors,
    isFormDirty,
    resetForm,

    // Simplified Local Order Items Management
    localOrderItems,
    addLocalItem,
    updateLocalItem,
    removeLocalItem,
    isLoadingItems,
    itemError,

    // Shipping entities
    ...shippingEntities,

    // Loading/Saving states
    isLoading,
    isSaving,

    // Actions
    saveOrder,
    loadOrderDataAndItems,

    // Mode
    isEditMode
  }
}