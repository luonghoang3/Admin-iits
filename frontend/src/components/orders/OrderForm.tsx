'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  createOrder,
  updateOrder,
  fetchNextOrderSequence,
  fetchOrder,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
  fetchClient
} from '@/utils/supabase/client'
import { 
  fetchShipper,
  fetchBuyer 
} from '@/utils/supabase/shipping'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeftIcon, ArrowDownTrayIcon as SaveIcon } from "@heroicons/react/24/outline"

// Add Dialog imports
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"

// Custom hooks
import { useOrderForm } from '@/hooks/useOrderForm'
import { useClientAndContactManagement } from '@/hooks/useClientAndContactManagement'
import { useShippingEntities } from '@/hooks/useShippingEntities'

// Component sections
import ClientInformationSection from './ClientInformationSection'
import OrderDetailsSection from './OrderDetailsSection'
import ShippingSection from './ShippingSection'
import OrderItemsSection from './OrderItemsSection'

// Types
import { OrderFormData, OrderItem } from '@/types/orders.d'

interface OrderFormProps {
  orderId?: string;
  mode: 'add' | 'edit';
  backUrl?: string;
}

export default function OrderForm({ orderId, mode = 'add', backUrl = '/dashboard/orders' }: OrderFormProps) {
  const router = useRouter()
  
  const [localLoading, setLocalLoading] = useState(false)
  const [previewOrderNumber, setPreviewOrderNumber] = useState("")
  
  // Use our custom hooks
  const {
    formData,
    setFormData,
    orderItems,
    currentItem,
    loading,
    saving,
    setSaving,
    error,
    setError,
    itemFormOpen,
    itemError,
    isEditingItem,
    commodities,
    units,
    commoditySearch,
    unitSearch,
    setCommoditySearch,
    setUnitSearch,
    getFilteredCommodities,
    getFilteredUnits,
    openAddItemForm,
    openEditItemForm,
    handleItemChange,
    handleItemSelectChange,
    handleSaveItem,
    handleDeleteItem,
    setItemFormOpen,
    handleChange,
    handleValueChange,
    handleCommoditySearch,
    hasMoreCommodities,
    isLoadingMoreCommodities,
    loadMoreCommodities,
    setOrderItems
  } = useOrderForm({
    initialOrderData: orderId ? { 
      id: orderId, 
      client_id: '', 
      type: 'international', 
      department: 'marine', 
      order_date: new Date().toISOString().split('T')[0] 
    } : undefined,
    orderId: orderId
  })
  
  // Client and contact management
  const {
    clients,
    contacts,
    setContacts,
    loading: clientsLoading,
    clientDialogOpen,
    setClientDialogOpen,
    clientDialogMode,
    clientForm,
    clientError,
    isConfirmDeleteOpen,
    setIsConfirmDeleteOpen,
    contactDialogOpen,
    setContactDialogOpen,
    contactDialogMode,
    contactForm,
    contactError,
    isConfirmDeleteContactOpen,
    setIsConfirmDeleteContactOpen,
    openAddClientDialog,
    openEditClientDialog,
    openDeleteClientConfirm,
    handleClientFormChange,
    handleSaveClient,
    handleDeleteClient,
    openAddContactDialog,
    openEditContactDialog,
    openDeleteContactConfirm,
    handleContactFormChange,
    handleSaveContact,
    handleDeleteContact,
    handleLoadMoreClients,
    handleClientSearch,
    getFilteredClients,
    hasMoreClients,
    isLoadingMoreClients
  } = useClientAndContactManagement({
    onClientUpdated: (client) => {
      if (client.id) {
        setFormData(prev => ({ ...prev, client_id: client.id }))
        handleClientChange(client.id)
      }
    },
    onContactUpdated: (contact) => {
      if (contact.id) {
        setFormData(prev => ({ ...prev, contact_id: contact.id }))
      }
    },
    initialClientId: formData.client_id
  })
  
  // Shipping entities (shippers and buyers)
  const {
    shippers,
    shipperQuery,
    shipperDialogOpen,
    setShipperDialogOpen,
    shipperDialogMode,
    shipperForm,
    shipperError,
    isConfirmDeleteShipperOpen,
    setIsConfirmDeleteShipperOpen,
    buyers,
    buyerQuery,
    buyerDialogOpen,
    setBuyerDialogOpen,
    buyerDialogMode,
    buyerForm,
    buyerError,
    isConfirmDeleteBuyerOpen,
    setIsConfirmDeleteBuyerOpen,
    openAddShipperDialog,
    openEditShipperDialog,
    openDeleteShipperConfirm,
    handleShipperFormChange,
    handleSaveShipper,
    handleDeleteShipper,
    openAddBuyerDialog,
    openEditBuyerDialog,
    openDeleteBuyerConfirm,
    handleBuyerFormChange,
    handleSaveBuyer,
    handleDeleteBuyer,
    handleShipperSearch,
    handleBuyerSearch,
    loadMoreShippers,
    loadMoreBuyers,
    getFilteredShippers,
    getFilteredBuyers,
    hasMoreShippers,
    isLoadingMoreShippers,
    hasMoreBuyers,
    isLoadingMoreBuyers,
    setShippers,
    setBuyers
  } = useShippingEntities({
    onShipperUpdated: (shipper) => {
      if (shipper.id) {
        setFormData(prev => ({ ...prev, shipper_id: shipper.id }))
      }
    },
    onBuyerUpdated: (buyer) => {
      if (buyer.id) {
        setFormData(prev => ({ ...prev, buyer_id: buyer.id }))
      }
    }
  })
  
  // Load existing order when in edit mode
  useEffect(() => {
    if (mode === 'edit' && orderId) {
      // Load existing order data
      loadOrderData(orderId)
    }
  }, [mode, orderId]);
  
  // Load contacts when client changes
  const handleClientChange = async (clientId: string) => {
    if (!clientId) return
    
    try {
      setLocalLoading(true)
      
      // Fetch contacts for this client
      const { client, error } = await fetchClient(clientId)
      
      if (error) {
        console.error('Error fetching client details:', error)
        return
      }
      
      if (client && client.contacts) {
        setContacts(client.contacts)
      }
    } catch (err) {
      console.error('Error fetching client details:', err)
    } finally {
      setLocalLoading(false)
    }
  }
  
  // Update order number preview
  const updateOrderNumberPreview = async (
    selectedType: 'international' | 'local', 
    selectedDepartment: 'marine' | 'agriculture' | 'consumer goods'
  ) => {
    try {
      // Don't generate new order number in edit mode
      if (mode === 'edit' && formData.order_number) {
        return
      }
      
      // Generate preview based on selected options
      const typePrefix = selectedType === 'international' ? 'I' : 'L'
      
      let departmentCode = 'MR'
      if (selectedDepartment === 'agriculture') departmentCode = 'AF'
      if (selectedDepartment === 'consumer goods') departmentCode = 'CG'
      
      const currentYear = new Date().getFullYear().toString().substring(2) // Get last 2 digits of year
      
      // Get next sequence number
      const { nextSequence, error: sequenceError } = await fetchNextOrderSequence(
        typePrefix, 
        departmentCode, 
        currentYear
      )
      
      if (sequenceError) {
        throw new Error(`Error getting next sequence: ${sequenceError}`)
      }
      
      // Format with leading zeros to ensure 3 digits
      const sequenceFormatted = nextSequence.toString().padStart(3, '0')
      
      // Combine all parts to create the order number
      const orderNumber = `${typePrefix}${departmentCode}${currentYear}-${sequenceFormatted}`
      
      setPreviewOrderNumber(orderNumber)
      setFormData(prev => ({ ...prev, order_number: orderNumber }))
    } catch (error: any) {
      console.error('Error updating order number preview:', error)
      setError(error.message || 'Failed to generate order number')
    }
  }
  
  // Initialize order number preview for new orders
  useEffect(() => {
    if (mode === 'add') {
      updateOrderNumberPreview('international', 'marine')
    }
  }, [mode])
  
  // Update order number preview when type or department changes
  useEffect(() => {
    if (formData.type && formData.department) {
      updateOrderNumberPreview(formData.type, formData.department)
    }
  }, [formData.type, formData.department, mode])
  
  // Load existing order data
  const loadOrderData = async (id: string) => {
    try {
      setLocalLoading(true)
      
      const { order, error } = await fetchOrder(id)
      
      if (error) {
        throw new Error(`Failed to load order: ${error}`)
      }
      
      if (order) {
        // Convert department from API format to UI format
        let uiDepartment: 'marine' | 'agriculture' | 'consumer goods' = 'marine';
        
        if (order.department === 'marine') {
          uiDepartment = 'marine';
        } else if (order.department === 'agri') {
          uiDepartment = 'agriculture';
        } else if (order.department === 'consumer_goods') {
          uiDepartment = 'consumer goods';
        }
        
        // Update form data with order details
        const updatedFormData = {
          id: order.id,
          client_id: order.client_id,
          contact_id: order.contact_id,
          type: order.type as 'international' | 'local',
          department: uiDepartment,
          order_date: order.order_date,
          client_ref_code: order.client_ref_code,
          vessel_carrier: order.vessel_carrier,
          bill_of_lading: order.bill_of_lading,
          bill_of_lading_date: order.bill_of_lading_date,
          order_number: order.order_number,
          shipper_id: order.shipper_id,
          buyer_id: order.buyer_id,
          status: order.status as 'draft' | 'confirmed' | 'completed' | 'cancelled',
          notes: order.notes || null
        };
        
        // Pre-load the shipper and buyer if they exist
        if (order.shipper_id) {
          try {
            const { shipper } = await fetchShipper(order.shipper_id);
            if (shipper) {
              // If we find the shipper, add it to the shippers list if not already there
              setShippers(prev => {
                if (!prev.some(s => s.id === shipper.id)) {
                  return [shipper, ...prev];
                }
                return prev;
              });
            }
          } catch (err) {
            console.error("Error fetching shipper:", err);
          }
        }
        
        if (order.buyer_id) {
          try {
            const { buyer } = await fetchBuyer(order.buyer_id);
            if (buyer) {
              // If we find the buyer, add it to the buyers list if not already there
              setBuyers(prev => {
                if (!prev.some(b => b.id === buyer.id)) {
                  return [buyer, ...prev];
                }
                return prev;
              });
            }
          } catch (err) {
            console.error("Error fetching buyer:", err);
          }
        }
        
        setFormData(updatedFormData);
        
        // Load contacts for this client
        if (order.client_id) {
          handleClientChange(order.client_id)
        }
        
        // Set preview order number
        if (order.order_number) {
          setPreviewOrderNumber(order.order_number)
        }
      }
    } catch (err: any) {
      console.error('Error loading order:', err)
      setError(err.message || 'Failed to load order')
    } finally {
      setLocalLoading(false)
    }
  }
  
  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
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
      
      // Convert department values to match API expectations
      let apiDepartment: 'marine' | 'agri' | 'consumer_goods' = 'marine';
      
      if (formData.department === 'marine') {
        apiDepartment = 'marine';
      } else if (formData.department === 'agriculture') {
        apiDepartment = 'agri';
      } else if (formData.department === 'consumer goods') {
        apiDepartment = 'consumer_goods';
      }
      
      const orderData = {
        client_id: formData.client_id,
        contact_id: formData.contact_id || null,
        type: formData.type,
        department: apiDepartment,
        order_date: formData.order_date,
        client_ref_code: formData.client_ref_code || null,
        vessel_carrier: formData.vessel_carrier || null,
        bill_of_lading: formData.bill_of_lading || null,
        bill_of_lading_date: formData.bill_of_lading_date || null,
        order_number: formData.order_number || null,
        shipper_id: formData.shipper_id || null,
        buyer_id: formData.buyer_id || null,
        status: (formData.status || 'draft') as 'draft' | 'confirmed' | 'completed' | 'cancelled'
      };
      
      if (mode === 'add') {
        // Create the order
        const { order, error: orderError } = await createOrder(orderData)
        
        if (orderError) {
          throw new Error(`Failed to create order: ${orderError}`)
        }
        
        if (!order) {
          throw new Error('Order creation failed')
        }
        
        // Add order items
        if (orderItems.length > 0) {
          for (const item of orderItems) {
            const { error: itemError } = await createOrderItem({
              order_id: order.id,
              commodity_id: item.commodity_id,
              quantity: item.quantity,
              unit_id: item.unit_id,
              commodity_description: item.commodity_description || undefined
            })
            
            if (itemError) {
              console.error(`Error creating order item: ${itemError}`)
              // Continue with other items even if one fails
            }
          }
        }
        
        // Redirect to the orders page with success message
        router.push(backUrl)
        
      } else if (mode === 'edit' && orderId) {
        // Update the order
        const { order, error: orderError } = await updateOrder(orderId, orderData)
        
        if (orderError) {
          throw new Error(`Failed to update order: ${orderError}`)
        }
        
        if (!order) {
          throw new Error('Order update failed')
        }
        
        // Handle order items - lưu order items khi edit
        if (orderItems.length > 0) {
          // Xử lý từng item trong danh sách
          for (const item of orderItems) {
            // Nếu item đã có ID, cập nhật nó
            if (item.id) {
              const { error: itemError } = await updateOrderItem(
                item.id,
                {
                  commodity_id: item.commodity_id,
                  quantity: item.quantity,
                  unit_id: item.unit_id,
                  commodity_description: item.commodity_description || undefined
                }
              );
              
              if (itemError) {
                console.error(`Error updating order item: ${itemError}`);
              }
            } else {
              // Nếu không có ID, tạo mới item
              const { error: itemError } = await createOrderItem({
                order_id: orderId,
                commodity_id: item.commodity_id,
                quantity: item.quantity,
                unit_id: item.unit_id,
                commodity_description: item.commodity_description || undefined
              });
              
              if (itemError) {
                console.error(`Error creating order item: ${itemError}`);
              }
            }
          }
        }
        
        // Redirect to the orders page with success message
        router.push(backUrl)
      }
      
    } catch (err: any) {
      console.error('Error saving order:', err)
      setError(err.message || 'Failed to save order')
    } finally {
      setSaving(false)
    }
  }
  
  // Convert openEditItemForm to accept a string parameter
  const handleEditItem = (itemId: string) => {
    if (!orderItems || orderItems.length === 0) {
      console.error("Cannot edit item - orderItems is empty");
      return;
    }
    
    const index = orderItems.findIndex(item => item.id === itemId);
    
    if (index !== -1) {
      openEditItemForm(index);
    } else {
      console.error("Could not find item with ID:", itemId);
      console.error("Available item IDs:", orderItems.map(item => item.id));
    }
  };
  
  // Ensure units have the required abbreviation property for compatibility
  const enhancedUnits = units.map(unit => ({
    ...unit,
    abbreviation: unit.name // Use name as fallback if abbreviation is not available
  }));

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
      <Dialog open={isConfirmDeleteContactOpen} onOpenChange={setIsConfirmDeleteContactOpen}>
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
            <Button variant="outline" onClick={() => setIsConfirmDeleteContactOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteContact}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipper Dialog */}
      <Dialog open={shipperDialogOpen} onOpenChange={setShipperDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{shipperDialogMode === 'add' ? 'Add New Shipper' : 'Edit Shipper'}</DialogTitle>
            <DialogDescription>
              {shipperDialogMode === 'add' 
                ? 'Add a new shipper to your order system.' 
                : 'Edit the selected shipper information.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {shipperError && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{shipperError}</div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="shipper-name">Shipper Name*</Label>
              <Input 
                id="shipper-name" 
                name="name" 
                value={shipperForm.name} 
                onChange={handleShipperFormChange} 
                placeholder="Enter shipper name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shipper-email">Email</Label>
              <Input 
                id="shipper-email" 
                name="email" 
                type="email"
                value={shipperForm.email} 
                onChange={handleShipperFormChange} 
                placeholder="shipper@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shipper-phone">Phone</Label>
              <Input 
                id="shipper-phone" 
                name="phone" 
                value={shipperForm.phone} 
                onChange={handleShipperFormChange} 
                placeholder="Phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shipper-address">Address</Label>
              <Input 
                id="shipper-address" 
                name="address" 
                value={shipperForm.address} 
                onChange={handleShipperFormChange} 
                placeholder="Shipper address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipperDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveShipper}>
              {shipperDialogMode === 'add' ? 'Add Shipper' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Shipper Confirmation Dialog */}
      <Dialog open={isConfirmDeleteShipperOpen} onOpenChange={setIsConfirmDeleteShipperOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Shipper</DialogTitle>
            <DialogDescription>
              This will permanently remove the shipper from your system.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this shipper? This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setIsConfirmDeleteShipperOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteShipper}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buyer Dialog */}
      <Dialog open={buyerDialogOpen} onOpenChange={setBuyerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{buyerDialogMode === 'add' ? 'Add New Buyer' : 'Edit Buyer'}</DialogTitle>
            <DialogDescription>
              {buyerDialogMode === 'add' 
                ? 'Add a new buyer to your order system.' 
                : 'Edit the selected buyer information.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {buyerError && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{buyerError}</div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="buyer-name">Buyer Name*</Label>
              <Input 
                id="buyer-name" 
                name="name" 
                value={buyerForm.name} 
                onChange={handleBuyerFormChange} 
                placeholder="Enter buyer name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buyer-email">Email</Label>
              <Input 
                id="buyer-email" 
                name="email" 
                type="email"
                value={buyerForm.email} 
                onChange={handleBuyerFormChange} 
                placeholder="buyer@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buyer-phone">Phone</Label>
              <Input 
                id="buyer-phone" 
                name="phone" 
                value={buyerForm.phone} 
                onChange={handleBuyerFormChange} 
                placeholder="Phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buyer-address">Address</Label>
              <Input 
                id="buyer-address" 
                name="address" 
                value={buyerForm.address} 
                onChange={handleBuyerFormChange} 
                placeholder="Buyer address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyerDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBuyer}>
              {buyerDialogMode === 'add' ? 'Add Buyer' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Buyer Confirmation Dialog */}
      <Dialog open={isConfirmDeleteBuyerOpen} onOpenChange={setIsConfirmDeleteBuyerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Buyer</DialogTitle>
            <DialogDescription>
              This will permanently remove the buyer from your system.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this buyer? This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setIsConfirmDeleteBuyerOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBuyer}>
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
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="flex items-center"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
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
            handleChange={handleChange}
            handleValueChange={handleValueChange}
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
              handleChange={handleChange}
              handleValueChange={handleValueChange}
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
          
          {/* Shipping Information - compact layout */}
          <div className="flex-1">
            <ShippingSection 
              formData={formData}
              handleChange={handleChange}
              handleValueChange={handleValueChange}
              shippers={shippers}
              buyers={buyers}
              getFilteredShippers={getFilteredShippers}
              getFilteredBuyers={getFilteredBuyers}
              hasMoreShippers={hasMoreShippers}
              isLoadingMoreShippers={isLoadingMoreShippers}
              hasMoreBuyers={hasMoreBuyers}
              isLoadingMoreBuyers={isLoadingMoreBuyers}
              loadMoreShippers={loadMoreShippers}
              loadMoreBuyers={loadMoreBuyers}
              handleShipperSearch={handleShipperSearch}
              handleBuyerSearch={handleBuyerSearch}
              openAddShipperDialog={openAddShipperDialog}
              openEditShipperDialog={openEditShipperDialog}
              openDeleteShipperConfirm={openDeleteShipperConfirm}
              openAddBuyerDialog={openAddBuyerDialog}
              openEditBuyerDialog={openEditBuyerDialog}
              openDeleteBuyerConfirm={openDeleteBuyerConfirm}
            />
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <OrderItemsSection 
          orderItems={orderItems}
          currentItem={currentItem}
          itemFormOpen={itemFormOpen}
          setItemFormOpen={setItemFormOpen}
          itemError={itemError}
          isEditingItem={isEditingItem}
          commodities={commodities}
          units={enhancedUnits}
          commoditySearch={commoditySearch}
          unitSearch={unitSearch}
          setCommoditySearch={setCommoditySearch}
          setUnitSearch={setUnitSearch}
          getFilteredCommodities={getFilteredCommodities}
          getFilteredUnits={() => enhancedUnits.filter(unit => 
            unitSearch === "" || unit.name.toLowerCase().includes(unitSearch.toLowerCase())
          )}
          hasMoreCommodities={hasMoreCommodities}
          isLoadingMoreCommodities={isLoadingMoreCommodities}
          loadMoreCommodities={loadMoreCommodities}
          openAddItemForm={openAddItemForm}
          openEditItemForm={handleEditItem}
          handleItemChange={handleItemChange}
          handleItemSelectChange={handleItemSelectChange}
          handleSaveItem={handleSaveItem}
          handleDeleteItem={handleDeleteItem}
          handleCommoditySearch={handleCommoditySearch}
        />
      </div>
    </div>
  )
}