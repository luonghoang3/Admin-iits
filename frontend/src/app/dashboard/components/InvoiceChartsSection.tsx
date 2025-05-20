'use client';

import { memo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MonthlyInvoiceChart from '@/components/dashboard/MonthlyInvoiceChart';
import MonthlyInvoiceUSDChart from '@/components/dashboard/MonthlyInvoiceUSDChart';
import ImprovedTeamInvoiceDonutChart from '@/components/dashboard/ImprovedTeamInvoiceDonutChart';
import TeamInvoiceUSDDonutChart from '@/components/dashboard/TeamInvoiceUSDDonutChart';

interface InvoiceChartsSectionProps {
  invoiceChartData: any[];
  stats: any;
  selectedYear: number;
  selectedMonth: string;
  availableYears: number[];
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
}

function InvoiceChartsSection({
  invoiceChartData,
  stats,
  selectedYear,
  selectedMonth,
  availableYears,
  onYearChange,
  onMonthChange
}: InvoiceChartsSectionProps) {
  return (
    <>
      <h2 className="text-xl font-semibold mt-8">Thống kê hóa đơn tài chính</h2>
      <div className="border rounded-lg overflow-hidden">
        <Tabs defaultValue="vnd" className="w-full">
          <div className="flex justify-between items-center border-b">
            <div className="px-4 py-2 flex items-center gap-4">
              <div>
                <h3 className="text-base font-semibold">Doanh thu theo tháng</h3>
                <p className="text-sm text-muted-foreground">Thống kê theo năm</p>
              </div>
              <Select value={selectedYear.toString()} onValueChange={onYearChange}>
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

          <TabsContent value="vnd" className="w-full">
            <div className="flex flex-col md:flex-row gap-5 h-[500px] p-4">
              <div className="w-full md:w-[60%] h-full">
                <MonthlyInvoiceChart
                  chartData={invoiceChartData}
                  selectedYear={selectedYear}
                  availableYears={availableYears}
                  onYearChange={onYearChange}
                />
              </div>
              <div className="w-full md:w-[40%] h-full">
                <ImprovedTeamInvoiceDonutChart
                  teamInvoices={stats.teamInvoices}
                  invoicesThisYear={stats.invoicesThisYear}
                  totalRevenueVND={stats.totalRevenueVND}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  availableYears={availableYears}
                  onYearChange={onYearChange}
                  onMonthChange={onMonthChange}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="usd" className="w-full">
            <div className="flex flex-col md:flex-row gap-5 h-[500px] p-4">
              <div className="w-full md:w-[60%] h-full">
                <MonthlyInvoiceUSDChart
                  chartData={invoiceChartData}
                  selectedYear={selectedYear}
                  availableYears={availableYears}
                  onYearChange={onYearChange}
                />
              </div>
              <div className="w-full md:w-[40%] h-full">
                <TeamInvoiceUSDDonutChart
                  teamInvoices={stats.teamInvoices}
                  invoicesThisYear={stats.invoicesThisYear}
                  totalRevenueUSD={stats.totalRevenueUSD}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  availableYears={availableYears}
                  onYearChange={onYearChange}
                  onMonthChange={onMonthChange}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default memo(InvoiceChartsSection);
