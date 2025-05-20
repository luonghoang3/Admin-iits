'use client'

import { memo } from 'react'
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts'

interface MonthlyChartProps {
  chartData: Array<{
    name: string;
    [key: string]: number | string;
  }>;
  selectedYear: number;
  availableYears: number[];
  ordersThisYear: number;
  onYearChange: (value: string) => void;
}

const MonthlyChart = memo(({
  chartData,
  selectedYear,
  availableYears,
  ordersThisYear,
  onYearChange
}: MonthlyChartProps) => {
  return (
    <Card className="w-full h-full flex flex-col">
      <div className="px-4 pt-3 pb-1 flex flex-row items-center justify-between">
        <h3 className="text-base font-semibold">Thống kê đơn hàng theo tháng</h3>
        <div className="flex items-center">
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
        </div>
      </div>
      <div className="flex-1 flex flex-col pt-1 px-4">
        <div className="flex-1 flex flex-col">
          {/* Phần hiển thị biểu đồ đường */}
          <div className="flex-1 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCurrentYear" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorLastYear" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c7d2e8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#c7d2e8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eee" strokeOpacity={0.5} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  fontSize={12}
                  stroke="#888"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  fontSize={12}
                  stroke="#888"
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-md shadow-md border border-gray-100">
                          <p className="text-sm font-medium mb-2">Tháng {label && typeof label === 'string' ? label.substring(1) : ''}</p>
                          {payload.map((entry, index) => (
                            <div key={index} className="flex items-center mb-1">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm font-medium" style={{ color: entry.color }}>
                                {entry.name}: {entry.value} đơn hàng
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ color: value === selectedYear.toString() ? '#3b82f6' : '#c7d2e8', fontWeight: 'medium' }}>{value}</span>}
                />
                <Line
                  type="monotone"
                  dataKey={(selectedYear - 1).toString()}
                  stroke="#c7d2e8"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={false}
                  name={(selectedYear - 1).toString()}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
                <Area
                  type="monotone"
                  dataKey={selectedYear.toString()}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorCurrentYear)"
                  dot={false}
                  activeDot={false}
                  name={selectedYear.toString()}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationBegin={300}
                  z={10}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-center">
            <div className="text-xs font-medium">
              Tổng số đơn hàng: {ordersThisYear}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
})

MonthlyChart.displayName = 'MonthlyChart'

export default MonthlyChart
