'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// @ts-ignore
import UsersIcon from "lucide-react/dist/esm/icons/users"
// @ts-ignore
import Building2 from "lucide-react/dist/esm/icons/building-2"
// @ts-ignore
import Package from "lucide-react/dist/esm/icons/package"
// @ts-ignore
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days"

interface StatsCardsProps {
  totalUsers: number;
  totalClients: number;
  totalOrders: number;
  ordersThisYear: number;
  selectedYear: number;
  selectedMonth: string;
}

const StatsCards = memo(({ 
  totalUsers, 
  totalClients, 
  totalOrders, 
  ordersThisYear, 
  selectedYear, 
  selectedMonth 
}: StatsCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng số người dùng</CardTitle>
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalClients}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng số đơn hàng</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOrders}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Đơn hàng năm {selectedYear}
            {selectedMonth !== "all" && ` - Tháng ${selectedMonth}`}
          </CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{ordersThisYear}</div>
        </CardContent>
      </Card>
    </div>
  )
})

StatsCards.displayName = 'StatsCards'

export default StatsCards
