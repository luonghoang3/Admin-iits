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

export interface Contact {
  id: string
  client_id: string
  full_name: string
  position: string | null
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  address: string | null
  email: string | null
  phone: string | null
  tax_id: string | null
  team_ids?: string[]
  team_names?: string[]
  created_at: string
  updated_at: string
  contacts: Contact[]
  trade_name?: string | null
  name_without_accent?: string | null
  trade_name_without_accent?: string | null
}

export interface Team {
  id: string
  name: string
  description: string | null
}

// Function to generate a consistent color for each team based on name
function getTeamColor(teamName: string): string {
  // Create hash from name
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }

  // List of safe pastel colors
  const colors = [
    '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf',
    '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff',
    '#fffffc', '#d8f3dc', '#b7e4c7', '#95d5b2'
  ];

  // Get color based on hash
  return colors[Math.abs(hash) % colors.length];
}

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Tên công ty",
    cell: ({ row }) => {
      const client = row.original
      return (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {client.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium">
              {client.name}
            </div>
            <div className="text-sm text-muted-foreground">
              {client.address || '-'}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "trade_name",
    header: "Tên thương mại",
    cell: ({ row }) => {
      const client = row.original
      return (
        <div>
          <div className="font-medium">
            {client.trade_name || '-'}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "team_names",
    header: "Nhóm",
    cell: ({ row }) => {
      const teams = row.original.team_names || []
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
    accessorKey: "contacts",
    header: "Người liên hệ",
    cell: ({ row }) => {
      const contacts = row.original.contacts || []
      return (
        <div>
          {contacts.length > 0 ? (
            <div className="space-y-1">
              {contacts.slice(0, 2).map((contact) => (
                <div key={contact.id} className="text-sm">
                  <div className="font-medium">{contact.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {contact.position || ''} {contact.email ? `• ${contact.email}` : ''}
                  </div>
                </div>
              ))}
              {contacts.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{contacts.length - 2} người khác
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Không có người liên hệ</span>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original

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
              <Link href={`/dashboard/clients/${client.id}`} className="flex items-center">
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>Chi tiết</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/clients/edit/${client.id}`} className="flex items-center">
                <Edit className="mr-2 h-4 w-4" />
                <span>Chỉnh sửa</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive flex items-center focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault()
                // Delete client will be handled in the main component
                const deleteButton = document.createElement('button')
                deleteButton.setAttribute('data-client-id', client.id)
                deleteButton.setAttribute('data-action', 'delete-client')
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