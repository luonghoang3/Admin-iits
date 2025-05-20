'use client'

import { memo } from 'react'
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart, Cell } from 'recharts'

interface MonthlyInvoiceUSDChartProps {
  chartData: Array<{
    name: string;
    [key: string]: number | string;
  }>;
  selectedYear: number;
  availableYears: number[];
  onYearChange: (value: string) => void;
}

const MonthlyInvoiceUSDChart = memo(({
  chartData,
  selectedYear,
  availableYears,
  onYearChange
}: MonthlyInvoiceUSDChartProps) => {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Tạo dữ liệu biểu đồ USD từ dữ liệu VND
  const usdChartData = chartData.map(item => {
    const usdData: any = { name: item.name };

    // Chuyển đổi các key từ VND sang USD
    Object.keys(item).forEach(key => {
      if (key !== 'name' && typeof item[key] === 'number') {
        // Thay thế "(VND)" bằng "(USD)" trong key
        const newKey = key.replace('(VND)', '(USD)');
        usdData[newKey] = item[key];
      }
    });

    return usdData;
  });

  return (
    <Card className="w-full h-full flex flex-col border-0 shadow-none">
      <div className="flex-1 flex flex-col pt-1 px-4">
        <div className="flex-1 flex flex-col">
          {/* Phần hiển thị biểu đồ đường */}
          <div className="flex-1 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={usdChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                barSize={20}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#888' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#888' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(value), 'Doanh thu']}
                  labelFormatter={(label) => `Tháng ${label.replace('T', '')}`}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ color: value === `${selectedYear} (USD)` ? '#3b82f6' : '#c7d2e8', fontWeight: 'medium' }}>{value}</span>}
                />
                <Bar
                  dataKey={`${selectedYear - 1} (USD)`}
                  name={`${selectedYear - 1} (USD)`}
                  fill="#c7d2e8"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
                <Bar
                  dataKey={`${selectedYear} (USD)`}
                  name={`${selectedYear} (USD)`}
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationBegin={300}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  )
})

MonthlyInvoiceUSDChart.displayName = 'MonthlyInvoiceUSDChart'

export default MonthlyInvoiceUSDChart
