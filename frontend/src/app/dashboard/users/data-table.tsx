"use client"

import React, { useState, useEffect } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  FilterFn,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserProfile } from "./columns"
import { Check, Filter } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onDeleteUser?: (userId: string) => void
}

// Tùy chỉnh hàm lọc cho teams
const teamsFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  if (!filterValue || (filterValue as Set<string>).size === 0) return true
  
  const teams = row.getValue(columnId) as string[] | undefined
  if (!teams || teams.length === 0) return false
  
  const filterSet = filterValue as Set<string>
  return teams.some(team => filterSet.has(team))
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onDeleteUser,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set())
  
  // Lấy danh sách các nhóm duy nhất từ dữ liệu
  const uniqueTeams = React.useMemo(() => {
    const teams = new Set<string>()
    
    // Giả định TData có thể là UserProfile
    const profiles = data as unknown as UserProfile[]
    
    profiles.forEach(profile => {
      if (profile.teams && profile.teams.length > 0) {
        profile.teams.forEach(team => teams.add(team))
      }
    })
    
    return Array.from(teams)
  }, [data])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: {
      teamsFilter: teamsFilterFn,
    },
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  // Tìm column teams và thêm filterFn
  useEffect(() => {
    const teamsColumn = table.getColumn("teams");
    if (teamsColumn) {
      // @ts-ignore - TypeScript không nhận ra filterFn trong meta
      teamsColumn.columnDef.filterFn = teamsFilterFn;
    }
  }, [table]);

  // Xử lý sự kiện click từ nút xóa người dùng
  const handleDeleteButtonClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const deleteButton = target.closest('[data-action="delete-user"]')
    
    if (deleteButton && onDeleteUser) {
      const userId = deleteButton.getAttribute('data-user-id')
      if (userId) {
        onDeleteUser(userId)
      }
    }
  }

  // Đăng ký event listener để xử lý sự kiện click từ nút xóa người dùng
  useEffect(() => {
    document.addEventListener('click', handleDeleteButtonClick)
    return () => {
      document.removeEventListener('click', handleDeleteButtonClick)
    }
  }, [onDeleteUser]);

  // Filter for roles
  function onRoleFilterChange(value: string) {
    if (value === "all") {
      table.getColumn("role")?.setFilterValue(undefined)
    } else {
      table.getColumn("role")?.setFilterValue(value)
    }
  }

  // Filter for status
  function onStatusFilterChange(value: string) {
    if (value === "all") {
      table.getColumn("is_active")?.setFilterValue(undefined)
    } else {
      table.getColumn("is_active")?.setFilterValue(value === "active")
    }
  }

  // Cập nhật bộ lọc mỗi khi selectedTeams thay đổi
  useEffect(() => {
    const teamsColumn = table.getColumn("teams")
    if (teamsColumn) {
      if (selectedTeams.size === 0) {
        teamsColumn.setFilterValue(undefined)
      } else {
        teamsColumn.setFilterValue(selectedTeams)
      }
    }
  }, [selectedTeams, table]);

  // Filter for teams
  function toggleTeamFilter(team: string) {
    setSelectedTeams(prev => {
      const newSelectedTeams = new Set(prev)
      
      if (newSelectedTeams.has(team)) {
        newSelectedTeams.delete(team)
      } else {
        newSelectedTeams.add(team)
      }
      
      return newSelectedTeams
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm theo email..."
            value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("email")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          
          {/* Bộ lọc vai trò */}
          <Select
            onValueChange={onRoleFilterChange}
            defaultValue="all"
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="admin">Quản trị viên</SelectItem>
              <SelectItem value="user">Người dùng</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Bộ lọc trạng thái */}
          <Select 
            onValueChange={onStatusFilterChange}
            defaultValue="all"
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Bị khóa</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Bộ lọc nhóm */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Lọc nhóm {selectedTeams.size > 0 && `(${selectedTeams.size})`}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {uniqueTeams.length === 0 ? (
                <div className="px-2 py-1.5 text-sm">Không có nhóm nào</div>
              ) : (
                uniqueTeams.map((team) => (
                  <DropdownMenuCheckboxItem
                    key={team}
                    checked={selectedTeams.has(team)}
                    onCheckedChange={() => toggleTeamFilter(team)}
                  >
                    {team}
                  </DropdownMenuCheckboxItem>
                ))
              )}
              {selectedTeams.size > 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-muted-foreground mt-2"
                  onClick={() => setSelectedTeams(new Set())}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Không có dữ liệu người dùng.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Sau
        </Button>
      </div>
    </div>
  )
} 