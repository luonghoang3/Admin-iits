'use client';

import { memo } from 'react';
import OrdersList from '@/components/dashboard/OrdersList';
import TopClientsStats from '@/components/dashboard/TopClientsStats';

interface BottomSectionProps {
  orders: any[];
  topClientsByOrders: any[];
  topClientsByRevenue: any[];
  selectedYear: number;
  selectedMonth: string;
  currentPage: number;
  totalPages: number;
  availableYears: number[];
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onPageChange: (page: number) => void;
  topClientsLoading: boolean;
}

function BottomSection({
  orders,
  topClientsByOrders,
  topClientsByRevenue,
  selectedYear,
  selectedMonth,
  currentPage,
  totalPages,
  availableYears,
  onYearChange,
  onMonthChange,
  onPageChange,
  topClientsLoading
}: BottomSectionProps) {
  return (
    <div className="flex flex-col md:flex-row gap-5 mt-8">
      <div className="w-full md:w-[35%] h-auto">
        <OrdersList
          orders={orders}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          currentPage={currentPage}
          totalPages={totalPages}
          onYearChange={onYearChange}
          onMonthChange={onMonthChange}
          onPageChange={onPageChange}
        />
      </div>
      <div className="w-full md:w-[65%] h-auto">
        <TopClientsStats
          topClientsByOrders={topClientsByOrders}
          topClientsByRevenue={topClientsByRevenue}
          selectedYear={selectedYear}
          availableYears={availableYears}
          onYearChange={onYearChange}
          loading={topClientsLoading}
        />
      </div>
    </div>
  );
}

export default memo(BottomSection);
