'use client'

import React, { useState, Fragment } from 'react'
import { Combobox, Transition } from '@headlessui/react'

// Import individual icons with ts-ignore to suppress type errors
// @ts-ignore
import ChevronUpDown from "lucide-react/dist/esm/icons/chevron-up-down"
// @ts-ignore
import Plus from "lucide-react/dist/esm/icons/plus"
// @ts-ignore
import Pencil from "lucide-react/dist/esm/icons/pencil"
// @ts-ignore
import Trash2 from "lucide-react/dist/esm/icons/trash-2"
// @ts-ignore
import Search from "lucide-react/dist/esm/icons/search"
// @ts-ignore
import RotateCw from "lucide-react/dist/esm/icons/rotate-cw"
// @ts-ignore
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Shipper, Buyer } from '@/types/orders'
import useShipperBuyerManagement from '@/hooks/orders/useShipperBuyerManagement'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Combobox as HeadlessuiCombobox } from '@/components/ui/combobox'

export interface ShipperBuyerSectionProps {
  shipperId?: string
  buyerId?: string
  onChange: (type: 'shipper' | 'buyer', id: string) => void
  disabled?: boolean
}

export default function ShipperBuyerSection({
  shipperId,
  buyerId,
  onChange,
  disabled = false
}: ShipperBuyerSectionProps) {
  const {
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
  } = useShipperBuyerManagement({
    initialShipperId: shipperId,
    initialBuyerId: buyerId,
    onChange: (data) => {
      if (data.shipperId !== undefined && data.shipperId !== shipper?.id) {
        onChange('shipper', data.shipperId || '');
      }
      if (data.buyerId !== undefined && data.buyerId !== buyer?.id) {
        onChange('buyer', data.buyerId || '');
      }
    }
  })

  const filteredShippers = shipperSearch
    ? shippers.filter(s => 
        s.name.toLowerCase().includes(shipperSearch.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(shipperSearch.toLowerCase())))
    : shippers

  const filteredBuyers = buyerSearch
    ? buyers.filter(b => 
        b.name.toLowerCase().includes(buyerSearch.toLowerCase()) ||
        (b.email && b.email.toLowerCase().includes(buyerSearch.toLowerCase())))
    : buyers

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Shipper Section */}
      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <HeadlessuiCombobox
              items={shippers.map(s => ({
                label: s.name,
                description: s.email || '',
                value: s.id
              }))}
              value={shipper?.id || ''}
              onChange={onShipperChange}
              placeholder="Select shipper..."
              onSearch={onShipperSearch}
              disabled={disabled}
              loading={isLoadingShippers}
              emptyContent={
                <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                  {shipperSearch ? "No shippers found" : "Type to search shippers"}
                </div>
              }
              loadingContent={
                <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                  Loading...
                </div>
              }
              showSelected
              onLoadMore={onLoadMoreShippers}
              hasMore={hasMoreShippers}
              isLoadingMore={isLoadingMoreShippers}
              selectedItemData={shipper ? { value: shipper.id, label: shipper.name, description: shipper.email || undefined } : null}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={disabled} title="Shipper options">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openAddShipperDialog}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Add New Shipper</span>
              </DropdownMenuItem>
              {shipper && (
                <>
                  <DropdownMenuItem onClick={openEditShipperDialog}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Edit {shipper.name}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openDeleteShipperConfirm} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete {shipper.name}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Buyer Section */}
      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <HeadlessuiCombobox
              items={buyers.map(b => ({
                label: b.name,
                description: b.email || '',
                value: b.id
              }))}
              value={buyer?.id || ''}
              onChange={onBuyerChange}
              placeholder="Select buyer..."
              onSearch={onBuyerSearch}
              disabled={disabled}
              loading={isLoadingBuyers}
              emptyContent={
                <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                  {buyerSearch ? "No buyers found" : "Type to search buyers"}
                </div>
              }
              loadingContent={
                <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                  Loading...
                </div>
              }
              showSelected
              onLoadMore={onLoadMoreBuyers}
              hasMore={hasMoreBuyers}
              isLoadingMore={isLoadingMoreBuyers}
              selectedItemData={buyer ? { value: buyer.id, label: buyer.name, description: buyer.email || undefined } : null}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={disabled} title="Buyer options">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openAddBuyerDialog}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Add New Buyer</span>
              </DropdownMenuItem>
              {buyer && (
                <>
                  <DropdownMenuItem onClick={openEditBuyerDialog}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Edit {buyer.name}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openDeleteBuyerConfirm} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete {buyer.name}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Shipper Dialog */}
      <Dialog open={shipperDialogOpen} onOpenChange={setShipperDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {shipperDialogMode === 'add' ? 'Add Shipper' : 'Edit Shipper'}
            </DialogTitle>
            <DialogDescription>
              Enter the details for the shipper.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="shipper-name">Name *</Label>
              <Input
                id="shipper-name"
                name="name"
                value={shipperForm.name}
                onChange={handleShipperFormChange}
                placeholder="Enter shipper name"
                autoComplete="organization"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shipper-address">Address</Label>
              <Input
                id="shipper-address"
                name="address"
                value={shipperForm.address}
                onChange={handleShipperFormChange}
                placeholder="Enter address"
                autoComplete="street-address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shipper-phone">Phone</Label>
              <Input
                id="shipper-phone"
                name="phone"
                type="tel"
                value={shipperForm.phone}
                onChange={handleShipperFormChange}
                placeholder="Enter phone number"
                autoComplete="tel"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shipper-email">Email</Label>
              <Input
                id="shipper-email"
                name="email"
                type="email"
                value={shipperForm.email}
                onChange={handleShipperFormChange}
                placeholder="Enter email"
                autoComplete="email"
              />
            </div>
            
            {shipperError && (
              <p className="text-sm text-destructive">{shipperError}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipperDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveShipper}>
              {shipperDialogMode === 'add' ? 'Add' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buyer Dialog */}
      <Dialog open={buyerDialogOpen} onOpenChange={setBuyerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {buyerDialogMode === 'add' ? 'Add Buyer' : 'Edit Buyer'}
            </DialogTitle>
            <DialogDescription>
              Enter the details for the buyer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="buyer-name">Name *</Label>
              <Input
                id="buyer-name"
                name="name"
                value={buyerForm.name}
                onChange={handleBuyerFormChange}
                placeholder="Enter buyer name"
                autoComplete="organization"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="buyer-address">Address</Label>
              <Input
                id="buyer-address"
                name="address"
                value={buyerForm.address}
                onChange={handleBuyerFormChange}
                placeholder="Enter address"
                autoComplete="street-address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="buyer-phone">Phone</Label>
              <Input
                id="buyer-phone"
                name="phone"
                type="tel"
                value={buyerForm.phone}
                onChange={handleBuyerFormChange}
                placeholder="Enter phone number"
                autoComplete="tel"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="buyer-email">Email</Label>
              <Input
                id="buyer-email"
                name="email"
                type="email"
                value={buyerForm.email}
                onChange={handleBuyerFormChange}
                placeholder="Enter email"
                autoComplete="email"
              />
            </div>
            
            {buyerError && (
              <p className="text-sm text-destructive">{buyerError}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyerDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBuyer}>
              {buyerDialogMode === 'add' ? 'Add' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Shipper Confirmation */}
      <AlertDialog open={isConfirmDeleteShipperOpen} onOpenChange={setIsConfirmDeleteShipperOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the shipper. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteShipper} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Buyer Confirmation */}
      <AlertDialog open={isConfirmDeleteBuyerOpen} onOpenChange={setIsConfirmDeleteBuyerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the buyer. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBuyer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 