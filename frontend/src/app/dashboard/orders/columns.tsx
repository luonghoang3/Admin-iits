"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Trash2, ExternalLink } from "lucide-react"
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
  type: 'international' | 'local' 
  department: 'marine' | 'agri' | 'consumer_goods'
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled'
  order_date: string
  created_at: string
  updated_at: string
  client_ref_code?: string | null
  notes?: string | null
}

// Map màu và nhãn cho Department
const departmentColorMap: Record<string, { color: string, label: string }> = {
  marine: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Marine (MR)" },
  agri: { color: "bg-green-100 text-green-800 border-green-200", label: "Agriculture (AG)" },
  consumer_goods: { color: "bg-purple-100 text-purple-800 border-purple-200", label: "Consumer Goods (CG)" },
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

// Hàm định dạng kiểu đơn hàng
function formatOrderType(type: string): string {
  return type === 'international' ? 'International (I)' : 'Local (L)';
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
      return (
        <div className="font-medium">
          {row.original.client_name || '-'}
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
    accessorKey: "department",
    header: "Phòng ban",
    cell: ({ row }) => {
      const department = row.original.department;
      const { color, label } = departmentColorMap[department] || 
        { color: "bg-gray-100 text-gray-800 border-gray-200", label: department };
      
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
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/orders/${order.id}`} className="flex items-center">
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>Chi tiết</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/orders/edit/${order.id}`} className="flex items-center">
                <Edit className="mr-2 h-4 w-4" />
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
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Xóa</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 