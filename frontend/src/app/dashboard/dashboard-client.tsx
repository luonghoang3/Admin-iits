'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useOrdersList } from '@/hooks/useOrdersList';
import { useTopClients } from '@/hooks/useTopClients';
import { useAvailableYears } from '@/hooks/useAvailableYears';
import { useCache } from '@/contexts/CacheContext';

// Import các components con đã tách
import DashboardHeader from './components/DashboardHeader';
import DashboardStats from './components/DashboardStats';
import OrderChartsSection from './components/OrderChartsSection';
import InvoiceChartsSection from './components/InvoiceChartsSection';
import BottomSection from './components/BottomSection';

// Import các components loading và error
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import DashboardError from '@/components/errors/DashboardError';

// Không cần import Accordion components

export default function DashboardClient() {
  // State management
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Setup cache invalidation listeners khi component mount
  useEffect(() => {
    // Import và setup listeners
    import('@/services/cacheInvalidationService').then(({ setupCacheInvalidationListeners }) => {
      setupCacheInvalidationListeners();
    });
  }, []);

  // Sử dụng custom hooks với references để có thể xóa cache
  const { availableYears } = useAvailableYears();
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    clearCache: clearStatsCache
  } = useDashboardStats(selectedYear, selectedMonth);

  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    totalPages,
    clearCache: clearOrdersCache
  } = useOrdersList(selectedYear, selectedMonth, currentPage);

  const {
    topClientsByOrders,
    topClientsByRevenue,
    loading: topClientsLoading,
    error: topClientsError,
    clearCache: clearClientsCache
  } = useTopClients(selectedYear);

  // Tạo các callback functions để tránh tạo lại hàm khi render
  const handleYearChange = useCallback((value: string) => {
    setSelectedYear(parseInt(value));
    setCurrentPage(1); // Reset page khi thay đổi năm
  }, []);

  const handleMonthChange = useCallback((value: string) => {
    setSelectedMonth(value);
    setCurrentPage(1); // Reset page khi thay đổi tháng
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Tạo dữ liệu biểu đồ với useMemo để tránh tính toán lại khi re-render
  const orderChartData = useMemo(() => {
    return stats.monthlyOrders.map((item: any, index: number) => ({
      name: `T${item.month}`,
      [selectedYear.toString()]: item.count,
      [(selectedYear - 1).toString()]: stats.monthlyOrdersLastYear[index]?.count || 0
    }));
  }, [stats.monthlyOrders, stats.monthlyOrdersLastYear, selectedYear]);

  // Tạo dữ liệu biểu đồ hóa đơn
  const invoiceChartData = useMemo(() => {
    return stats.monthlyInvoices.map((item: any, index: number) => ({
      name: `T${item.month}`,
      [`${selectedYear} (VND)`]: item.vnd_amount,
      [`${selectedYear - 1} (VND)`]: stats.monthlyInvoicesLastYear[index]?.vnd_amount || 0
    }));
  }, [stats.monthlyInvoices, stats.monthlyInvoicesLastYear, selectedYear]);

  // Kiểm tra lỗi
  const hasError = statsError || ordersError || topClientsError;
  if (hasError) {
    return <DashboardError error={statsError || ordersError || topClientsError || 'Lỗi không xác định'} />;
  }

  // Hiển thị skeleton loading
  const isLoading = (statsLoading || ordersLoading || topClientsLoading) && !orders.length;
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-5">
      <DashboardHeader
        selectedYear={selectedYear}
        availableYears={availableYears}
        onYearChange={handleYearChange}
        onClearStats={clearStatsCache}
        onClearOrders={clearOrdersCache}
        onClearClients={clearClientsCache}
      />

      <DashboardStats
        stats={stats}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />

      <OrderChartsSection
        orderChartData={orderChartData}
        stats={stats}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        availableYears={availableYears}
        onYearChange={handleYearChange}
        onMonthChange={handleMonthChange}
      />

      <InvoiceChartsSection
        invoiceChartData={invoiceChartData}
        stats={stats}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        availableYears={availableYears}
        onYearChange={handleYearChange}
        onMonthChange={handleMonthChange}
      />

      <BottomSection
        orders={orders}
        topClientsByOrders={topClientsByOrders}
        topClientsByRevenue={topClientsByRevenue}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        currentPage={currentPage}
        totalPages={totalPages}
        availableYears={availableYears}
        onYearChange={handleYearChange}
        onMonthChange={handleMonthChange}
        onPageChange={handlePageChange}
        topClientsLoading={topClientsLoading}
      />

    </div>
  );
}
