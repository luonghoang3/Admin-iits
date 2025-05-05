"use client"

import { ColumnDef } from "@tanstack/react-table"
// Import các biểu tượng từ heroicons thay vì lucide-react
import {
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

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

// Map màu và nhãn cho Team
const teamColorMap: Record<string, { color: string }> = {
  'Marine': { color: "bg-blue-100 text-blue-800 border-blue-200" },
  'Agri': { color: "bg-green-100 text-green-800 border-green-200" },
  'CG': { color: "bg-purple-100 text-purple-800 border-purple-200" },
}

// Map màu và nhãn cho Status
const statusColorMap: Record<string, { color: string, label: string }> = {
  draft: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "Dự thảo" },
  confirmed: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Đã xác nhận" },
  completed: { color: "bg-green-100 text-green-800 border-green-200", label: "Hoàn thành" },
  cancelled: { color: "bg-red-100 text-red-800 border-red-200", label: "Đã hủy" },
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

// Đã gỡ bỏ hàm formatOrderType không sử dụng

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
    accessorKey: "team_name",
    header: "Team",
    cell: ({ row }) => {
      // Sử dụng teams.name từ dữ liệu join
      const teamName = row.original.teams?.name || row.original.team_name || 'Unknown';
      const { color } = teamColorMap[teamName] ||
        { color: "bg-gray-100 text-gray-800 border-gray-200" };

      return (
        <div>
          <Badge
            variant="outline"
            className={`${color}`}
          >
            <UserGroupIcon className="h-3 w-3 mr-1 inline" />
            {teamName}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.original.status;
      const { color, label } = statusColorMap[status] ||
        { color: "bg-gray-100 text-gray-800 border-gray-200", label: status };

      return (
        <Badge
          variant="outline"
          className={`${color}`}
        >
          {label}
        </Badge>
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
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/orders/edit/${order.id}`} className="flex items-center">
                <PencilIcon className="mr-2 h-4 w-4" />
                <span>Chỉnh sửa</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive flex items-center focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault()
                // Delete order will be handled in the main component
                const deleteButton = document.createElement('button')
                deleteButton.setAttribute('data-order-id', order.id)
                deleteButton.setAttribute('data-action', 'delete-order')
                deleteButton.style.display = 'none'
                document.body.appendChild(deleteButton)
                deleteButton.click()
                document.body.removeChild(deleteButton)
              }}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              <span>Xóa</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]