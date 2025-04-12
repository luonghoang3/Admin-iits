'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Combobox as HeadlessuiCombobox } from "@/components/ui/combobox"
import { OrderItem, Commodity, Unit } from '@/types/orders'

interface OrderItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  currentItem: Partial<OrderItem>
  commodities: Commodity[]
  units: Unit[]
  error: string | null
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleSelectChange: (field: string, value: any) => void
  handleSave: () => void
  handleClose: () => void
  commoditySearch: string
  unitSearch: string
  handleCommoditySearch?: (query: string) => void
  handleUnitSearch?: (query: string) => void
  hasMoreCommodities?: boolean
  isLoadingMoreCommodities?: boolean
  loadMoreCommodities?: () => void
  isLoadingCommodities?: boolean
  isLoadingUnits?: boolean
}

console.log('OrderItemDialog component loaded');

export default function OrderItemDialog({
  open,
  onOpenChange,
  isEditing,
  currentItem,
  commodities,
  units,
  error,
  handleChange,
  handleSelectChange,
  handleSave,
  handleClose,
  commoditySearch,
  unitSearch,
  handleCommoditySearch,
  handleUnitSearch,
  hasMoreCommodities,
  isLoadingMoreCommodities,
  loadMoreCommodities,
  isLoadingCommodities,
  isLoadingUnits
}: OrderItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      onOpenChange(isOpen);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Order Item' : 'Add New Order Item'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details of this order item.'
              : 'Add a new item to this order.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="commodity_id">Commodity*</Label>
            <HeadlessuiCombobox
              items={commodities.map(c => ({
                value: c.id,
                label: c.name,
                description: c.description || undefined
              }))}
              value={currentItem.commodity_id || ''}
              onChange={(value) => handleSelectChange('commodity_id', value)}
              placeholder="Select commodity..."
              onSearch={handleCommoditySearch}
              loading={isLoadingCommodities}
              emptyContent={
                <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                  {commoditySearch ? "No commodities found" : "Type to search commodities"}
                </div>
              }
              loadingContent={
                <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                  Loading...
                </div>
              }
              showSelected
              onLoadMore={loadMoreCommodities}
              hasMore={hasMoreCommodities}
              isLoadingMore={isLoadingMoreCommodities}
              selectedItemData={
                currentItem.commodity_id ? {
                  value: currentItem.commodity_id,
                  label: commodities.find(c => c.id === currentItem.commodity_id)?.name || '',
                  description: commodities.find(c => c.id === currentItem.commodity_id)?.description || ''
                } : null
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity*</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              value={currentItem.quantity ?? ''}
              onChange={handleChange}
              min="0.01"
              step="any"
              placeholder="Enter quantity"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="unit_id">Unit*</Label>
            <HeadlessuiCombobox
              items={units.map(u => ({
                value: u.id,
                label: u.name,
                description: u.description || undefined
              }))}
              value={currentItem.unit_id || ''}
              onChange={(value) => handleSelectChange('unit_id', value)}
              placeholder="Select unit..."
              onSearch={handleUnitSearch}
              loading={isLoadingUnits}
              emptyContent={
                <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                  {unitSearch ? "No units found" : "Type to search units"}
                </div>
              }
              loadingContent={
                <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                  Loading...
                </div>
              }
              showSelected
              selectedItemData={
                currentItem.unit_id ? {
                  value: currentItem.unit_id,
                  label: units.find(u => u.id === currentItem.unit_id)?.name || '',
                  description: units.find(u => u.id === currentItem.unit_id)?.description || ''
                } : null
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="commodity_description">Description (Optional)</Label>
            <Textarea
              id="commodity_description"
              name="commodity_description"
              value={currentItem.commodity_description || ''}
              onChange={handleChange}
              placeholder="Enter additional item details"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
