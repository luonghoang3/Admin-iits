'use client';

import { memo } from 'react';
import EnhancedMonthlyChart from '@/components/dashboard/EnhancedMonthlyChart';
import EnhancedTeamDonutChart from '@/components/dashboard/EnhancedTeamDonutChart';

interface OrderChartsSectionProps {
  orderChartData: any[];
  stats: any;
  selectedYear: number;
  selectedMonth: string;
  availableYears: number[];
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
}

function OrderChartsSection({
  orderChartData,
  stats,
  selectedYear,
  selectedMonth,
  availableYears,
  onYearChange,
  onMonthChange
}: OrderChartsSectionProps) {
  return (
    <>
      <h2 className="text-xl font-semibold mt-4">Thống kê đơn hàng</h2>
      <div className="flex flex-col md:flex-row gap-5 h-[500px]">
        <div className="w-full md:w-[60%] h-full">
          <EnhancedMonthlyChart
            chartData={orderChartData}
            selectedYear={selectedYear}
            availableYears={availableYears}
            ordersThisYear={stats.ordersThisYear}
            onYearChange={onYearChange}
          />
        </div>
        <div className="w-full md:w-[40%] h-full">
          <EnhancedTeamDonutChart
            teamOrders={stats.teamOrders}
            ordersThisYear={stats.ordersThisYear}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            availableYears={availableYears}
            onYearChange={onYearChange}
            onMonthChange={onMonthChange}
          />
        </div>
      </div>
    </>
  );
}

export default memo(OrderChartsSection);
