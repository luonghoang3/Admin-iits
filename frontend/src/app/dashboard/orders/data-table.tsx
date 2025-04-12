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
  pagination?: {
    page: number
    pageCount: number
    onPageChange: (page: number) => void
  }
}

// Tùy chỉnh hàm lọc
const filterFn: FilterFn<any> = (row, columnId, filterValue) => {
  if (!filterValue || (filterValue as Set<string>).size === 0) return true
  
  const value = row.getValue(columnId)
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
  pagination,
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
        pageIndex: pagination ? pagination.page - 1 : 0,
      },
    },
    // Vô hiệu hóa phân trang tích hợp vì chúng ta đang sử dụng phân trang phía server
    manualPagination: !!pagination,
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

  return (
    <div>
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
      
      {/* Hiển thị phân trang nếu có */}
      {pagination && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Trang {pagination.page} / {Math.max(1, pagination.pageCount)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pageCount}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
