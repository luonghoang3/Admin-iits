'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Combobox as HeadlessuiCombobox } from "@/components/ui/combobox"
import CommodityCombobox from "../CommodityCombobox"
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
  onAddNewCommodity?: () => Promise<string | undefined>
}

// Hàm debounce để trì hoãn cập nhật state
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function OrderItemDialog({
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
  isLoadingUnits,
  onAddNewCommodity
}: OrderItemDialogProps) {
  // State cục bộ cho trường mô tả để tránh re-render toàn bộ component
  const [localDescription, setLocalDescription] = useState(currentItem.commodity_description || '');

  // Cập nhật localDescription khi currentItem thay đổi
  useEffect(() => {
    setLocalDescription(currentItem.commodity_description || '');
  }, [currentItem.commodity_description]);

  // Debounce giá trị mô tả để giảm số lần cập nhật
  const debouncedDescription = useDebounce(localDescription, 300);

  // Cập nhật giá trị thực khi debounced value thay đổi
  useEffect(() => {
    if (debouncedDescription !== currentItem.commodity_description) {
      const event = {
        target: {
          name: 'commodity_description',
          value: debouncedDescription
        }
      } as React.ChangeEvent<HTMLTextAreaElement>;

      handleChange(event);
    }
  }, [debouncedDescription, currentItem.commodity_description, handleChange]);

  // Xử lý thay đổi mô tả cục bộ
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalDescription(e.target.value);
  }, []);

  // Xử lý thay đổi commodity
  const handleCommodityChangeCallback = useCallback((value: string) => {
    handleSelectChange('commodity_id', value);
  }, [handleSelectChange]);

  // Xử lý thêm mới commodity
  const handleAddNewCommodity = useCallback(async () => {
    if (onAddNewCommodity) {
      try {
        // Gọi hàm thêm mới và lấy ID của hàng hóa mới
        const newCommodityId = await onAddNewCommodity();

        // Nếu có ID, tự động chọn hàng hóa mới
        if (newCommodityId) {
          handleSelectChange('commodity_id', newCommodityId);
        }

        return newCommodityId;
      } catch (error) {
        console.error('Error adding new commodity:', error);
      }
    }
  }, [onAddNewCommodity, handleSelectChange]);

  // Xử lý thay đổi unit
  const handleUnitChangeCallback = useCallback((value: string) => {
    handleSelectChange('unit_id', value);
  }, [handleSelectChange]);

  // Xử lý thay đổi quantity
  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
  }, [handleChange]);

  // Xử lý đóng dialog
  const handleDialogClose = useCallback((isOpen: boolean) => {
    if (!isOpen) handleClose();
    onOpenChange(isOpen);
  }, [handleClose, onOpenChange]);

  // Xử lý lưu
  const handleSaveCallback = useCallback(() => {
    handleSave();
  }, [handleSave]);

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
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
            <CommodityCombobox
              commodities={commodities}
              value={currentItem.commodity_id || ''}
              onChange={handleCommodityChangeCallback}
              placeholder="Select commodity..."
              disabled={isLoadingCommodities}
              onSearch={handleCommoditySearch}
              loading={isLoadingCommodities}
              onAddNew={handleAddNewCommodity}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity*</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              value={currentItem.quantity ?? ''}
              onChange={handleQuantityChange}
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
              onChange={handleUnitChangeCallback}
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
              value={localDescription}
              onChange={handleDescriptionChange}
              placeholder="Enter additional item details"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveCallback}>
            {isEditing ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Sử dụng React.memo để tránh re-render không cần thiết
export default React.memo(OrderItemDialog);
