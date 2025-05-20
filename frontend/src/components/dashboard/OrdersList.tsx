'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
// @ts-ignore
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"
// @ts-ignore
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
// @ts-ignore
import Eye from "lucide-react/dist/esm/icons/eye"
// @ts-ignore
import Edit from "lucide-react/dist/esm/icons/edit-2"
// @ts-ignore
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal"
import { Order } from '@/app/dashboard/orders/columns-dashboard'

interface OrdersListProps {
  orders: Order[];
  selectedYear: number;
  selectedMonth: string;
  currentPage: number;
  totalPages: number;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onPageChange: (page: number) => void;
}

const OrdersList = memo(({
  orders,
  selectedYear,
  selectedMonth,
  currentPage,
  totalPages,
  onYearChange,
  onMonthChange,
  onPageChange
}: OrdersListProps) => {
  const router = useRouter()

  return (
    <Card className="w-full flex flex-col">
      <div className="px-4 pt-3 pb-1 flex flex-row items-center justify-between">
        <h3 className="text-base font-semibold">Đơn hàng năm {selectedYear}</h3>
        <div className="flex items-center">
          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger className="w-[90px] h-7 text-xs">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {Array.from({ length: 12 }, (_, index) => {
                const month = index + 1;
                const monthName = new Date(2000, index).toLocaleString('vi', { month: 'long' });
                return (
                  <SelectItem key={month} value={month.toString()}>{monthName}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col flex-1 pt-1">
        {/* Phần bảng danh sách đơn hàng */}
        <div className="flex-1">
          <table className="w-full border-collapse">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="text-left py-1 px-2 text-xs font-medium text-muted-foreground w-[15%]">Order No.</th>
                <th className="text-left py-1 px-2 text-xs font-medium text-muted-foreground w-[50%]">Khách hàng</th>
                <th className="text-right py-1 pr-4 text-xs font-medium text-muted-foreground w-[25%]">Ngày đặt hàng</th>
                <th className="w-[10%]"></th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/30">
                    <td className="py-1 px-2 text-xs whitespace-nowrap">{order.order_number}</td>
                    <td className="py-1 px-2 text-xs max-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{order.clients?.name}</td>
                    <td className="py-1 px-2 text-xs whitespace-nowrap text-right pr-4">{new Date(order.order_date).toLocaleDateString('vi-VN')}</td>
                    <td className="py-1 px-1 text-xs text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Xem chi tiết</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/orders/edit/${order.id}`)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Chỉnh sửa</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-muted-foreground">
                    Không có đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Phần phân trang */}
        <div className="p-2 border-t">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-full"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Trang đầu</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="11 17 6 12 11 7"></polyline>
                  <polyline points="18 17 13 12 18 7"></polyline>
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-full"
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Trang trước</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs font-medium">
                Trang {currentPage} / {Math.max(totalPages, 1)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-full"
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Trang sau</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-full"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Trang cuối</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 18 12 13 7"></polyline>
                  <polyline points="6 17 11 12 6 7"></polyline>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
})

OrdersList.displayName = 'OrdersList'

export default OrdersList
