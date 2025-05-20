'use client'

import { useState, useCallback } from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useOrdersList } from '@/hooks/useOrdersList'
import { useTopClients } from '@/hooks/useTopClients'
import { useAvailableYears } from '@/hooks/useAvailableYears'
import MonthlyChart from '@/components/dashboard/MonthlyChart'
import OrdersList from '@/components/dashboard/OrdersList'
import TeamDonutChart from '@/components/dashboard/TeamDonutChart'
import MonthlyInvoiceChart from '@/components/dashboard/MonthlyInvoiceChart'
import MonthlyInvoiceUSDChart from '@/components/dashboard/MonthlyInvoiceUSDChart'
import ImprovedTeamInvoiceDonutChart from '@/components/dashboard/ImprovedTeamInvoiceDonutChart'
import TeamInvoiceUSDDonutChart from '@/components/dashboard/TeamInvoiceUSDDonutChart'
import TopClientsStats from '@/components/dashboard/TopClientsStats'
import CombinedStatsCards from '@/components/dashboard/CombinedStatsCards'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DashboardClient() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Sử dụng custom hooks
  const { availableYears } = useAvailableYears()
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats(selectedYear, selectedMonth)
  const { orders, loading: ordersLoading, error: ordersError, totalPages } = useOrdersList(selectedYear, selectedMonth, currentPage)
  const { topClientsByOrders, topClientsByRevenue, loading: topClientsLoading, error: topClientsError } = useTopClients(selectedYear)

  // Tạo các callback functions để tránh tạo lại hàm khi render
  const handleYearChange = useCallback((value: string) => {
    setSelectedYear(parseInt(value));
  }, []);

  const handleMonthChange = useCallback((value: string) => {
    setSelectedMonth(value);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Tạo dữ liệu biểu đồ đơn hàng
  const orderChartData = stats.monthlyOrders.map((item, index) => ({
    name: `T${item.month}`,
    [selectedYear.toString()]: item.count,
    [(selectedYear - 1).toString()]: stats.monthlyOrdersLastYear[index]?.count || 0
  }));

  // Tạo dữ liệu biểu đồ hóa đơn
  const invoiceChartData = stats.monthlyInvoices.map((item, index) => ({
    name: `T${item.month}`,
    [`${selectedYear} (VND)`]: item.vnd_amount,
    [`${selectedYear - 1} (VND)`]: stats.monthlyInvoicesLastYear[index]?.vnd_amount || 0
  }));

  // Hiển thị trạng thái loading
  if ((statsLoading || ordersLoading || topClientsLoading) && !orders.length) {
    return <div className="flex items-center justify-center h-full">Đang tải dữ liệu...</div>
  }

  // Hiển thị lỗi
  if (statsError || ordersError || topClientsError) {
    return <div className="text-red-500">Lỗi: {statsError || ordersError || topClientsError}</div>
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Thẻ thống kê tổng hợp */}
      <h2 className="text-xl font-semibold mt-2">Thống kê tổng quan</h2>
      <CombinedStatsCards
        totalUsers={stats.totalUsers}
        totalClients={stats.totalClients}
        totalOrders={stats.totalOrders}
        ordersThisYear={stats.ordersThisYear}
        totalInvoices={stats.totalInvoices}
        invoicesThisYear={stats.invoicesThisYear}
        totalRevenueVND={stats.totalRevenueVND}
        totalRevenueUSD={stats.totalRevenueUSD}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />

      {/* Hàng chứa biểu đồ đơn hàng */}
      <h2 className="text-xl font-semibold mt-4">Thống kê đơn hàng</h2>
      <div className="flex flex-col md:flex-row gap-5 h-[500px]">
        {/* Biểu đồ thống kê đơn hàng theo tháng */}
        <div className="w-full md:w-[60%] h-full">
          <MonthlyChart
            chartData={orderChartData}
            selectedYear={selectedYear}
            availableYears={availableYears}
            ordersThisYear={stats.ordersThisYear}
            onYearChange={handleYearChange}
          />
        </div>

        {/* Biểu đồ tròn thể hiện tỉ lệ đóng góp đơn hàng theo team */}
        <div className="w-full md:w-[40%] h-full">
          <TeamDonutChart
            teamOrders={stats.teamOrders}
            ordersThisYear={stats.ordersThisYear}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            availableYears={availableYears}
            onYearChange={handleYearChange}
            onMonthChange={handleMonthChange}
          />
        </div>
      </div>

      {/* Thẻ thống kê hóa đơn */}
      <h2 className="text-xl font-semibold mt-8">Thống kê hóa đơn tài chính</h2>

      {/* Tabs cho thống kê hóa đơn tài chính */}
      <div className="border rounded-lg overflow-hidden">
        <Tabs defaultValue="vnd" className="w-full">
          <div className="flex justify-between items-center border-b">
            <div className="px-4 py-2 flex items-center gap-4">
              <div>
                <h3 className="text-base font-semibold">Doanh thu theo tháng</h3>
                <p className="text-sm text-muted-foreground">Thống kê theo năm</p>
              </div>
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[90px] h-8">
                  <SelectValue placeholder="Năm" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex">
              <TabsList className="flex border-l bg-transparent h-auto">
                <TabsTrigger value="vnd" className="flex-col items-center justify-center px-6 py-3 border-r data-[state=active]:bg-muted rounded-none h-auto">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-medium">VND</span>
                    <span className="text-2xl font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(stats.totalRevenueVND)}</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="usd" className="flex-col items-center justify-center px-6 py-3 data-[state=active]:bg-muted rounded-none h-auto">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-medium">USD</span>
                    <span className="text-2xl font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.totalRevenueUSD)}</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

        {/* Tab doanh thu VND */}
        <TabsContent value="vnd" className="w-full">
          <div className="flex flex-col md:flex-row gap-5 h-[500px] p-4">
            {/* Biểu đồ thống kê hóa đơn VND theo tháng */}
            <div className="w-full md:w-[60%] h-full">
              <MonthlyInvoiceChart
                chartData={invoiceChartData}
                selectedYear={selectedYear}
                availableYears={availableYears}
                onYearChange={handleYearChange}
              />
            </div>

            {/* Biểu đồ tròn thể hiện tỉ lệ doanh thu VND theo team */}
            <div className="w-full md:w-[40%] h-full">
              <ImprovedTeamInvoiceDonutChart
                teamInvoices={stats.teamInvoices}
                invoicesThisYear={stats.invoicesThisYear}
                totalRevenueVND={stats.totalRevenueVND}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                availableYears={availableYears}
                onYearChange={handleYearChange}
                onMonthChange={handleMonthChange}
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab doanh thu USD */}
        <TabsContent value="usd" className="w-full">
          <div className="flex flex-col md:flex-row gap-5 h-[500px] p-4">
            {/* Biểu đồ thống kê hóa đơn USD theo tháng */}
            <div className="w-full md:w-[60%] h-full">
              <MonthlyInvoiceUSDChart
                chartData={invoiceChartData}
                selectedYear={selectedYear}
                availableYears={availableYears}
                onYearChange={handleYearChange}
              />
            </div>

            {/* Biểu đồ tròn thể hiện tỉ lệ doanh thu USD theo team */}
            <div className="w-full md:w-[40%] h-full">
              <TeamInvoiceUSDDonutChart
                teamInvoices={stats.teamInvoices}
                invoicesThisYear={stats.invoicesThisYear}
                totalRevenueUSD={stats.totalRevenueUSD}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                availableYears={availableYears}
                onYearChange={handleYearChange}
                onMonthChange={handleMonthChange}
              />
            </div>
          </div>
        </TabsContent>
        </Tabs>
      </div>

      {/* Hàng chứa danh sách đơn hàng và thống kê top khách hàng */}
      <div className="flex flex-col md:flex-row gap-5 mt-8">
        {/* Danh sách đơn hàng */}
        <div className="w-full md:w-[35%] h-auto">
          <OrdersList
            orders={orders}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            currentPage={currentPage}
            totalPages={totalPages}
            onYearChange={handleYearChange}
            onMonthChange={handleMonthChange}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Thống kê top khách hàng */}
        <div className="w-full md:w-[65%] h-auto">
          <TopClientsStats
            topClientsByOrders={topClientsByOrders}
            topClientsByRevenue={topClientsByRevenue}
            selectedYear={selectedYear}
            availableYears={availableYears}
            onYearChange={handleYearChange}
            loading={topClientsLoading}
          />
        </div>
      </div>
    </div>
  )
}
