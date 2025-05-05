'use client'

import { useState, useCallback } from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useOrdersList } from '@/hooks/useOrdersList'
import { useAvailableYears } from '@/hooks/useAvailableYears'
import StatsCards from '@/components/dashboard/StatsCards'
import MonthlyChart from '@/components/dashboard/MonthlyChart'
import OrdersList from '@/components/dashboard/OrdersList'
import TeamDonutChart from '@/components/dashboard/TeamDonutChart'

export default function DashboardClient() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Sử dụng custom hooks
  const { availableYears } = useAvailableYears()
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats(selectedYear, selectedMonth)
  const { orders, loading: ordersLoading, error: ordersError, totalPages } = useOrdersList(selectedYear, selectedMonth, currentPage)

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

  // Tạo dữ liệu biểu đồ
  const chartData = stats.monthlyOrders.map((item, index) => ({
    name: `T${item.month}`,
    [selectedYear.toString()]: item.count,
    [(selectedYear - 1).toString()]: stats.monthlyOrdersLastYear[index]?.count || 0
  }));

  // Hiển thị trạng thái loading
  if ((statsLoading || ordersLoading) && !orders.length) {
    return <div className="flex items-center justify-center h-full">Đang tải dữ liệu...</div>
  }

  // Hiển thị lỗi
  if (statsError || ordersError) {
    return <div className="text-red-500">Lỗi: {statsError || ordersError}</div>
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Thẻ thống kê */}
      <StatsCards
        totalUsers={stats.totalUsers}
        totalClients={stats.totalClients}
        totalOrders={stats.totalOrders}
        ordersThisYear={stats.ordersThisYear}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />

      {/* Hàng chứa biểu đồ và bảng danh sách */}
      <div className="flex flex-col md:flex-row gap-5">
        {/* Biểu đồ thống kê đơn hàng theo tháng */}
        <MonthlyChart
          chartData={chartData}
          selectedYear={selectedYear}
          availableYears={availableYears}
          ordersThisYear={stats.ordersThisYear}
          onYearChange={handleYearChange}
        />

        {/* Biểu đồ tròn thể hiện tỉ lệ đóng góp đơn hàng theo team */}
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

      {/* Hàng thứ hai chứa danh sách đơn hàng */}
      <div className="flex flex-col md:flex-row gap-5">
        {/* Danh sách đơn hàng */}
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
    </div>
  )
}
