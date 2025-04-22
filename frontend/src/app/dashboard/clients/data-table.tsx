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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Team, Client } from "./columns"
import { Filter } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  teams: Team[]
  onDeleteClient?: (clientId: string) => void
}

// Tùy chỉnh hàm lọc cho teams
const teamsFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  if (!filterValue || (filterValue as Set<string>).size === 0) return true

  const teamNames = row.getValue(columnId) as string[] | undefined
  if (!teamNames || teamNames.length === 0) return false

  const filterSet = filterValue as Set<string>
  return teamNames.some(team => filterSet.has(team))
}

export function DataTable<TData, TValue>({
  columns,
  data,
  teams,
  onDeleteClient,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set())

  // Lấy danh sách các nhóm từ props
  const uniqueTeams = React.useMemo(() => {
    return teams.map(team => team.name);
  }, [teams])

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
    // Tắt tính năng tự động reset trang khi dữ liệu thay đổi
    autoResetPageIndex: false,
    initialState: {
      pagination: {
        pageSize: 10,
      },
      sorting: [
        {
          id: "name",
          desc: false,
        },
      ],
    },
  })

  // Thiết lập filterFn cho cột team_names
  useEffect(() => {
    const teamsColumn = table.getColumn("team_names");
    if (teamsColumn) {
      // @ts-ignore - TypeScript không nhận ra filterFn trong meta
      teamsColumn.columnDef.filterFn = teamsFilterFn;
    }
  }, [table]);

  // Xử lý sự kiện click từ nút xóa client
  const handleDeleteButtonClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const deleteButton = target.closest('[data-action="delete-client"]')

    if (deleteButton && onDeleteClient) {
      const clientId = deleteButton.getAttribute('data-client-id')
      if (clientId) {
        onDeleteClient(clientId)
      }
    }
  }

  // Đăng ký event listener để xử lý sự kiện click từ nút xóa client
  useEffect(() => {
    document.addEventListener('click', handleDeleteButtonClick)
    return () => {
      document.removeEventListener('click', handleDeleteButtonClick)
    }
  }, [onDeleteClient]);

  // Cập nhật bộ lọc mỗi khi selectedTeams thay đổi
  useEffect(() => {
    const teamsColumn = table.getColumn("team_names")
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
                  Không có dữ liệu khách hàng.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            {table.getPageCount() > 0 ? (
              <>Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</>
            ) : (
              <>Trang 0 / 0</>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-500">
          {table.getFilteredRowModel().rows.length > 0 ? (
            <>Hiển thị {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )} / {table.getFilteredRowModel().rows.length} khách hàng</>
          ) : (
            <>Không có khách hàng nào</>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          >
            &laquo;
          </Button>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          >
            &raquo;
          </Button>
        </div>
      </div>
    </div>
  )
}