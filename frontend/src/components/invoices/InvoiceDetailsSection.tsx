import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InvoiceFormData } from '@/types/invoices'
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface InvoiceDetailsSectionProps {
  formData: InvoiceFormData
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleValueChange: (field: string, value: any) => void
  isEditMode: boolean
  orderDetails?: {
    order_number?: string
    order_date?: string
  }
}

export default function InvoiceDetailsSection({
  formData,
  handleChange,
  handleValueChange,
  isEditMode,
  orderDetails = {}
}: InvoiceDetailsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin hóa đơn</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dòng 1: Số Hóa đơn, Ngày hóa đơn, Trạng thái */}
        <div className="grid grid-cols-3 gap-4">
          {/* Cột 1: Số hóa đơn */}
          <div className="space-y-2">
            <Label htmlFor="invoice_number">Số hóa đơn</Label>
            <Input
              id="invoice_number"
              name="invoice_number"
              value={formData.invoice_number}
              onChange={handleChange}
              placeholder="Số hóa đơn sẽ được tạo tự động"
              disabled={isEditMode}
            />
          </div>

          {/* Cột 2: Ngày hóa đơn */}
          <div className="space-y-2">
            <Label htmlFor="invoice_date">Ngày hóa đơn</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.invoice_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.invoice_date ? (
                    format(new Date(formData.invoice_date), "dd/MM/yyyy")
                  ) : (
                    <span>Chọn ngày</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.invoice_date ? new Date(formData.invoice_date) : undefined}
                  onSelect={(date) => handleValueChange("invoice_date", date ? format(date, "yyyy-MM-dd") : "")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Cột 3: Trạng thái */}
          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleValueChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Nháp</SelectItem>
                <SelectItem value="issued">Đã phát hành</SelectItem>
                <SelectItem value="paid">Đã thanh toán</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dòng 2: Số Order, Ngày order, Tham chiếu */}
        <div className="grid grid-cols-3 gap-4">
          {/* Cột 1: Số Order */}
          <div className="space-y-2">
            <Label htmlFor="order_id">Số Order</Label>
            <Input
              id="order_id"
              name="order_id"
              value={orderDetails.order_number || (formData.order_id ? 'Đang tải...' : 'Không có đơn hàng')}
              onChange={handleChange}
              placeholder="Số Order"
              disabled={true}
            />
          </div>

          {/* Cột 2: Ngày Order (Chỉ hiển thị, không cho phép chỉnh sửa) */}
          <div className="space-y-2">
            <Label htmlFor="order_date">Ngày Order</Label>
            <Input
              id="order_date"
              name="order_date"
              value={orderDetails.order_date
                ? format(new Date(orderDetails.order_date), "dd/MM/yyyy")
                : (formData.order_id ? 'Đang tải...' : 'Không có ngày')}
              placeholder="Ngày Order"
              disabled={true}
            />
          </div>

          {/* Cột 3: Tham chiếu */}
          <div className="space-y-2">
            <Label htmlFor="reference">Tham chiếu</Label>
            <Input
              id="reference"
              name="reference"
              value={formData.reference || ''}
              onChange={handleChange}
              placeholder="Nhập tham chiếu"
            />
          </div>
        </div>

        {/* Dòng 3: Số hóa đơn tài chính, Ngày hóa đơn tài chính, Ghi chú */}
        <div className="grid grid-cols-3 gap-4">
          {/* Cột 1: Số hóa đơn tài chính */}
          <div className="space-y-2">
            <Label htmlFor="financial_invoice_number">Số hóa đơn tài chính</Label>
            <Input
              id="financial_invoice_number"
              name="financial_invoice_number"
              value={formData.financial_invoice_number || ''}
              onChange={handleChange}
              placeholder="Nhập số hóa đơn tài chính"
            />
          </div>

          {/* Cột 2: Ngày hóa đơn tài chính */}
          <div className="space-y-2">
            <Label htmlFor="financial_invoice_date">Ngày hóa đơn tài chính</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.financial_invoice_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.financial_invoice_date ? (
                    format(new Date(formData.financial_invoice_date), "dd/MM/yyyy")
                  ) : (
                    <span>Chọn ngày</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.financial_invoice_date ? new Date(formData.financial_invoice_date) : undefined}
                  onSelect={(date) => handleValueChange("financial_invoice_date", date ? format(date, "yyyy-MM-dd") : null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Cột 3: Ghi chú */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Nhập ghi chú"
              rows={3}
              className="min-h-[38px]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
