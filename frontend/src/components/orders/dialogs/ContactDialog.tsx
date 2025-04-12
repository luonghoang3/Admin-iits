'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ContactFormData } from '@/types/clients'

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  contactForm: ContactFormData
  contactError: string | null
  handleContactFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSaveContact: () => void
}

console.log('ContactDialog component loaded');

export default function ContactDialog({
  open,
  onOpenChange,
  mode,
  contactForm,
  contactError,
  handleContactFormChange,
  handleSaveContact
}: ContactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Contact Person' : 'Edit Contact Person'}
          </DialogTitle>
          <DialogDescription>
            Enter the contact person details below.
          </DialogDescription>
        </DialogHeader>
        {contactError && (
          <Alert variant="destructive">
            <AlertDescription>{contactError}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 py-4">
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveContact}>
            {mode === 'add' ? 'Add Contact' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
