"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
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

// Hàm tạo màu ngẫu nhiên nhưng ổn định cho mỗi team dựa trên tên
function getTeamColor(teamName: string): string {
  // Tạo hash từ tên team
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Danh sách các màu pastel an toàn
  const colors = [
    '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', 
    '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff',
    '#fffffc', '#d8f3dc', '#b7e4c7', '#95d5b2'
  ];
  
  // Lấy màu dựa trên hash
  return colors[Math.abs(hash) % colors.length];
}

// Định nghĩa kiểu dữ liệu cho user profile
export interface UserProfile {
  id: string
  username: string | null
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
  email: string
  team_ids?: string[]
  teams?: string[]
  team_names?: string
}

export const columns: ColumnDef<UserProfile>[] = [
  {
    accessorKey: "username",
    header: "Tài khoản",
    cell: ({ row }) => {
      const profile = row.original
      return (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {profile.username?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium">
              {profile.username || 'Chưa đặt tên'}
            </div>
            <div className="text-sm text-muted-foreground">
              {profile.full_name || '-'}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Vai trò",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge variant={role === 'admin' ? 'destructive' : 'secondary'}>
          {role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
        </Badge>
      )
    },
  },
  {
    accessorKey: "teams",
    header: "Nhóm",
    cell: ({ row }) => {
      const teams = row.original.teams || []
      return (
        <div className="flex flex-wrap gap-1">
          {teams.length > 0 ? (
            teams.map((teamName, index) => (
              <Badge 
                key={index}
                variant="outline"
                style={{ backgroundColor: getTeamColor(teamName), borderColor: 'transparent' }}
                className="text-gray-800"
              >
                {teamName}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">Không có nhóm</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "is_active",
    header: "Trạng thái",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      return (
        <Badge variant={isActive ? 'success' : 'destructive'}>
          {isActive ? 'Hoạt động' : 'Bị khóa'}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => {
      return new Date(row.getValue("created_at") as string).toLocaleDateString('vi-VN')
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const profile = row.original

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
              <Link href={`/dashboard/users/edit/${profile.id}`} className="flex items-center">
                <Edit className="mr-2 h-4 w-4" />
                <span>Chỉnh sửa</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive flex items-center focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault()
                // Xóa người dùng sẽ được xử lý trong component chính
                // Sử dụng data-user-id để truyền ID người dùng cần xóa
                const deleteButton = document.createElement('button')
                deleteButton.setAttribute('data-user-id', profile.id)
                deleteButton.setAttribute('data-action', 'delete-user')
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