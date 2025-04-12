'use client'

import React, { useState } from 'react'

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Shipper, Buyer } from '@/types/orders'
import useShipperBuyerManagement from '@/hooks/orders/useShipperBuyerManagement'

// Lazy load dialogs
import dynamic from 'next/dynamic'

const ShipperDialog = dynamic(() => import('./dialogs/ShipperDialog'), {
  loading: () => null
})

const BuyerDialog = dynamic(() => import('./dialogs/BuyerDialog'), {
  loading: () => null
})

const DeleteEntityDialog = dynamic(() => import('./dialogs/DeleteEntityDialog'), {
  loading: () => null
})
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

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Combobox as HeadlessuiCombobox } from '@/components/ui/combobox'

interface ShipperBuyerSectionProps {
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
              items={Array.from(new Map(shippers.map(s => [
                s.id, {
                  label: s.name,
                  description: s.email || '',
                  value: s.id
                }
              ])).values())}
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
              items={Array.from(new Map(buyers.map(b => [
                b.id, {
                  label: b.name,
                  description: b.email || '',
                  value: b.id
                }
              ])).values())}
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

      {/* Shipper Dialog - Lazy Loaded */}
      <ShipperDialog
        open={shipperDialogOpen}
        onOpenChange={setShipperDialogOpen}
        mode={shipperDialogMode}
        shipperForm={shipperForm}
        shipperError={shipperError}
        handleShipperFormChange={handleShipperFormChange}
        handleSaveShipper={handleSaveShipper}
      />

      {/* Buyer Dialog - Lazy Loaded */}
      <BuyerDialog
        open={buyerDialogOpen}
        onOpenChange={setBuyerDialogOpen}
        mode={buyerDialogMode}
        buyerForm={buyerForm}
        buyerError={buyerError}
        handleBuyerFormChange={handleBuyerFormChange}
        handleSaveBuyer={handleSaveBuyer}
      />

      {/* Delete Shipper Confirmation - Lazy Loaded */}
      <DeleteEntityDialog
        open={isConfirmDeleteShipperOpen}
        onOpenChange={setIsConfirmDeleteShipperOpen}
        title="Delete Shipper"
        description="This will permanently delete the shipper. This action cannot be undone."
        handleDelete={handleDeleteShipper}
      />

      {/* Delete Buyer Confirmation - Lazy Loaded */}
      <DeleteEntityDialog
        open={isConfirmDeleteBuyerOpen}
        onOpenChange={setIsConfirmDeleteBuyerOpen}
        title="Delete Buyer"
        description="This will permanently delete the buyer. This action cannot be undone."
        handleDelete={handleDeleteBuyer}
      />
    </div>
  )
}