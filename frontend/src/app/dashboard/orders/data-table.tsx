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
import { Order } from "./columns"
import { Filter } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  departmentOptions: Array<{value: string, label: string}> 
  statusOptions: Array<{value: string, label: string}>
  clientOptions: Array<{value: string, label: string}>
  onDeleteOrder?: (orderId: string) => void
}

// Tùy chỉnh hàm lọc
const filterFn: FilterFn<any> = (row, columnId, filterValue) => {
  if (!filterValue || (filterValue as Set<string>).size === 0) return true
  
  const value = row.getValue(columnId) as string
  if (!value) return false
  
  const filterSet = filterValue as Set<string>
  return filterSet.has(value)
}

export function DataTable<TData, TValue>({
  columns,
  data,
  departmentOptions,
  statusOptions,
  clientOptions,
  onDeleteOrder,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(new Set())
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set())
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  
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
      customFilter: filterFn,
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

  // Thiết lập filterFn cho các cột department, status và client_name
  useEffect(() => {
    const departmentColumn = table.getColumn("department");
    const statusColumn = table.getColumn("status");
    const clientColumn = table.getColumn("client_name");
    
    if (departmentColumn) {
      // @ts-ignore - TypeScript không nhận ra filterFn trong meta
      departmentColumn.columnDef.filterFn = filterFn;
    }
    
    if (statusColumn) {
      // @ts-ignore - TypeScript không nhận ra filterFn trong meta
      statusColumn.columnDef.filterFn = filterFn;
    }
    
    if (clientColumn) {
      // @ts-ignore - TypeScript không nhận ra filterFn trong meta
      clientColumn.columnDef.filterFn = filterFn;
    }
  }, [table]);

  // Xử lý sự kiện click từ nút xóa order
  const handleDeleteButtonClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const deleteButton = target.closest('[data-action="delete-order"]')
    
    if (deleteButton && onDeleteOrder) {
      const orderId = deleteButton.getAttribute('data-order-id')
      if (orderId) {
        onDeleteOrder(orderId)
      }
    }
  }

  // Đăng ký event listener để xử lý sự kiện click từ nút xóa order
  useEffect(() => {
    document.addEventListener('click', handleDeleteButtonClick)
    return () => {
      document.removeEventListener('click', handleDeleteButtonClick)
    }
  }, [onDeleteOrder]);

  // Cập nhật bộ lọc departments
  useEffect(() => {
    const departmentColumn = table.getColumn("department")
    if (departmentColumn) {
      if (selectedDepartments.size === 0) {
        departmentColumn.setFilterValue(undefined)
      } else {
        departmentColumn.setFilterValue(selectedDepartments)
      }
    }
  }, [selectedDepartments, table]);

  // Cập nhật bộ lọc statuses
  useEffect(() => {
    const statusColumn = table.getColumn("status")
    if (statusColumn) {
      if (selectedStatuses.size === 0) {
        statusColumn.setFilterValue(undefined)
      } else {
        statusColumn.setFilterValue(selectedStatuses)
      }
    }
  }, [selectedStatuses, table]);
  
  // Cập nhật bộ lọc khách hàng
  useEffect(() => {
    const clientColumn = table.getColumn("client_name")
    if (clientColumn) {
      if (selectedClients.size === 0) {
        clientColumn.setFilterValue(undefined)
      } else {
        clientColumn.setFilterValue(selectedClients)
      }
    }
  }, [selectedClients, table]);

  // Toggle department filter
  function toggleDepartmentFilter(department: string) {
    setSelectedDepartments(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(department)) {
        newSelected.delete(department)
      } else {
        newSelected.add(department)
      }
      return newSelected
    })
  }

  // Toggle status filter
  function toggleStatusFilter(status: string) {
    setSelectedStatuses(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(status)) {
        newSelected.delete(status)
      } else {
        newSelected.add(status)
      }
      return newSelected
    })
  }
  
  // Toggle client filter
  function toggleClientFilter(client: string) {
    setSelectedClients(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(client)) {
        newSelected.delete(client)
      } else {
        newSelected.add(client)
      }
      return newSelected
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between py-4 overflow-x-auto">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Input
            placeholder="Tìm kiếm theo mã đơn hàng..."
            value={(table.getColumn("order_number")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("order_number")?.setFilterValue(event.target.value)
            }
            className="w-60"
          />
          
          {/* Lọc theo khách hàng */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>
                  Khách hàng {selectedClients.size > 0 && `(${selectedClients.size})`}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
              {clientOptions.length === 0 ? (
                <div className="px-2 py-1.5 text-sm">Không có dữ liệu</div>
              ) : (
                clientOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={selectedClients.has(option.value)}
                    onCheckedChange={() => toggleClientFilter(option.value)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))
              )}
              {selectedClients.size > 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-muted-foreground mt-2"
                  onClick={() => setSelectedClients(new Set())}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Lọc theo phòng ban */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>
                  Phòng ban {selectedDepartments.size > 0 && `(${selectedDepartments.size})`}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {departmentOptions.length === 0 ? (
                <div className="px-2 py-1.5 text-sm">Không có dữ liệu</div>
              ) : (
                departmentOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={selectedDepartments.has(option.value)}
                    onCheckedChange={() => toggleDepartmentFilter(option.value)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))
              )}
              {selectedDepartments.size > 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-muted-foreground mt-2"
                  onClick={() => setSelectedDepartments(new Set())}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Lọc theo trạng thái */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>
                  Trạng thái {selectedStatuses.size > 0 && `(${selectedStatuses.size})`}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statusOptions.length === 0 ? (
                <div className="px-2 py-1.5 text-sm">Không có dữ liệu</div>
              ) : (
                statusOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={selectedStatuses.has(option.value)}
                    onCheckedChange={() => toggleStatusFilter(option.value)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))
              )}
              {selectedStatuses.size > 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-muted-foreground mt-2"
                  onClick={() => setSelectedStatuses(new Set())}
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
                  Không có dữ liệu đơn hàng.
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