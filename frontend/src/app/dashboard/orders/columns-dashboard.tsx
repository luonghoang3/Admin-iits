"use client"

import { ColumnDef } from "@tanstack/react-table"
import {
  EllipsisHorizontalIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Định nghĩa interfaces dựa trên dữ liệu thực từ API
export interface Order {
  id: string
  order_number: string
  client_id: string
  client_name?: string
  clients?: {
    id: string
    name: string
  }
  type: 'international' | 'local'
  team_id: string
  team_name?: string
  teams?: {
    id: string
    name: string
  }
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled'
  order_date: string
  created_at: string
  updated_at: string
  client_ref_code?: string | null
  inspection_date_started?: string | null
  inspection_date_completed?: string | null
  inspection_place?: string | null
  notes?: string | null
}

// Hàm định dạng ngày tháng sang định dạng Việt Nam
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "order_number",
    header: "Mã đơn hàng",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.original.order_number}
        </div>
      )
    },
  },
  {
    accessorKey: "client_name",
    header: "Khách hàng",
    cell: ({ row }) => {
      // Sử dụng clients.name từ dữ liệu join
      const clientName = row.original.clients?.name || row.original.client_name || '-';

      return (
        <div className="font-medium">
          {clientName}
        </div>
      )
    },
  },
  {
    accessorKey: "order_date",
    header: "Ngày đặt hàng",
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {formatDate(row.original.order_date)}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <EllipsisHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/orders/${order.id}`} className="flex items-center">
                <ArrowTopRightOnSquareIcon className="mr-2 h-4 w-4" />
                <span>Chi tiết</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
