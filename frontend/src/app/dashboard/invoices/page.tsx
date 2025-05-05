'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { fetchInvoices, deleteInvoice } from '@/services/invoiceService'
import { redirect } from 'next/navigation'
import { DataTable } from './data-table'
import { createColumns, Invoice } from './columns'
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusIcon, SearchIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [invoiceNumberSearch, setInvoiceNumberSearch] = useState('')
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const limit = 10

  // Load data when page or search changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // Check authentication
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          setError(authError.message)
          setLoading(false)
          return
        }

        if (!user) {
          redirect('/login')
        }

        // Fetch invoices with pagination and search
        const { invoices: invoicesData, total, error: invoicesError } = await fetchInvoices({
          page,
          limit,
          invoiceNumberSearch
        })

        if (invoicesError) {
          setError(invoicesError)
          setLoading(false)
          return
        }

        setInvoices(invoicesData as Invoice[])
        setTotalRecords(total)
        setTotalPages(Math.ceil(total / limit))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, invoiceNumberSearch])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Reset to first page when searching
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  // Handle delete invoice
  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice)
    setIsDeleteDialogOpen(true)
  }

  // Confirm delete invoice
  const confirmDelete = async () => {
    if (!invoiceToDelete) return

    setIsDeleting(true)
    try {
      await deleteInvoice(invoiceToDelete.id)

      // Show success toast
      toast({
        title: "Hóa đơn đã được xóa",
        description: `Hóa đơn ${invoiceToDelete.invoice_number} đã được xóa thành công.`,
        variant: "default",
      })

      // Refresh data
      const { invoices: invoicesData, total, error: invoicesError } = await fetchInvoices({
        page,
        limit,
        invoiceNumberSearch
      })

      if (invoicesError) {
        setError(invoicesError)
      } else {
        setInvoices(invoicesData as Invoice[])
        setTotalRecords(total)
        setTotalPages(Math.ceil(total / limit))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa hóa đơn')

      // Show error toast
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : 'Lỗi khi xóa hóa đơn',
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setInvoiceToDelete(null)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý hóa đơn</h1>
        <Button asChild>
          <Link href="/dashboard/invoices/add">
            <PlusIcon className="mr-2 h-4 w-4" />
            Tạo hóa đơn mới
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tìm kiếm hóa đơn</CardTitle>
          <CardDescription>Nhập số hóa đơn để tìm kiếm</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Nhập số hóa đơn..."
                value={invoiceNumberSearch}
                onChange={(e) => setInvoiceNumberSearch(e.target.value)}
              />
            </div>
            <Button type="submit">
              <SearchIcon className="mr-2 h-4 w-4" />
              Tìm kiếm
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <DataTable
          columns={createColumns(handleDeleteClick)}
          data={invoices}
          onPaginationChange={handlePageChange}
          pageCount={totalPages}
          currentPage={page}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa hóa đơn</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa hóa đơn {invoiceToDelete?.invoice_number}? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
