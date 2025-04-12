'use client'

import React, { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { standardizeCompanyName } from "@/utils/formatters/companyNameFormatter"

interface ShipperFormData {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface ShipperDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  shipperForm: ShipperFormData
  shipperError: string | null
  handleShipperFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSaveShipper: () => void
}

export default function ShipperDialog({
  open,
  onOpenChange,
  mode,
  shipperForm,
  shipperError,
  handleShipperFormChange,
  handleSaveShipper
}: ShipperDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Shipper' : 'Edit Shipper'}
          </DialogTitle>
          <DialogDescription>
            Enter the details for the shipper.
          </DialogDescription>
        </DialogHeader>
        {shipperError && (
          <Alert variant="destructive">
            <AlertDescription>{shipperError}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="shipper-name">Name*</Label>
            <Input
              id="shipper-name"
              name="name"
              value={shipperForm.name}
              onChange={handleShipperFormChange}
              placeholder="Enter shipper name"
            />
            {shipperForm.name && shipperForm.name !== standardizeCompanyName(shipperForm.name) && (
              <div className="text-xs text-muted-foreground mt-1">
                Will be saved as: <span className="font-medium">{standardizeCompanyName(shipperForm.name)}</span>
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="shipper-address">Address</Label>
            <Input
              id="shipper-address"
              name="address"
              value={shipperForm.address}
              onChange={handleShipperFormChange}
              placeholder="Enter address"
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveShipper}>
            {mode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
