"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { deleteInvoice } from "@/services/invoiceService"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"

export interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  client_id: string
  financial_invoice_number: string | null
  financial_invoice_date: string | null
  reference: string | null
  vat_percentage: number | null
  vat_amount: number | null
  exchange_rate: number | null
  notes: string | null
  order_id: string | null
  contact_id: string | null
  status: 'draft' | 'issued' | 'paid' | 'cancelled'
  created_at: string
  updated_at: string
  clients: {
    id: string
    name: string
  }
  orders?: {
    id: string
    order_number: string
  } | null
  contacts?: {
    id: string
    full_name: string
  } | null
}

export const createColumns = (
  onDelete: (invoice: Invoice) => void
): ColumnDef<Invoice>[] => [
  {
    accessorKey: "invoice_number",
    header: "Số hóa đơn",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.original.invoice_number}
        </div>
      )
    }
  },
  {
    accessorKey: "clients.name",
    header: "Khách hàng",
    cell: ({ row }) => {
      return (
        <div className="max-w-[200px] truncate">
          {row.original.clients?.name}
        </div>
      )
    }
  },
  {
    accessorKey: "invoice_date",
    header: "Ngày hóa đơn",
    cell: ({ row }) => {
      const date = new Date(row.original.invoice_date)
      return (
        <div>
          {format(date, 'dd/MM/yyyy')}
        </div>
      )
    }
  },
  {
    accessorKey: "orders.order_number",
    header: "Đơn hàng",
    cell: ({ row }) => {
      return (
        <div>
          {row.original.orders?.order_number || "-"}
        </div>
      )
    }
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.original.status

      let badgeVariant: "outline" | "secondary" | "destructive" | "default" = "outline"
      let statusText = "Nháp"

      switch (status) {
        case "draft":
          badgeVariant = "outline"
          statusText = "Nháp"
          break
        case "issued":
          badgeVariant = "secondary"
          statusText = "Đã phát hành"
          break
        case "paid":
          badgeVariant = "default"
          statusText = "Đã thanh toán"
          break
        case "cancelled":
          badgeVariant = "destructive"
          statusText = "Đã hủy"
          break
      }

      return (
        <Badge variant={badgeVariant}>
          {statusText}
        </Badge>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const invoice = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/invoices/${invoice.id}`}>
                Xem chi tiết
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/invoices/edit/${invoice.id}`}>
                Chỉnh sửa
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={invoice.status === 'paid'}
              onClick={() => onDelete(invoice)}
            >
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
