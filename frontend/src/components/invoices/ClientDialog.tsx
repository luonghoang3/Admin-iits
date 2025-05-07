"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClientRecord, updateClient, deleteClient } from '@/utils/supabase/client'
import { useToast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface ClientDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (clientId: string, action: 'create' | 'update' | 'delete') => void
  clientId?: string
  clientData?: {
    id: string
    name: string
    trade_name?: string
    address?: string
    email?: string
    phone?: string
    tax_id?: string
  }
  mode: 'create' | 'edit'
}

export default function ClientDialog({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  clientData,
  mode
}: ClientDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    trade_name: '',
    address: '',
    email: '',
    phone: '',
    tax_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Load client data when editing
  useEffect(() => {
    if (mode === 'edit' && clientData) {
      setFormData({
        name: clientData.name || '',
        trade_name: clientData.trade_name || '',
        address: clientData.address || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        tax_id: clientData.tax_id || ''
      })
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        trade_name: '',
        address: '',
        email: '',
        phone: '',
        tax_id: ''
      })
    }
  }, [mode, clientData, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Tên khách hàng là bắt buộc')
        return
      }

      if (mode === 'create') {
        // Create new client
        const { client, error } = await createClientRecord({
          name: formData.name.trim(),
          address: formData.address.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          tax_id: formData.tax_id.trim(),
        })

        if (error) throw new Error(error)
        if (!client) throw new Error('Không thể tạo khách hàng')

        toast({
          title: 'Đã tạo khách hàng',
          description: `Khách hàng ${client.name} đã được tạo thành công.`,
        })

        onSuccess(client.id, 'create')
      } else if (mode === 'edit' && clientId) {
        // Update existing client
        const { client, error } = await updateClient(clientId, {
          name: formData.name.trim(),
          address: formData.address.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          tax_id: formData.tax_id.trim(),
        })

        if (error) throw new Error(error)

        toast({
          title: 'Đã cập nhật khách hàng',
          description: `Khách hàng ${formData.name} đã được cập nhật thành công.`,
        })

        onSuccess(clientId, 'update')
      }

      onClose()
    } catch (err) {
      console.error('Error saving client:', err)
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu khách hàng')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!clientId) return

    try {
      setLoading(true)
      setError(null)

      const { success, error } = await deleteClient(clientId)

      if (error) throw new Error(error)
      if (!success) throw new Error('Không thể xóa khách hàng')

      toast({
        title: 'Đã xóa khách hàng',
        description: `Khách hàng đã được xóa thành công.`,
      })

      onSuccess(clientId, 'delete')
      onClose()
    } catch (err) {
      console.error('Error deleting client:', err)
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa khách hàng')
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
            <DialogTitle>{mode === 'create' ? 'Thêm khách hàng mới' : 'Chỉnh sửa khách hàng'}</DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? 'Nhập thông tin để thêm khách hàng mới' 
                : 'Chỉnh sửa thông tin khách hàng'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên khách hàng <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nhập tên khách hàng"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade_name">Tên giao dịch (tiếng Anh)</Label>
              <Input
                id="trade_name"
                name="trade_name"
                value={formData.trade_name}
                onChange={handleChange}
                placeholder="Nhập tên giao dịch (nếu có)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Nhập địa chỉ"
                rows={2}
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

            <div className="space-y-2">
              <Label htmlFor="tax_id">Mã số thuế</Label>
              <Input
                id="tax_id"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleChange}
                placeholder="Nhập mã số thuế"
              />
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
            <AlertDialogTitle>Xác nhận xóa khách hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khách hàng này? Hành động này không thể hoàn tác.
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
