"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchInvoiceById } from '@/services/invoiceService'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from 'date-fns'

import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  FileTextIcon,
  BanknoteIcon
} from "lucide-react"

import { Invoice } from '@/types/invoices'

interface InvoiceDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function InvoiceDetailPage({ params: paramsPromise }: InvoiceDetailPageProps) {
  const router = useRouter()

  // Use React.use() to resolve the params promise
  const params = React.use(paramsPromise);
  const invoiceId = params.id;

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoading(true)
        console.log(`Loading invoice with ID: ${invoiceId}`)
        const data = await fetchInvoiceById(invoiceId)
        console.log('Invoice data loaded:', data)
        setInvoice(data)
      } catch (err) {
        console.error('Error loading invoice:', err)
        setError(err instanceof Error ? err.message : 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    loadInvoice()
  }, [invoiceId])

  // Format status for display
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Nháp</Badge>
      case 'issued':
        return <Badge variant="secondary">Đã phát hành</Badge>
      case 'paid':
        return <Badge variant="default">Đã thanh toán</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Link href="/dashboard/invoices" className="mr-4">
              <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
            </Link>
            <h1 className="text-2xl font-bold">Đang tải...</h1>
          </div>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin hóa đơn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] animate-pulse bg-muted rounded-md"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/dashboard/invoices">Quay lại danh sách hóa đơn</Link>
        </Button>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>Không tìm thấy hóa đơn</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/dashboard/invoices">Quay lại danh sách hóa đơn</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href="/dashboard/invoices" className="mr-4">
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold">Chi tiết hóa đơn: {invoice.invoice_number}</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/invoices/edit/${invoice.id}`}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Link>
          </Button>
          {invoice.status !== 'paid' && (
            <Button variant="destructive">
              <TrashIcon className="h-4 w-4 mr-2" />
              Xóa
            </Button>
          )}
          {invoice.status === 'draft' && (
            <Button>
              <FileTextIcon className="h-4 w-4 mr-2" />
              Phát hành
            </Button>
          )}
          {invoice.status === 'issued' && (
            <Button>
              <BanknoteIcon className="h-4 w-4 mr-2" />
              Đánh dấu đã thanh toán
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin hóa đơn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số hóa đơn:</span>
                <span className="font-medium">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày hóa đơn:</span>
                <span>{format(new Date(invoice.invoice_date), 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trạng thái:</span>
                <span>{getStatusBadge(invoice.status)}</span>
              </div>
              {invoice.order_id && invoice.orders && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đơn hàng:</span>
                  <Link href={`/dashboard/orders/${invoice.order_id}`} className="text-blue-600 hover:underline">
                    {invoice.orders.order_number}
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Khách hàng:</span>
                <span className="font-medium">{invoice.clients?.name}</span>
              </div>
              {invoice.clients?.tax_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã số thuế:</span>
                  <span>{invoice.clients.tax_id}</span>
                </div>
              )}
              {invoice.clients?.address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Địa chỉ:</span>
                  <span className="text-right max-w-[200px]">{invoice.clients.address}</span>
                </div>
              )}
              {invoice.contacts && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Người liên hệ:</span>
                  <span>{invoice.contacts.full_name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin tài chính</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoice.financial_invoice_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số hóa đơn tài chính:</span>
                  <span>{invoice.financial_invoice_number}</span>
                </div>
              )}
              {invoice.financial_invoice_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày hóa đơn tài chính:</span>
                  <span>{format(new Date(invoice.financial_invoice_date), 'dd/MM/yyyy')}</span>
                </div>
              )}
              {invoice.reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tham chiếu:</span>
                  <span>{invoice.reference}</span>
                </div>
              )}
              {invoice.vat_percentage !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT %:</span>
                  <span>{invoice.vat_percentage}%</span>
                </div>
              )}
              {invoice.vat_amount !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số tiền VAT:</span>
                  <span>{invoice.vat_amount.toLocaleString()} VND</span>
                </div>
              )}
              {invoice.exchange_rate !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tỷ giá:</span>
                  <span>{invoice.exchange_rate.toLocaleString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {invoice.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ghi chú</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
