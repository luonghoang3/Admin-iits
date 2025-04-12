'use client'

import React, { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { standardizeCompanyName } from "@/utils/formatters/companyNameFormatter"

interface BuyerFormData {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface BuyerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  buyerForm: BuyerFormData
  buyerError: string | null
  handleBuyerFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSaveBuyer: () => void
}

export default function BuyerDialog({
  open,
  onOpenChange,
  mode,
  buyerForm,
  buyerError,
  handleBuyerFormChange,
  handleSaveBuyer
}: BuyerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Buyer' : 'Edit Buyer'}
          </DialogTitle>
          <DialogDescription>
            Enter the details for the buyer.
          </DialogDescription>
        </DialogHeader>
        {buyerError && (
          <Alert variant="destructive">
            <AlertDescription>{buyerError}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="buyer-name">Name*</Label>
            <Input
              id="buyer-name"
              name="name"
              value={buyerForm.name}
              onChange={handleBuyerFormChange}
              placeholder="Enter buyer name"
            />
            {buyerForm.name && buyerForm.name !== standardizeCompanyName(buyerForm.name) && (
              <div className="text-xs text-muted-foreground mt-1">
                Will be saved as: <span className="font-medium">{standardizeCompanyName(buyerForm.name)}</span>
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="buyer-address">Address</Label>
            <Input
              id="buyer-address"
              name="address"
              value={buyerForm.address}
              onChange={handleBuyerFormChange}
              placeholder="Enter address"
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveBuyer}>
            {mode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
