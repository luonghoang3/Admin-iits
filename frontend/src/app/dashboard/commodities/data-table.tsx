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
import { Commodity } from "./columns"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onDeleteCommodity?: (commodityId: string) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onDeleteCommodity,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  // Xử lý sự kiện click từ nút xóa hàng hóa
  const handleDeleteButtonClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const deleteButton = target.closest('[data-action="delete-commodity"]')
    
    if (deleteButton && onDeleteCommodity) {
      const commodityId = deleteButton.getAttribute('data-commodity-id')
      if (commodityId) {
        onDeleteCommodity(commodityId)
      }
    }
  }

  // Đăng ký event listener để xử lý sự kiện click từ nút xóa hàng hóa
  useEffect(() => {
    document.addEventListener('click', handleDeleteButtonClick)
    return () => {
      document.removeEventListener('click', handleDeleteButtonClick)
    }
  }, [onDeleteCommodity]);

  // Xử lý tìm kiếm toàn cục
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalFilter(value);

    // Áp dụng tìm kiếm cho tất cả các cột
    table.getRowModel().rows.forEach(row => {
      const matches = Object.values(row.original as Commodity)
        .some(val => 
          (typeof val === 'string' && val.toLowerCase().includes(value.toLowerCase())) ||
          (val && typeof val === 'object' && 'name' in val && typeof val.name === 'string' && 
           val.name.toLowerCase().includes(value.toLowerCase()))
        );
      
      row.toggleSelected(matches);
    });
  };

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Tìm kiếm hàng hóa..."
          value={globalFilter}
          onChange={onGlobalFilterChange}
          className="max-w-sm"
        />
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Hiển thị {table.getRowModel().rows.length} / {data.length} hàng hóa
        </div>
        <div className="space-x-2">
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
    </div>
  )
} 