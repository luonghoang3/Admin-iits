import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusIcon, Trash2Icon, PencilIcon } from "lucide-react"
import { InvoiceDetailFormData, InvoiceFormData } from '@/types/invoices'
import { Unit } from '@/types/units'
import { PricingType } from '@/types/pricing-types'
import { fetchUnits } from '@/services/invoiceService'
import { fetchPricingTypes } from '@/services/pricingTypeService'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

interface InvoiceDetailsItemsSectionProps {
  formData: InvoiceFormData
  handleValueChange: (field: string, value: any) => void
}

export default function InvoiceDetailsItemsSection({
  formData,
  handleValueChange
}: InvoiceDetailsItemsSectionProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [pricingTypes, setPricingTypes] = useState<PricingType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [detailFormData, setDetailFormData] = useState<InvoiceDetailFormData>({
    invoice_id: formData.id || '',
    description: '',
    quantity: 1,
    unit_id: null,
    is_fixed_price: false,
    pricing_type_id: null,
    fixed_price: null,
    unit_price: null,
    currency: 'VND',
    amount: 0
  })

  // Load units and pricing types
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Load units
        const unitsData = await fetchUnits()
        setUnits(unitsData)

        // Load pricing types
        const pricingTypesData = await fetchPricingTypes()
        setPricingTypes(pricingTypesData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Calculate amount when form data changes
  useEffect(() => {
    let calculatedAmount: number | null = null;

    if (detailFormData.is_fixed_price) {
      // For fixed price, just use the fixed price value
      calculatedAmount = detailFormData.fixed_price;
    } else if (!detailFormData.is_fixed_price && detailFormData.unit_price !== null && detailFormData.quantity !== null) {
      // For standard pricing, multiply quantity by unit price
      calculatedAmount = detailFormData.quantity * detailFormData.unit_price;
    }

    setDetailFormData(prev => ({
      ...prev,
      amount: calculatedAmount
    }))
  }, [
    detailFormData.is_fixed_price,
    detailFormData.fixed_price,
    detailFormData.unit_price,
    detailFormData.quantity
  ])

  // Handle form input changes
  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === 'quantity' || name === 'fixed_price' || name === 'unit_price') {
      // Handle numeric inputs
      if (value === '') {
        // Always allow empty values for quantity, fixed_price, and unit_price
        setDetailFormData(prev => ({
          ...prev,
          [name]: null
        }))
      } else {
        // Handle numeric value
        const numValue = parseFloat(value)
        setDetailFormData(prev => ({
          ...prev,
          [name]: isNaN(numValue) ? null : numValue
        }))
      }
    } else {
      setDetailFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // Handle switch for fixed price
  const handleFixedPriceToggle = (checked: boolean) => {
    setDetailFormData(prev => {
      // Find default pricing type ID for the selected option
      const defaultPricingTypeId = checked
        ? pricingTypes.find(pt => pt.code === 'mincharge')?.id
        : pricingTypes.find(pt => pt.code === 'standard')?.id;

      return {
        ...prev,
        is_fixed_price: checked,
        // Update pricing type if needed
        pricing_type_id: checked ? defaultPricingTypeId : null,
        // Allow quantity to be null in both cases
        quantity: prev.quantity,
        // Keep both price fields as they are
        fixed_price: prev.fixed_price,
        unit_price: prev.unit_price
      };
    });
  }

  // Handle pricing type change
  const handlePricingTypeChange = (value: string) => {
    setDetailFormData(prev => ({
      ...prev,
      pricing_type_id: value
    }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: any) => {
    setDetailFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Add or update detail
  const handleSaveDetail = () => {
    // Validate required fields
    if (!detailFormData.description) {
      alert('Vui lòng nhập mô tả')
      return
    }

    // Không bắt buộc nhập giá cố định hoặc đơn giá

    // Get current details or empty array
    const currentDetails = formData.invoice_details || []

    if (editingIndex !== null) {
      // Update existing detail
      const updatedDetails = [...currentDetails]
      updatedDetails[editingIndex] = {
        ...updatedDetails[editingIndex],
        ...detailFormData
      }
      handleValueChange('invoice_details', updatedDetails)
    } else {
      // Add new detail
      handleValueChange('invoice_details', [...currentDetails, detailFormData])
    }

    // Reset form and close dialog
    resetDetailForm()
    setIsDialogOpen(false)
  }

  // Delete detail
  const handleDeleteDetail = (index: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa chi tiết này?')) {
      const currentDetails = formData.invoice_details || []
      const updatedDetails = currentDetails.filter((_, i) => i !== index)
      handleValueChange('invoice_details', updatedDetails)
    }
  }

  // Edit detail
  const handleEditDetail = (index: number) => {
    const detail = formData.invoice_details?.[index]
    if (detail) {
      setDetailFormData(detail)
      setEditingIndex(index)
      setIsDialogOpen(true)
    }
  }

  // Reset detail form
  const resetDetailForm = () => {
    // Find standard pricing type ID
    const standardPricingTypeId = pricingTypes.find(pt => pt.code === 'standard')?.id;

    setDetailFormData({
      invoice_id: formData.id || '',
      description: '',
      quantity: 1, // Default to 1 for standard pricing
      unit_id: null,
      is_fixed_price: false,
      pricing_type_id: null,
      fixed_price: null,
      unit_price: null,
      currency: 'VND',
      amount: null
    })
    setEditingIndex(null)
  }

  // Format currency
  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return '-';

    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      minimumFractionDigits: currency === 'VND' ? 0 : 2,
      maximumFractionDigits: currency === 'VND' ? 0 : 2
    }).format(amount)
  }

  // Calculate total amount
  const calculateTotal = () => {
    if (!formData.invoice_details || formData.invoice_details.length === 0) {
      return 0
    }

    return formData.invoice_details.reduce((total, detail) => {
      // Skip null amounts
      if (detail.amount === null) return total;
      return total + detail.amount;
    }, 0)
  }

  // Get unit name by id
  const getUnitName = (unitId: string | null | undefined) => {
    if (!unitId) return ''
    const unit = units.find(u => u.id === unitId)
    return unit ? unit.name : ''
  }

  // Get pricing type name by id
  const getPricingTypeName = (pricingTypeId: string | null | undefined) => {
    if (!pricingTypeId) return 'Standard'
    const pricingType = pricingTypes.find(pt => pt.id === pricingTypeId)
    return pricingType ? pricingType.name : 'Standard'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Chi tiết hóa đơn</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => {
                resetDetailForm()
                setIsDialogOpen(true)
              }}
            >
              <PlusIcon className="h-4 w-4" />
              Thêm chi tiết
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? 'Chỉnh sửa chi tiết' : 'Thêm chi tiết hóa đơn'}
              </DialogTitle>
              <DialogDescription>
                Nhập thông tin chi tiết hóa đơn
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={detailFormData.description}
                  onChange={handleDetailChange}
                  placeholder="Nhập mô tả chi tiết"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Số lượng</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    value={detailFormData.quantity === null ? '' : detailFormData.quantity}
                    onChange={handleDetailChange}
                    placeholder="Để trống hoặc nhập số lượng"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_id">Đơn vị tính</Label>
                  <Select
                    value={detailFormData.unit_id === null || detailFormData.unit_id === undefined ? 'none' : detailFormData.unit_id}
                    onValueChange={(value) => handleSelectChange('unit_id', value === 'none' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đơn vị tính" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value="none">Không có</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Tiền tệ</Label>
                  <Select
                    value={detailFormData.currency}
                    onValueChange={(value) => handleSelectChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tiền tệ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">VND</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="is_fixed_price"
                  checked={detailFormData.is_fixed_price}
                  onCheckedChange={handleFixedPriceToggle}
                />
                <Label htmlFor="is_fixed_price">Giá cố định</Label>
              </div>

              {detailFormData.is_fixed_price && (
                <div className="space-y-2 mb-4">
                  <Label htmlFor="pricing_type_id">Loại giá</Label>
                  <Select
                    value={detailFormData.pricing_type_id === null || detailFormData.pricing_type_id === undefined ? '' : detailFormData.pricing_type_id}
                    onValueChange={handlePricingTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại giá" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {pricingTypes.map((pricingType) => (
                        <SelectItem key={pricingType.id} value={pricingType.id}>
                          {pricingType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={detailFormData.is_fixed_price ? "fixed_price" : "unit_price"}>
                  {detailFormData.is_fixed_price ? "Giá cố định" : "Đơn giá"}
                </Label>
                <Input
                  id={detailFormData.is_fixed_price ? "fixed_price" : "unit_price"}
                  name={detailFormData.is_fixed_price ? "fixed_price" : "unit_price"}
                  type="number"
                  step="0.01"
                  min="0"
                  value={detailFormData.is_fixed_price
                    ? (detailFormData.fixed_price === null ? '' : detailFormData.fixed_price)
                    : (detailFormData.unit_price === null ? '' : detailFormData.unit_price)}
                  onChange={handleDetailChange}
                  placeholder={detailFormData.is_fixed_price ? "Để trống hoặc nhập giá cố định" : "Để trống hoặc nhập đơn giá"}
                />
              </div>

              <div className="space-y-2">
                <Label>Thành tiền</Label>
                <div className="p-2 border rounded-md bg-muted">
                  {detailFormData.amount === null ? '' : formatCurrency(detailFormData.amount, detailFormData.currency)}
                </div>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
              </DialogClose>
              <Button type="button" onClick={handleSaveDetail}>
                {editingIndex !== null ? 'Cập nhật' : 'Thêm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {formData.invoice_details && formData.invoice_details.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="w-[100px]">Số lượng</TableHead>
                  <TableHead className="w-[100px]">Đơn vị</TableHead>
                  <TableHead className="w-[120px]">Đơn giá</TableHead>
                  <TableHead className="w-[120px]">Thành tiền</TableHead>
                  <TableHead className="w-[100px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.invoice_details.map((detail, index) => (
                  <TableRow key={detail.id || index}>
                    <TableCell className="font-medium">{detail.description}</TableCell>
                    <TableCell>
                      {detail.quantity === null ? '' : detail.quantity}
                    </TableCell>
                    <TableCell>{getUnitName(detail.unit_id)}</TableCell>
                    <TableCell>
                      {detail.is_fixed_price
                        ? (detail.fixed_price === null ? '' : `${getPricingTypeName(detail.pricing_type_id)}: ${formatCurrency(detail.fixed_price, detail.currency)}`)
                        : (detail.unit_price === null ? '' : formatCurrency(detail.unit_price, detail.currency))
                      }
                    </TableCell>
                    <TableCell>{detail.amount === null ? '' : formatCurrency(detail.amount, detail.currency)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditDetail(index)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDetail(index)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex justify-end">
              <div className="w-[200px] space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Tổng cộng:</span>
                  <span className="font-bold">
                    {formatCurrency(calculateTotal(), 'VND')}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có chi tiết hóa đơn. Nhấn "Thêm chi tiết" để bắt đầu.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
