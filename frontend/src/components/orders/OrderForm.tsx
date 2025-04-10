'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { useClientAndContactManagement } from '@/hooks/useClientAndContactManagement'
import { useUnits } from "@/hooks/useUnits"
import { useCommodities } from "@/hooks/useCommodities"

// Component sections
import ClientInformationSection from './ClientInformationSection'
import OrderDetailsSection from './OrderDetailsSection'
import ShippingSection from './ShippingSection'
import OrderItemsSection from './OrderItemsSection'

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

  // Generate preview order number based on form data
  const generatePreviewOrderNumber = useCallback(() => {
    if (formData?.order_number) {
      // If order already has a number, use it
      setPreviewOrderNumber(formData.order_number);
    } else if (mode === 'add') {
      // For new orders, generate a preview
      const typePrefix = formData?.type === 'international' ? 'I' : 'L';
      const deptCode = formData?.department === 'marine' ? 'MR' :
                      formData?.department === 'agriculture' ? 'AG' : 'CG';
      const yearCode = new Date().getFullYear().toString().substring(2);
      setPreviewOrderNumber(`${typePrefix}${deptCode}${yearCode}-XXX`);
    }
  }, [formData?.type, formData?.department, formData?.order_number, mode])

  // Chuyển đổi mode của component sang mode của hook
  const hookMode = mode === 'add' ? 'create' : 'edit'

  // Hook now manages items internally via localOrderItems state
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

  // Destructure necessary parts, including item management functions
  const {
    formData,
    setFormData,
    handleFormChange,
    setFieldValue,
    isLoading,
    isSaving,
    saveOrder,
    resetForm,
    localOrderItems, // The list of items
    addLocalItem,    // Function to add item (called by OrderItemsSection)
    updateLocalItem, // Function to update item (called by OrderItemsSection)
    removeLocalItem, // Function to remove item (called by OrderItemsSection)
    isLoadingItems,  // Pass down if needed by OrderItemsSection
    itemError,       // Pass down if needed by OrderItemsSection
    loadOrderDataAndItems
  } = orderFormData;

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
    generatePreviewOrderNumber();
  }, [generatePreviewOrderNumber]);

  // Commodities with pagination and search
  const {
    commodities,
    isLoading: isLoadingCommodities,
    isLoadingMore: isLoadingMoreCommodities,
    hasMore: hasMoreCommodities,
    searchQuery: commoditySearch,
    searchCommodities,
    loadMoreCommodities,
    findCommodityById
  } = useCommodities()

  // Units with search state
  const { units, isLoading: isLoadingUnits } = useUnits()
  const [unitSearch, setUnitSearch] = useState('')

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

      // Validate required fields
      if (!formData.client_id) {
        throw new Error('Please select a client')
      }

      if (!formData.type) {
        throw new Error('Please select an order type')
      }

      if (!formData.department) {
        throw new Error('Please select a department')
      }

      if (!formData.order_date) {
        throw new Error('Please select an order date')
      }

      // Lưu đơn hàng bằng hook, hook sẽ gọi callback onSuccess khi hoàn thành
      await saveOrder();

      // Không cần redirect ở đây vì đã được xử lý trong onSuccess
    } catch (err: any) {
      setError(err.message || 'Failed to save order')
    } finally {
      setSaving(false)
    }
  }, [formData, saveOrder, setSaving, setError])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Client Dialog */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{clientDialogMode === 'add' ? 'Add New Client' : 'Edit Client'}</DialogTitle>
            <DialogDescription>
              {clientDialogMode === 'add'
                ? 'Add a new client to your order system.'
                : 'Edit the selected client information.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {clientError && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{clientError}</div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="client-name">Company Name*</Label>
              <Input
                id="client-name"
                name="name"
                value={clientForm.name}
                onChange={handleClientFormChange}
                placeholder="Enter company name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                name="email"
                type="email"
                value={clientForm.email}
                onChange={handleClientFormChange}
                placeholder="company@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client-phone">Phone</Label>
              <Input
                id="client-phone"
                name="phone"
                value={clientForm.phone}
                onChange={handleClientFormChange}
                placeholder="Phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client-address">Address</Label>
              <Input
                id="client-address"
                name="address"
                value={clientForm.address}
                onChange={handleClientFormChange}
                placeholder="Company address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveClient}>
              {clientDialogMode === 'add' ? 'Add Client' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Client Confirmation Dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              This will permanently remove the client from your system.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this client? This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClient}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Person Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{contactDialogMode === 'add' ? 'Add New Contact' : 'Edit Contact'}</DialogTitle>
            <DialogDescription>
              {contactDialogMode === 'add'
                ? 'Add a new contact person for this client.'
                : 'Edit the selected contact information.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {contactError && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{contactError}</div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="contact-fullname">Full Name*</Label>
              <Input
                id="contact-fullname"
                name="full_name"
                value={contactForm.full_name}
                onChange={handleContactFormChange}
                placeholder="Enter full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-position">Position</Label>
              <Input
                id="contact-position"
                name="position"
                value={contactForm.position}
                onChange={handleContactFormChange}
                placeholder="Enter position"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                value={contactForm.email}
                onChange={handleContactFormChange}
                placeholder="contact@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                name="phone"
                value={contactForm.phone}
                onChange={handleContactFormChange}
                placeholder="Phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveContact}>
              {contactDialogMode === 'add' ? 'Add Contact' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Person Confirmation Dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              This will permanently remove the contact from your system.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this contact person? This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteContact}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  {mode === 'add' ? 'Save Order' : 'Update Order'}
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
          orderItems={localOrderItems}
          addLocalItem={addLocalItem}
          updateLocalItem={updateLocalItem}
          removeLocalItem={removeLocalItem}
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
        />
      </div>
    </div>
  )
}