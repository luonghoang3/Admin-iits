'use client'

import { memo } from 'react'
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import SparklineChart from './SparklineChart'

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

  // Format currency for Y-axis to be more compact and readable
  const formatYAxisCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
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

  // Get previous month value for the same year
  const getPreviousMonthValue = (monthIndex: number, year: string) => {
    if (monthIndex <= 1) return 0; // No previous month for January

    const previousMonthData = usdChartData.find(item =>
      item.name === `T${monthIndex - 1}` && item[`${year}`] !== undefined
    );

    return previousMonthData ? previousMonthData[`${year}`] as number : 0;
  };

  // Get trend data for the last 6 months
  const getTrendData = (monthIndex: number, year: string) => {
    const trendData = [];

    // Start from 5 months before the current month (or from month 1 if not enough history)
    const startMonth = Math.max(1, monthIndex - 5);

    for (let i = startMonth; i <= monthIndex; i++) {
      const monthData = usdChartData.find(item =>
        item.name === `T${i}` && item[`${year}`] !== undefined
      );

      if (monthData) {
        trendData.push({
          month: i,
          value: monthData[`${year}`] as number
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
          <div className="flex-1 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={usdChartData}
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
                      const currentYearValue = payload.find(p => p.dataKey === `${selectedYear} (USD)`)?.value as number || 0;
                      const previousYearValue = payload.find(p => p.dataKey === `${selectedYear - 1} (USD)`)?.value as number || 0;

                      // Get previous month value for current year
                      const previousMonthValue = getPreviousMonthValue(monthNumber, `${selectedYear} (USD)`);

                      // Calculate percentage changes
                      const yearOverYearChange = calculatePercentChange(currentYearValue, previousYearValue);
                      const monthOverMonthChange = calculatePercentChange(currentYearValue, previousMonthValue);

                      // Get trend data for sparkline
                      const trendData = getTrendData(monthNumber, `${selectedYear} (USD)`);

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
