'use client'

import { memo } from 'react'
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TeamInvoice } from '@/types/dashboard'

interface ImprovedTeamInvoiceDonutChartProps {
  teamInvoices: TeamInvoice[];
  invoicesThisYear: number;
  totalRevenueVND: number;
  selectedYear: number;
  selectedMonth: string;
  availableYears: number[];
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
}

const ImprovedTeamInvoiceDonutChart = memo(({
  teamInvoices,
  invoicesThisYear,
  totalRevenueVND,
  selectedYear,
  selectedMonth,
  availableYears,
  onYearChange,
  onMonthChange
}: ImprovedTeamInvoiceDonutChartProps) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercent = (percent: number) => {
    return `${Math.round(percent)}%`;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-semibold text-sm mb-1">{data.team}</p>
          <p className="text-sm mb-1">
            <span className="font-medium">Doanh thu:</span> {formatCurrency(data.vnd_amount)}
          </p>
          <p className="text-sm mb-1">
            <span className="font-medium">Số hóa đơn:</span> {data.count}
          </p>
          <p className="text-sm">
            <span className="font-medium">Tỉ lệ:</span> {formatPercent(data.percent)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend component - hiển thị theo kiểu ngang như trong hình mẫu
  const CustomLegend = () => (
    <div className="flex justify-center items-center mt-4 mb-2">
      <div className="flex flex-row flex-wrap justify-center gap-x-8 gap-y-2">
        {teamInvoices.map((entry, index) => (
          <div key={index} className="flex items-center">
            <div
              className="w-4 h-4 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium">{entry.team}</span>
            <span className="text-sm ml-1 text-gray-600">({formatPercent(entry.percent)})</span>
          </div>
        ))}
      </div>
    </div>
  );

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

  // Định dạng tiêu đề dựa trên tháng được chọn
  const getChartTitle = () => {
    if (selectedMonth === "all") {
      return `Doanh thu theo nhóm ${selectedYear}`;
    } else {
      const monthName = months.find(m => m.value === selectedMonth)?.label || `Tháng ${selectedMonth}`;
      return `Doanh thu theo nhóm ${monthName} ${selectedYear}`;
    }
  };

  // Format số tiền hiển thị ở giữa biểu đồ
  const formatCenterAmount = (amount: number) => {
    // Nếu số tiền lớn hơn 1 tỷ, hiển thị theo tỷ
    if (amount >= 1000000000) {
      // Làm tròn đến 1 chữ số thập phân và loại bỏ .0 nếu là số nguyên
      const billions = amount / 1000000000;
      const formatted = billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1);
      return `${formatted} tỷ`;
    }
    // Nếu số tiền lớn hơn 1 triệu, hiển thị theo triệu
    else if (amount >= 1000000) {
      // Làm tròn đến 1 chữ số thập phân và loại bỏ .0 nếu là số nguyên
      const millions = amount / 1000000;
      const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
      return `${formatted} tr`;
    }
    // Nếu số tiền nhỏ hơn 1 triệu, hiển thị theo nghìn
    else if (amount >= 1000) {
      const thousands = amount / 1000;
      const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1);
      return `${formatted} K`;
    }
    return formatCurrency(amount);
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <div className="px-4 pt-3 pb-1 flex flex-row items-center justify-between">
        <h3 className="text-base font-semibold">{getChartTitle()}</h3>
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

      {/* Hiển thị chú thích */}
      <CustomLegend />

      {/* Biểu đồ tròn */}
      <div className="flex justify-center items-center flex-1">
        <div className="relative w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={teamInvoices}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={140}
                innerRadius={70}
                fill="#8884d8"
                dataKey="vnd_amount"
                nameKey="team"
                paddingAngle={4}
                minAngle={15}
              >
                {teamInvoices.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />

              {/* Hiển thị tổng doanh thu ở giữa - đã căn chỉnh hoàn hảo */}
              <g>
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={32}
                  fontWeight="bold"
                  dy="-12"
                >
                  {formatCenterAmount(totalRevenueVND)}
                </text>
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={16}
                  fill="#666"
                  dy="16"
                >
                  VND
                </text>
              </g>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
})

ImprovedTeamInvoiceDonutChart.displayName = 'ImprovedTeamInvoiceDonutChart'

export default ImprovedTeamInvoiceDonutChart
