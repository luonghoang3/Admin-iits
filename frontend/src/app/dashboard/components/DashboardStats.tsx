'use client';

import { memo } from 'react';
import CombinedStatsCards from '@/components/dashboard/CombinedStatsCards';

interface DashboardStatsProps {
  stats: any;
  selectedYear: number;
  selectedMonth: string;
}

function DashboardStats({ stats, selectedYear, selectedMonth }: DashboardStatsProps) {
  return (
    <>
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
    </>
  );
}

export default memo(DashboardStats);
