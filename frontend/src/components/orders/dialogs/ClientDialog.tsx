'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ClientFormData } from '@/types/clients'

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  clientForm: ClientFormData
  clientError: string | null
  handleClientFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSaveClient: () => void
}

console.log('ClientDialog component loaded');

export default function ClientDialog({
  open,
  onOpenChange,
  mode,
  clientForm,
  clientError,
  handleClientFormChange,
  handleSaveClient
}: ClientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Client' : 'Edit Client'}
          </DialogTitle>
          <DialogDescription>
            Enter the client details below.
          </DialogDescription>
        </DialogHeader>
        {clientError && (
          <Alert variant="destructive">
            <AlertDescription>{clientError}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="client-name">Name*</Label>
            <Input
              id="client-name"
              name="name"
              value={clientForm.name}
              onChange={handleClientFormChange}
              placeholder="Enter client name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-address">Address</Label>
            <Input
              id="client-address"
              name="address"
              value={clientForm.address}
              onChange={handleClientFormChange}
              placeholder="Enter address"
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
              placeholder="client@example.com"
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveClient}>
            {mode === 'add' ? 'Add Client' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
