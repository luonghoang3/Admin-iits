"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createContact, updateContact, deleteContact } from '@/utils/supabase/client'
import { useToast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Contact } from '@/types/clients'

interface ContactDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (contactId: string, action: 'create' | 'update' | 'delete') => void
  clientId: string
  contactId?: string
  contactData?: Contact
  mode: 'create' | 'edit'
}

export default function ContactDialog({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  contactId,
  contactData,
  mode
}: ContactDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    email: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Load contact data when editing
  useEffect(() => {
    if (mode === 'edit' && contactData) {
      setFormData({
        full_name: contactData.full_name || '',
        position: contactData.position || '',
        email: contactData.email || '',
        phone: contactData.phone || ''
      })
    } else {
      // Reset form for create mode
      setFormData({
        full_name: '',
        position: '',
        email: '',
        phone: ''
      })
    }
  }, [mode, contactData, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validate required fields
      if (!formData.full_name.trim()) {
        setError('Tên người liên hệ là bắt buộc')
        return
      }

      if (mode === 'create') {
        // Create new contact
        const { contact, error } = await createContact({
          client_id: clientId,
          full_name: formData.full_name.trim(),
          position: formData.position.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim()
        })

        if (error) throw new Error(error)
        if (!contact) throw new Error('Không thể tạo người liên hệ')

        toast({
          title: 'Đã tạo người liên hệ',
          description: `Người liên hệ ${contact.full_name} đã được tạo thành công.`,
        })

        onSuccess(contact.id, 'create')
      } else if (mode === 'edit' && contactId) {
        // Update existing contact
        const { contact, error } = await updateContact(contactId, {
          full_name: formData.full_name.trim(),
          position: formData.position.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim()
        })

        if (error) throw new Error(error)

        toast({
          title: 'Đã cập nhật người liên hệ',
          description: `Người liên hệ ${formData.full_name} đã được cập nhật thành công.`,
        })

        onSuccess(contactId, 'update')
      }

      onClose()
    } catch (err) {
      console.error('Error saving contact:', err)
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu người liên hệ')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!contactId) return

    try {
      setLoading(true)
      setError(null)

      const { success, error } = await deleteContact(contactId)

      if (error) throw new Error(error)
      if (!success) throw new Error('Không thể xóa người liên hệ')

      toast({
        title: 'Đã xóa người liên hệ',
        description: `Người liên hệ đã được xóa thành công.`,
      })

      onSuccess(contactId, 'delete')
      onClose()
    } catch (err) {
      console.error('Error deleting contact:', err)
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa người liên hệ')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Thêm người liên hệ mới' : 'Chỉnh sửa người liên hệ'}</DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? 'Nhập thông tin để thêm người liên hệ mới' 
                : 'Chỉnh sửa thông tin người liên hệ'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Tên người liên hệ <span className="text-red-500">*</span></Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Nhập tên người liên hệ"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Chức vụ</Label>
              <Input
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="Nhập chức vụ"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            {mode === 'edit' && (
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                Xóa
              </Button>
            )}
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Đang lưu...' : (mode === 'create' ? 'Thêm' : 'Cập nhật')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa người liên hệ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa người liên hệ này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
