"use client"

import React, { useState, useEffect } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
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
// Đã gỡ bỏ import DataTableFilters

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onDeleteOrder?: (orderId: string) => void
  pagination?: {
    page: number
    pageCount: number
    onPageChange: (page: number) => void
  }
}

// Đã gỡ bỏ hàm lọc tùy chỉnh

export function DataTable<TData, TValue>({
  columns,
  data,
  onDeleteOrder,
  pagination,
}: DataTableProps<TData, TValue>) {
  // Đã gỡ bỏ state cho bộ lọc

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {},
    initialState: {
      pagination: {
        pageSize: 10,
        pageIndex: pagination ? pagination.page - 1 : 0,
      },
    },
    // Vô hiệu hóa phân trang tích hợp vì chúng ta đang sử dụng phân trang phía server
    manualPagination: !!pagination,
  })

  // Đã gỡ bỏ thiết lập filterFn cho các cột

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
      {/* Đã gỡ bỏ DataTableFilters */}
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
