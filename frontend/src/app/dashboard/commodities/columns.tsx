"use client"

import { ColumnDef } from "@tanstack/react-table"
// @ts-ignore - Ignore TypeScript errors for these imports
import ArrowUpDown from "lucide-react/dist/esm/icons/arrow-up-down"
// @ts-ignore
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Badge
} from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Định nghĩa interface cho hàng hóa
export interface Commodity {
  id: string
  name: string
  description: string | null
  category_id: string | null
  category?: {
    id: string
    name: string
  } | null
  created_at: string
  updated_at: string | null
  teams?: { id: string; name: string }[]
}

export const columns: ColumnDef<Commodity>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tên hàng hóa
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "description",
    header: "Mô tả",
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null
      return (
        <div className="max-w-[300px] truncate">
          {description ? description : <span className="text-gray-400 italic">Chưa có mô tả</span>}
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: "Danh mục",
    cell: ({ row }) => {
      const category = row.original.category
      return (
        <div>
          {category ? (
            <Badge variant="secondary" className="px-2 py-1">
              {category.name}
            </Badge>
          ) : (
            <span className="text-gray-400 italic">Không có danh mục</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "teams",
    header: "Teams",
    cell: ({ row }) => {
      const teams = row.original.teams || []
      return (
        <div className="flex flex-wrap gap-1 max-w-[250px]">
          {teams.length > 0 ? (
            teams.map(team => (
              <Badge key={team.id} variant="outline" className="px-2 py-1">
                {team.name}
              </Badge>
            ))
          ) : (
            <span className="text-gray-400 italic">Không có team</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Ngày tạo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return <div>{date.toLocaleDateString("vi-VN")}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const commodity = row.original
 
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
              <Link href={`/dashboard/commodities/edit/${commodity.id}`} className="w-full block">
                Chỉnh sửa
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-action="delete-commodity"
              data-commodity-id={commodity.id}
              className="text-red-600 cursor-pointer"
            >
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 