import { useState, useCallback, useEffect, useMemo } from 'react'
import type { OrderFormData, OrderItem } from '@/types/orders'
import {
  createOrder,
  updateOrder,
  fetchOrderById as fetchOrder,
  fetchOrderItems,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
  deleteOrderItemsByOrderId
} from '@/services/orderService'
import logger from '@/lib/logger'
import { toast } from '@/lib/toast'
import { useFormState } from '../common/useFormState'
import { useAsyncAction } from '../common/useAsyncAction'
import { useShippingEntities } from './useShippingEntities'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { useOrderItems } from './useOrderItems'
import { createClient } from '@/utils/supabase/client'

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
  } = useFormState<OrderFormData>({
    ...DEFAULT_ORDER_DATA,
    order_number: undefined // ensure order_number is present in state
  })

  // State for tracking save status and data loading
  const [isSaved, setIsSaved] = useState(false)
  const [hasLoadedData, setHasLoadedData] = useState(false)


  // Shipping entities
  const shippingEntities = useShippingEntities();

  // Order items management via useOrderItems
  const {
    items: orderItems,
    isLoading: isLoadingOrderItems,
    itemError,
    saveItem: addOrUpdateItem,
    deleteItem: removeItem,
    saveTemporaryItems
  } = useOrderItems({ orderId });

  // Calculate temporaryItems directly from orderItems using useMemo
  // This avoids the need for useState + useEffect which can cause infinite loops
  const temporaryItems = useMemo(() => {
    const tempItems = orderItems.filter(item => item.id && item.id.startsWith('temp_'));
    // Chỉ log trong môi trường development
    if (process.env.NODE_ENV === 'development') {
      logger.log('temporaryItems in useOrderFormV2:', tempItems);
    }
    return tempItems;
  }, [orderItems]);

  // Loading state
  const { isLoading: isSaving, execute: executeSave } = useAsyncAction();
  const { isLoading: isLoadingOrder, execute: executeLoad } = useAsyncAction();
  const isLoading = useMemo(() => isLoadingOrder || isLoadingOrderItems, [isLoadingOrder, isLoadingOrderItems]);

  // Load order data in edit mode - only once
  useEffect(() => {
    if (isEditMode && orderId && !hasLoadedData) {
      (async () => {
        try {
          const order = await fetchOrder(orderId);
          if (!order) throw new Error('Order not found');
          setFormData(order);
          setHasLoadedData(true);
        } catch (error: any) {
          toast.toast({
            title: 'Error loading order data',
            description: error.message || 'An unknown error occurred',
            variant: 'destructive'
          });
          onError?.(error);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, orderId, hasLoadedData]);

  /* Lưu đơn hàng */
  const saveOrder = useCallback(async () => {
    const isValid = !formErrors || Object.keys(formErrors).length === 0;
    if (!isValid || isSaving) return;

    try {
      return await executeSave(async () => {
        // Remove fields that don't exist in the database
        const cleanFormData = { ...formData };
        const apiFormData = { ...cleanFormData };

        let savedOrderId = orderId;
        let isNewOrder = false;

        if (!savedOrderId) {
          // Ensure order_number is generated if not present
          let orderToSave = { ...formData };
          if (!orderToSave.order_number) {
            // Generate a unique order number in format [Loại đơn hàng][Team][Năm]-[Số thứ tự]
            // e.g., IMR25-010
            try {
              // Get type prefix (I or L)
              const typePrefix = orderToSave.type === 'international' ? 'I' : 'L';

              // Get team code based on team_id
              const supabase = createClient();
              const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select('name')
                .eq('id', orderToSave.team_id)
                .single();

              if (teamError) throw teamError;

              // Map team name to team code
              const teamCode = teamData.name === 'Marine' ? 'MR' :
                            teamData.name === 'Agri' ? 'AF' :
                            teamData.name === 'CG' ? 'CG' : 'XX';

              // Get year code (last 2 digits of current year)
              const yearCode = new Date().getFullYear().toString().substring(2);

              // Get next sequence number from database
              const { fetchNextOrderSequence } = await import('@/utils/supabase/client');
              const { nextSequence, formattedOrderNumber, error } = await fetchNextOrderSequence(
                typePrefix,
                teamCode,
                yearCode
              );

              if (error) throw error;

              // Use the formatted order number
              orderToSave.order_number = formattedOrderNumber;
            } catch (error) {
              logger.error('Error generating order number:', error);
              // Fallback to old format if there's an error
              const now = new Date();
              const pad = (n: number) => n.toString().padStart(2, '0');
              const datePart = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
              const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
              const rand = Math.floor(1000 + Math.random() * 9000);
              orderToSave.order_number = `ORD-${datePart}-${timePart}-${rand}`;
            }
          }

          // Debug: check required fields
          const requiredFields = ['client_id', 'type', 'team_id', 'order_date', 'status', 'order_number'];
          const missingFields = requiredFields.filter(f => !(orderToSave as any)[f]);
          const emptyFields = requiredFields.filter(f => typeof (orderToSave as any)[f] === 'string' && !(orderToSave as any)[f].trim());
          logger.log('DEBUG orderToSave:', JSON.stringify(orderToSave, null, 2));
          logger.log('Missing fields:', missingFields);
          logger.log('Empty fields:', emptyFields);
          if (Object.keys(orderToSave).length === 0 || missingFields.length > 0 || emptyFields.length > 0) {
            logger.error('OrderFormV2: Missing or empty required fields:', missingFields, emptyFields, 'formData:', formData);
            toast.toast({
              title: 'Thiếu thông tin bắt buộc',
              description: `Vui lòng nhập đầy đủ các trường: ${[...missingFields, ...emptyFields].join(', ')}`,
              variant: 'destructive',
            });
            throw new Error('OrderFormV2: Không đủ thông tin để tạo đơn hàng');
          }

          let savedOrder: import('@/types/orders').Order | null = null;
          try {
            // Debug: log data before sending to API
            logger.log('Sending order data to API:', orderToSave);

            const savedOrderResponse = await createOrder(orderToSave);

            // Debug: log response
            logger.log('createOrder response:', savedOrderResponse);

            savedOrder = savedOrderResponse as import('@/types/orders').Order | null;
            if (!savedOrder || !savedOrder.id) {
              toast.toast({
                title: 'Order creation failed',
                description: `No order returned from API. Check server logs and required fields.`,
                variant: 'destructive',
              });
              throw new Error('Order creation failed: No order returned from API');
            }

            savedOrderId = savedOrder.id;
            isNewOrder = true;

            // Lưu ý: Chúng ta để OrderForm xử lý việc lưu các items tạm thời
            // để tránh các vấn đề về timing và state
            // Không cần log ở đây vì đã được xử lý trong OrderForm
          } catch (createError: any) {
            logger.error('Error creating order:', createError);
            toast.toast({
              title: 'Order creation failed',
              description: createError.message || 'Unknown error',
              variant: 'destructive',
            });
            throw createError;
          }
        } else {
          await updateOrder(savedOrderId, apiFormData);
        }

        toast.toast({
          title: isNewOrder ? "Đơn hàng đã được tạo thành công" : "Đơn hàng đã được cập nhật thành công",
          description: "Các thay đổi đã được lưu thành công."
        });

        setIsSaved(true);
        onSuccess?.({ id: savedOrderId });
        if (isNewOrder) {
          router.push(`/dashboard/orders/${savedOrderId}`);
        } else {
          router.push('/dashboard/orders');
        }
        // Trả về một đối tượng order với ít nhất là id
        return { id: savedOrderId };
      });
    } catch (error: any) {
      logger.error('Error in saveOrder:', error);
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
  }, [orderId, formData, formErrors, isSaving, executeSave, createOrder, updateOrder, onSuccess, onError, router, saveTemporaryItems, temporaryItems]);

  return {
    // Form state
    formData,
    setFormData,
    handleFormChange,
    setFieldValue,
    formErrors,
    isFormDirty,
    resetForm,

    // Order Items (from useOrderItems)
    orderItems,
    addOrUpdateItem,
    removeItem,
    itemError,

    // Shipping entities
    ...shippingEntities,

    // Loading/Saving states
    isLoading,
    isSaving,

    // Actions
    saveOrder,

    // Mode
    isEditMode
  }
}