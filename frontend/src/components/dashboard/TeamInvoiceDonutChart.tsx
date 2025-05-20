'use client'

import { memo } from 'react'
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TeamInvoice } from '@/types/dashboard'

interface TeamInvoiceDonutChartProps {
  teamInvoices: TeamInvoice[];
  invoicesThisYear: number;
  totalRevenueVND: number;
  selectedYear: number;
  selectedMonth: string;
  availableYears: number[];
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
}

// Custom label component for the pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
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
      <div className="bg-white p-2 border rounded shadow-sm text-xs">
        <p className="font-medium">{data.team}</p>
        <p>Số lượng: {data.count} ({data.percent}%)</p>
        <p>Doanh thu (VND): {formatCurrency(data.vnd_amount, 'VND')}</p>
        <p>Doanh thu (USD): {formatCurrency(data.usd_amount, 'USD')}</p>
      </div>
    );
  }

  return null;
};

const TeamInvoiceDonutChart = memo(({
  teamInvoices,
  invoicesThisYear,
  totalRevenueVND,
  selectedYear,
  selectedMonth,
  availableYears,
  onYearChange,
  onMonthChange
}: TeamInvoiceDonutChartProps) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Tạo danh sách các tháng
  const months = [
    { value: "all", label: "Tất cả" },
    { value: "1", label: "Tháng 1" },
    { value: "2", label: "Tháng 2" },
    { value: "3", label: "Tháng 3" },
    { value: "4", label: "Tháng 4" },
    { value: "5", label: "Tháng 5" },
    { value: "6", label: "Tháng 6" },
    { value: "7", label: "Tháng 7" },
    { value: "8", label: "Tháng 8" },
    { value: "9", label: "Tháng 9" },
    { value: "10", label: "Tháng 10" },
    { value: "11", label: "Tháng 11" },
    { value: "12", label: "Tháng 12" }
  ];

  return (
    <Card className="w-full md:w-[40%] flex flex-col">
      <div className="px-4 pt-3 pb-1 flex flex-row items-center justify-between">
        <h3 className="text-base font-semibold">Doanh thu theo nhóm</h3>
        <div className="flex items-center gap-2">
          <Select value={selectedYear.toString()} onValueChange={onYearChange}>
            <SelectTrigger className="w-[90px] h-7 text-xs">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger className="w-[90px] h-7 text-xs">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-center items-center">
        <div className="relative w-[500px] h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={teamInvoices}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={120}
                innerRadius={60}
                fill="#8884d8"
                dataKey="vnd_amount"
                nameKey="team"
                paddingAngle={3}
                minAngle={15}
              >
                {teamInvoices.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={28}
              >
                {formatCurrency(totalRevenueVND)}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
})

TeamInvoiceDonutChart.displayName = 'TeamInvoiceDonutChart'

export default TeamInvoiceDonutChart
