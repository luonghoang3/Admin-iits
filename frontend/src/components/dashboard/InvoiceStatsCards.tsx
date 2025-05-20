'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// @ts-ignore
import FileText from "lucide-react/dist/esm/icons/file-text"
// @ts-ignore
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign"
// @ts-ignore
import CreditCard from "lucide-react/dist/esm/icons/credit-card"
// @ts-ignore
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days"

interface InvoiceStatsCardsProps {
  totalInvoices: number;
  invoicesThisYear: number;
  totalRevenueVND: number;
  totalRevenueUSD: number;
  selectedYear: number;
  selectedMonth: string;
}

const InvoiceStatsCards = memo(({ 
  totalInvoices, 
  invoicesThisYear, 
  totalRevenueVND, 
  totalRevenueUSD, 
  selectedYear, 
  selectedMonth 
}: InvoiceStatsCardsProps) => {
  // Format currency
  const formatCurrency = (amount: number, currency: 'VND' | 'USD') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'VND' ? 0 : 2,
      maximumFractionDigits: currency === 'VND' ? 0 : 2
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng số hóa đơn</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInvoices}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Hóa đơn năm {selectedYear}
            {selectedMonth !== "all" && ` - Tháng ${selectedMonth}`}
          </CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{invoicesThisYear}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Doanh thu (VND)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenueVND, 'VND')}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Doanh thu (USD)</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenueUSD, 'USD')}</div>
        </CardContent>
      </Card>
    </div>
  )
})

InvoiceStatsCards.displayName = 'InvoiceStatsCards'

export default InvoiceStatsCards
