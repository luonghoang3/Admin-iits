'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, FileText, Receipt, DollarSign } from "lucide-react"

interface CombinedStatsCardsProps {
  totalUsers: number
  totalClients: number
  totalOrders: number
  ordersThisYear: number
  totalInvoices: number
  invoicesThisYear: number
  totalRevenueVND: number
  totalRevenueUSD: number
  selectedYear: number
  selectedMonth: string
}

export default function CombinedStatsCards({
  totalUsers,
  totalClients,
  totalOrders,
  ordersThisYear,
  totalInvoices,
  invoicesThisYear,
  totalRevenueVND,
  totalRevenueUSD,
  selectedYear,
  selectedMonth
}: CombinedStatsCardsProps) {
  // Format currency
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format number with thousand separator
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  // Determine period text based on selected month
  const getPeriodText = () => {
    if (selectedMonth === "all") {
      return `năm ${selectedYear}`;
    } else {
      const monthNames = [
        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
        "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
      ];
      return `${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {/* Tổng số người dùng */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalUsers)}</div>
          <p className="text-xs text-muted-foreground">Tổng số người dùng</p>
        </CardContent>
      </Card>

      {/* Tổng số khách hàng */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalClients)}</div>
          <p className="text-xs text-muted-foreground">Tổng số khách hàng</p>
        </CardContent>
      </Card>

      {/* Tổng số đơn hàng */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đơn hàng</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalOrders)}</div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(ordersThisYear)} trong {getPeriodText()}
          </p>
        </CardContent>
      </Card>

      {/* Tổng số hóa đơn */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hóa đơn</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalInvoices)}</div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(invoicesThisYear)} trong {getPeriodText()}
          </p>
        </CardContent>
      </Card>

      {/* Doanh thu VND */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Doanh thu VND</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenueVND, 'VND')}</div>
          <p className="text-xs text-muted-foreground">
            Trong {getPeriodText()}
          </p>
        </CardContent>
      </Card>

      {/* Doanh thu USD */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Doanh thu USD</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenueUSD, 'USD')}</div>
          <p className="text-xs text-muted-foreground">
            Trong {getPeriodText()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
