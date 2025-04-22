'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
// Removed unused imports
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeftIcon, ArrowDownTrayIcon as SaveIcon } from "@heroicons/react/24/outline"

// Add Dialog imports
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"

// Custom hooks
import { useOrderFormV2 } from '@/hooks/orders/useOrderFormV2'
import { useOrderItems } from '@/hooks/orders/useOrderItems'
import { useClientAndContactManagement } from '@/hooks/useClientAndContactManagement'
import logger from '@/lib/logger'
import { useUnits } from "@/hooks/useUnits"
// Chỉ sử dụng bảng commodities_new
import { useCommodities } from "@/hooks/useCommodities"
import { useCategories } from "@/hooks/useCategories"

// Component sections - lazy loaded
import dynamic from 'next/dynamic'

const ClientInformationSection = dynamic(() => import('./ClientInformationSection'), {
  loading: () => <div className="h-[300px] w-full animate-pulse bg-muted rounded-md"></div>
})

const OrderDetailsSection = dynamic(() => import('./OrderDetailsSection'), {
  loading: () => <div className="h-[300px] w-full animate-pulse bg-muted rounded-md"></div>
})

const ShippingSection = dynamic(() => import('./ShippingSection'), {
  loading: () => <div className="h-[200px] w-full animate-pulse bg-muted rounded-md"></div>
})

const OrderItemsSection = dynamic(() => import('./OrderItemsSection'), {
  loading: () => <div className="h-[300px] w-full animate-pulse bg-muted rounded-md"></div>
})

// Lazy load dialogs
const ClientDialog = dynamic(() => import('./dialogs/ClientDialog'), {
  loading: () => null
})

const ContactDialog = dynamic(() => import('./dialogs/ContactDialog'), {
  loading: () => null
})

const DeleteContactDialog = dynamic(() => import('./dialogs/DeleteContactDialog'), {
  loading: () => null
})

const DeleteEntityDialog = dynamic(() => import('./dialogs/DeleteEntityDialog'), {
  loading: () => null
})

const CommodityDialog = dynamic(() => import('./dialogs/CommodityDialog'), {
  loading: () => null
})

// Types
import { OrderFormData, OrderItem } from '@/types/orders'

interface OrderFormProps {
  orderId?: string;
  mode: 'add' | 'edit';
  backUrl?: string;
}

export default function OrderForm({ orderId, mode = 'add', backUrl = '/dashboard/orders' }: OrderFormProps) {
  const router = useRouter()

  // Local loading state
  const [localLoading, setLocalLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Preview order number
  const [previewOrderNumber, setPreviewOrderNumber] = useState<string>('')
  const [nextSequence, setNextSequence] = useState<number>(1)

  // Chuyển đổi mode của component sang mode của hook
  const hookMode = mode === 'add' ? 'create' : 'edit'

  // Quản lý state form đơn hàng
  const orderFormData = useOrderFormV2({
    mode: hookMode,
    orderId,
    onSuccess: ({ id }) => {
      if (mode === 'add') {
        // Redirect is handled inside the hook
      }
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  // Quản lý order items bằng hook chuyên biệt
  const {
    items: orderItems,
    isLoading: isLoadingItems,
    itemError,
    saveItem: addOrUpdateItem,
    deleteItem: removeItem,
    temporaryItems,
    saveTemporaryItems,
    // ...các hàm khác nếu cần
  } = useOrderItems({
    orderId,
    // Có thể truyền initialItems nếu muốn
  });

  // Không cần lưu bản sao của temporaryItems nữa vì chúng ta sử dụng trực tiếp temporaryItems

  // Destructure các phần còn lại của form
  const {
    formData,
    setFormData,
    handleFormChange,
    setFieldValue,
    isLoading,
    isSaving,
    saveOrder,
    resetForm,
    loadOrderDataAndItems
  } = orderFormData;

  // Function to fetch the next sequence number from the database
  const fetchNextSequenceFromDB = useCallback(async (typePrefix: string, teamCode: string, yearCode: string) => {
    try {
      const { fetchNextOrderSequence } = await import('@/utils/supabase/client');
      const { nextSequence, formattedOrderNumber, error } = await fetchNextOrderSequence(typePrefix, teamCode, yearCode);

      if (error) {
        logger.error('Error fetching next sequence:', error);
        return 1; // Default to 1 if there's an error
      }

      return nextSequence;
    } catch (error) {
      logger.error('Error in fetchNextSequenceFromDB:', error);
      return 1; // Default to 1 if there's an error
    }
  }, []);

  // Generate preview order number based on form data
  const generatePreviewOrderNumber = useCallback(async () => {
    if (formData?.order_number) {
      // If order already has a number, use it
      setPreviewOrderNumber(formData.order_number);
    } else if (mode === 'add') {
      // For new orders, generate a preview
      const typePrefix = formData?.type === 'international' ? 'I' : 'L';

      // Get team code based on team_id
      let teamCode = 'XX'; // Default code if team not found

      if (formData?.team_id) {
        try {
          const supabase = createClient();
          const { data: teamData, error } = await supabase
            .from('teams')
            .select('name')
            .eq('id', formData.team_id)
            .single();

          if (!error && teamData) {
            // Map team name to team code
            teamCode = teamData.name === 'Marine' ? 'MR' :
                      teamData.name === 'Agri' ? 'AF' :
                      teamData.name === 'CG' ? 'CG' : 'XX';
          }
        } catch (err) {
          logger.error('Error fetching team data:', err);
        }
      }

      const yearCode = new Date().getFullYear().toString().substring(2);

      // Fetch the next sequence number from the database
      const sequence = await fetchNextSequenceFromDB(typePrefix, teamCode, yearCode);
      setNextSequence(sequence);

      // Format the sequence number with leading zeros
      const sequenceFormatted = String(sequence).padStart(3, '0');

      // Set the preview order number with the actual next sequence
      setPreviewOrderNumber(`${typePrefix}${teamCode}${yearCode}-${sequenceFormatted}`);
    }
  }, [formData?.type, formData?.team_id, formData?.order_number, mode, fetchNextSequenceFromDB])

  // Client management (clients & contacts)
  const clientManagement = useClientAndContactManagement({
    initialClientId: formData?.client_id,
    onClientUpdated: (client) => {
      // When a client is selected or updated, update the form
      if (client && client.id) {
        setFieldValue('client_id', client.id);
      }
    },
    onContactUpdated: (contact) => {
      // When a contact is selected or updated, update the form
      if (contact && contact.id) {
        setFieldValue('contact_id', contact.id);
      }
    }
  });

  const {
    clients,
    contacts,
    getFilteredClients,
    hasMoreClients,
    isLoadingMoreClients,
    clientDialogOpen,
    clientDialogMode,
    clientForm,
    clientError,
    contactDialogOpen,
    contactDialogMode,
    contactForm,
    contactError,
    isConfirmDeleteOpen,
    handleClientFormChange,
    handleContactFormChange,
    handleClientSearch,
    handleLoadMoreClients,
    openAddClientDialog,
    openEditClientDialog,
    openDeleteClientConfirm,
    openAddContactDialog,
    openEditContactDialog,
    openDeleteContactConfirm,
    handleSaveClient,
    handleDeleteClient,
    handleSaveContact,
    handleDeleteContact,
    setClientDialogOpen,
    setContactDialogOpen,
    setIsConfirmDeleteOpen
  } = clientManagement;

  // Use a variable for clientsLoading
  const clientsLoading = clientManagement.loading;

  // Create a wrapper function for client change that can handle string IDs
  const handleClientChange = async (clientId: string) => {
    if (clientManagement.selectClient) {
      // Find client by ID first
      const client = clientManagement.clients.find(c => c.id === clientId) || null;
      // Then select client and load its contacts
      await clientManagement.selectClient(client);
    }
  };

  // Update preview order number when form data changes
  useEffect(() => {
    const updatePreviewOrderNumber = async () => {
      await generatePreviewOrderNumber();
    };

    updatePreviewOrderNumber();
  }, [generatePreviewOrderNumber]);

  // Chỉ sử dụng bảng commodities_new
  const {
    commodities,
    isLoading: isLoadingCommodities,
    isLoadingMore: isLoadingMoreCommodities,
    hasMore: hasMoreCommodities,
    searchQuery: commoditySearch,
    searchCommodities,
    loadMoreCommodities,
    findCommodityById,
    addCommodity
  } = useCommodities()

  // Units with search state
  const { units, isLoading: isLoadingUnits } = useUnits()
  const [unitSearch, setUnitSearch] = useState('')

  // Categories for commodity dialog
  const { categories, isLoading: isLoadingCategories } = useCategories()

  // State for commodity dialog
  const [isCommodityDialogOpen, setIsCommodityDialogOpen] = useState(false)
  const [commodityError, setCommodityError] = useState<string | null>(null)
  const [isAddingCommodity, setIsAddingCommodity] = useState(false)

  // Handler for adding new commodity
  const handleAddCommodity = async (commodityData: { name: string, description?: string, category_id?: string }) => {
    try {
      setIsAddingCommodity(true)
      setCommodityError(null)

      // Kiểm tra dữ liệu đầu vào
      if (!commodityData.name || commodityData.name.trim() === '') {
        throw new Error('Commodity name is required')
      }

      // Xử lý giá trị "none" cho category_id
      const dataToSave = {
        ...commodityData,
        name: commodityData.name.trim(),
        description: commodityData.description?.trim() || null,
        category_id: commodityData.category_id === 'none' ? null : commodityData.category_id
      }

      // Log dữ liệu để debug
      if (process.env.NODE_ENV === 'development') {
        logger.log('Adding commodity with data:', dataToSave)
      }

      // Thêm vào bảng commodities_new (bảng chính và duy nhất)
      try {
        const newCommodity = await addCommodity(dataToSave)

        // Đóng dialog
        setIsCommodityDialogOpen(false)

        // Trả về ID của hàng hóa mới để sử dụng
        return newCommodity.id
      } catch (commodityError) {
        logger.error('Error adding to commodities_new:', commodityError)
        throw new Error(
          commodityError instanceof Error
            ? `Failed to add commodity: ${commodityError.message}`
            : 'Failed to add commodity to database'
        )
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add commodity'
      logger.error('Commodity error:', errorMessage)
      setCommodityError(errorMessage)
    } finally {
      setIsAddingCommodity(false)
    }
  }

  // Load existing order data (now uses loadOrderDataAndItems from hook)
  // We only need to load once when the component mounts
  useEffect(() => {
    // Store these values in refs to avoid dependency issues
    const currentMode = mode;
    const currentOrderId = orderId;
    const loadData = loadOrderDataAndItems;

    if (currentMode === 'edit' && currentOrderId && loadData) {
      // Load order data and items
      loadData(currentOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array to only run once when component mounts

  // Form submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError(null)

      // Chỉ log trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        logger.log('OrderForm: handleSubmit called');
        logger.log('OrderForm: temporaryItems at submit time:', temporaryItems);
      }

      // Validate required fields
      if (!formData.client_id) {
        throw new Error('Please select a client')
      }

      if (!formData.type) {
        throw new Error('Please select an order type')
      }

      if (!formData.team_id) {
        throw new Error('Please select a team')
      }

      if (!formData.order_date) {
        throw new Error('Please select an order date')
      }

      try {
        // Lưu đơn hàng
        const savedOrder = await saveOrder();

        // Lưu các items tạm thời nếu có
        if (savedOrder?.id && temporaryItems?.length > 0) {
          const isDev = process.env.NODE_ENV === 'development';
          if (isDev) logger.log(`Saving ${temporaryItems.length} temporary items for order ${savedOrder.id}`);

          try {
            await saveTemporaryItems(savedOrder.id);
          } catch (itemError) {
            // Không throw error ở đây, vẫn tiếp tục với việc tạo đơn hàng
            if (isDev) logger.error('Error saving temporary items:', itemError);
          }
        }
      } catch (saveError) {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Error saving order:', saveError);
        }
        throw saveError; // Re-throw to be caught by the outer catch block
      }

      // Không cần redirect ở đây vì đã được xử lý trong onSuccess
    } catch (err: any) {
      setError(err.message || 'Failed to save order')
    } finally {
      setSaving(false)
    }
  }, [formData, saveOrder, setSaving, setError, temporaryItems, saveTemporaryItems])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Client Dialog - Lazy Loaded */}
      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        mode={clientDialogMode}
        clientForm={clientForm}
        clientError={clientError}
        handleClientFormChange={handleClientFormChange}
        handleSaveClient={handleSaveClient}
      />

      {/* Delete Client Confirmation Dialog - Lazy Loaded */}
      <DeleteEntityDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        title="Delete Client"
        description="This will permanently remove the client from your system. This action cannot be undone."
        handleDelete={handleDeleteClient}
      />

      {/* Contact Person Dialog - Lazy Loaded */}
      <ContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        mode={contactDialogMode}
        contactForm={contactForm}
        contactError={contactError}
        handleContactFormChange={handleContactFormChange}
        handleSaveContact={handleSaveContact}
      />

      {/* Delete Contact Person Confirmation Dialog - Lazy Loaded */}
      <DeleteContactDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        handleDeleteContact={handleDeleteContact}
      />

      {/* Commodity Dialog - Lazy Loaded */}
      <CommodityDialog
        open={isCommodityDialogOpen}
        onOpenChange={setIsCommodityDialogOpen}
        categories={categories}
        error={commodityError}
        handleSave={handleAddCommodity}
        isLoading={isAddingCommodity || isLoadingCategories}
      />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href={backUrl} className="mr-4">
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold">{mode === 'add' ? 'Create New Order' : 'Edit Order'}</h1>
        </div>
        <div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(backUrl)}
              disabled={isSaving || saving}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="flex items-center"
              onClick={handleSubmit}
              disabled={isSaving || saving}
            >
              {isSaving || saving ? (
                <>Saving...</>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {mode === 'add' ? (
                    temporaryItems && temporaryItems.length > 0 ?
                      `Save Order & ${temporaryItems.length} Item${temporaryItems.length > 1 ? 's' : ''}` :
                      'Save Order'
                  ) : (
                    'Update Order'
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column (30%) - Order Details only */}
        <div className="md:w-[30%]">
          <OrderDetailsSection
            formData={formData}
            handleChange={handleFormChange}
            handleValueChange={setFieldValue as any}
            previewOrderNumber={previewOrderNumber}
            isEditMode={mode === 'edit'}
          />
        </div>

        {/* Right column (70%) - Client Information and Shipping */}
        <div className="md:w-[70%] flex flex-col gap-6">
          {/* Client Information - taller layout */}
          <div className="flex-1">
            <ClientInformationSection
              formData={formData}
              handleChange={handleFormChange}
              handleValueChange={setFieldValue as any}
              handleClientChange={handleClientChange}
              clients={clients}
              contacts={contacts}
              loading={clientsLoading}
              getFilteredClients={getFilteredClients}
              hasMoreClients={hasMoreClients}
              isLoadingMoreClients={isLoadingMoreClients}
              loadMoreClients={handleLoadMoreClients}
              handleClientSearch={handleClientSearch}
              openAddClientDialog={openAddClientDialog}
              openEditClientDialog={openEditClientDialog}
              openDeleteClientConfirm={openDeleteClientConfirm}
              openAddContactDialog={openAddContactDialog}
              openEditContactDialog={openEditContactDialog}
              openDeleteContactConfirm={openDeleteContactConfirm}
            />
          </div>

          {/* Shipping Information - thêm lại đơn giản */}
          <div className="flex-1">
            <ShippingSection
              formData={formData}
              handleChange={handleFormChange}
              handleValueChange={setFieldValue as any}
              isLoading={false}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <OrderItemsSection
          orderItems={orderItems}
          addOrUpdateItem={addOrUpdateItem}
          removeItem={removeItem}
          commodities={commodities}
          units={units}
          isLoadingCommodities={isLoadingCommodities}
          isLoadingUnits={isLoadingUnits}
          isLoadingItems={isLoadingItems}
          itemError={itemError}
          hasMoreCommodities={hasMoreCommodities}
          isLoadingMoreCommodities={isLoadingMoreCommodities}
          loadMoreCommodities={loadMoreCommodities}
          handleCommoditySearch={searchCommodities}
          onAddNewCommodity={() => setIsCommodityDialogOpen(true)}
        />
      </div>
    </div>
  )
}