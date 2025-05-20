--'use client'

import { memo } from 'react'
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import SparklineChart from './SparklineChart'

interface MonthlyInvoiceChartProps {
  chartData: Array<{
    name: string;
    [key: string]: number | string;
  }>;
  selectedYear: number;
  selectedYears?: number[];
  compareMode?: boolean;
  availableYears: number[];
  onYearChange: (value: string) => void;
}

const MonthlyInvoiceChart = memo(({
  chartData,
  selectedYear,
  selectedYears = [],
  compareMode = false,
  availableYears,
  onYearChange
}: MonthlyInvoiceChartProps) => {
  // Debug: Kiểm tra dữ liệu biểu đồ
  console.log('MonthlyInvoiceChart - chartData:', chartData);
  console.log('MonthlyInvoiceChart - selectedYear:', selectedYear);
  console.log('MonthlyInvoiceChart - selectedYears:', selectedYears);
  console.log('MonthlyInvoiceChart - compareMode:', compareMode);
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format currency for Y-axis to be more compact and readable
  const formatYAxisCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)} tỷ`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)} tr`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // Format percentage change
  const formatPercentChange = (percentChange: number) => {
    const formattedValue = Math.abs(percentChange).toFixed(1);
    if (percentChange > 0) {
      return `+${formattedValue}%`;
    } else if (percentChange < 0) {
      return `-${formattedValue}%`;
    }
    return `0%`;
  };

  // Calculate percentage change
  const calculatePercentChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Get previous month value for the same year
  const getPreviousMonthValue = (monthIndex: number, year: string) => {
    if (monthIndex <= 1) return 0; // No previous month for January

    const previousMonthData = chartData.find(item =>
      item.name === `T${monthIndex - 1}` && item[`${year} (VND)`] !== undefined
    );

    return previousMonthData ? previousMonthData[`${year} (VND)`] as number : 0;
  };

  // Get trend data for the last 6 months
  const getTrendData = (monthIndex: number, year: string) => {
    const trendData = [];

    // Start from 5 months before the current month (or from month 1 if not enough history)
    const startMonth = Math.max(1, monthIndex - 5);

    for (let i = startMonth; i <= monthIndex; i++) {
      const monthData = chartData.find(item =>
        item.name === `T${i}` && item[`${year} (VND)`] !== undefined
      );

      if (monthData) {
        trendData.push({
          month: i,
          value: monthData[`${year} (VND)`] as number
        });
      }
    }

    return trendData;
  };

  return (
    <Card className="w-full h-full flex flex-col border-0 shadow-none">
      <div className="flex-1 flex flex-col pt-1 px-4">
        <div className="flex-1 flex flex-col">
          {/* Phần hiển thị biểu đồ đường */}
          <div className="flex-1 mt-2" style={{ minHeight: "400px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
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
                  tickFormatter={(value) => formatYAxisCurrency(value)}
                  width={80}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      // Extract month number from label (e.g., "T3" -> 3)
                      const monthNumber = parseInt(label.replace('T', ''));

                      // Get current and previous year values
                      const currentYearValue = payload.find(p => p.dataKey === `${selectedYear} (VND)`)?.value as number || 0;
                      const previousYearValue = payload.find(p => p.dataKey === `${selectedYear - 1} (VND)`)?.value as number || 0;

                      // Get previous month value for current year
                      const previousMonthValue = getPreviousMonthValue(monthNumber, `${selectedYear} (VND)`);

                      // Calculate percentage changes
                      const yearOverYearChange = calculatePercentChange(currentYearValue, previousYearValue);
                      const monthOverMonthChange = calculatePercentChange(currentYearValue, previousMonthValue);

                      // Get trend data for sparkline
                      const trendData = getTrendData(monthNumber, `${selectedYear} (VND)`);

                      return (
                        <div className="bg-white p-3 rounded-md shadow-md border border-gray-200">
                          <p className="text-sm font-semibold mb-2">Tháng {monthNumber} năm {selectedYear}</p>

                          {/* Current year value */}
                          <div className="mb-2">
                            <p className="text-sm font-medium">
                              Doanh thu: {formatCurrency(currentYearValue)}
                            </p>
                          </div>

                          {/* Month-over-month comparison */}
                          {monthNumber > 1 && (
                            <div className="mb-2">
                              <p className="text-sm">
                                <span className="font-medium">So với tháng trước: </span>
                                <span className={monthOverMonthChange > 0 ? 'text-green-600' : monthOverMonthChange < 0 ? 'text-red-600' : ''}>
                                  {formatPercentChange(monthOverMonthChange)}
                                </span>
                              </p>
                            </div>
                          )}

                          {/* Year-over-year comparison */}
                          {previousYearValue > 0 && (
                            <div className="mb-3">
                              <p className="text-sm">
                                <span className="font-medium">So với cùng kỳ năm {selectedYear - 1}: </span>
                                <span className={yearOverYearChange > 0 ? 'text-green-600' : yearOverYearChange < 0 ? 'text-red-600' : ''}>
                                  {formatPercentChange(yearOverYearChange)}
                                </span>
                              </p>
                            </div>
                          )}

                          {/* Sparkline chart showing trend */}
                          {trendData.length > 1 && (
                            <div>
                              <p className="text-xs font-medium mb-1">Xu hướng 6 tháng gần nhất:</p>
                              <div className="w-[200px] h-[50px]">
                                <SparklineChart
                                  data={trendData}
                                  color="#3b82f6"
                                  height={50}
                                  formatValue={formatCurrency}
                                />
                              </div>
                            </div>
                          )}
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
                  formatter={(value) => <span style={{ color: value === `${selectedYear} (VND)` ? '#3b82f6' : '#c7d2e8', fontWeight: 'medium' }}>{value}</span>}
                />
                {/* Luôn render các Bar components, bất kể chế độ nào */}
                {compareMode && selectedYears.length > 0 ? (
                  // Render bars for each selected year in compare mode
                  selectedYears.map((year, index) => {
                    // Generate a color based on index
                    const colors = ['#3b82f6', '#c7d2e8', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
                    const fill = colors[index % colors.length];

                    return (
                      <Bar
                        key={year}
                        dataKey={`${year} (VND)`}
                        name={`${year} (VND)`}
                        fill={fill}
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationBegin={index * 100}
                      />
                    );
                  })
                ) : (
                  // Default mode: show current year and previous year
                  <>
                    <Bar
                      dataKey={`${selectedYear - 1} (VND)`}
                      name={`${selectedYear - 1} (VND)`}
                      fill="#c7d2e8"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1000}
                    />
                    <Bar
                      dataKey={`${selectedYear} (VND)`}
                      name={`${selectedYear} (VND)`}
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationBegin={300}
                    />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  )
})

MonthlyInvoiceChart.displayName = 'MonthlyInvoiceChart'

export default MonthlyInvoiceChart
