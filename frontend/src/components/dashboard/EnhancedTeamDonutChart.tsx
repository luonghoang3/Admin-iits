'use client';

import { memo, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface TeamOrder {
  team: string;
  count: number;
  percent: number;
  color: string;
}

interface TeamDonutChartProps {
  teamOrders: TeamOrder[];
  ordersThisYear: number;
  selectedYear: number;
  selectedMonth: string;
  availableYears: number[];
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
}

function EnhancedTeamDonutChart({
  teamOrders,
  ordersThisYear,
  selectedYear,
  selectedMonth,
  availableYears,
  onYearChange,
  onMonthChange
}: TeamDonutChartProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Sử dụng useMemo để tránh tính toán lại khi re-render
  const renderCustomizedLabel = useMemo(() => {
    return ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
      if (cx === undefined || cy === undefined || midAngle === undefined ||
          outerRadius === undefined || percent === undefined || index === undefined ||
          !teamOrders[index]) {
        return null;
      }

      const percentValue = percent > 1 ? percent : percent * 100;
      const RADIAN = Math.PI / 180;

      // Xử lý tất cả các phần tử một cách đồng nhất
      // Sử dụng bán kính cố định cho tất cả các nhãn
      const labelRadius = outerRadius * 1.2;

      // Xác định góc tính bằng radian
      const angle = -midAngle * RADIAN;

      // Tính toán vị trí cuối cùng
      const labelX = cx + labelRadius * Math.cos(angle);
      const labelY = cy + labelRadius * Math.sin(angle);

      // Trên mobile, ẩn nhãn cho các phần nhỏ
      if (isMobile && percentValue < 5) return null;

      return (
        <text
          x={labelX}
          y={labelY}
          fill={teamOrders[index].color}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontWeight="bold"
        >
          {`${Math.round(percentValue)}%`}
        </text>
      );
    };
  }, [teamOrders, isMobile]);

  const CustomTooltip = useMemo(() => {
    return ({ active, payload }: any) => {
      if (active && payload && payload.length && payload[0] && payload[0].payload) {
        const data = payload[0].payload;
        return (
          <div className="bg-white p-3 rounded-md shadow-md border border-gray-200">
            <p className="text-sm font-semibold mb-1">{data.team || 'Không xác định'}</p>
            <p className="text-sm">
              <span className="font-medium">{data.count || 0}</span> đơn hàng ({data.percent > 1 ? Math.round(data.percent) : Math.round(data.percent * 100)}%)
            </p>
          </div>
        );
      }
      return null;
    };
  }, []);

  return (
    <Card className="w-full h-full flex flex-col">
      <div className="px-4 pt-3 pb-1 flex flex-row items-center justify-between">
        <h3 className="text-base font-semibold">
          Tỉ lệ đóng góp đơn hàng theo team {selectedYear}
          {selectedMonth !== "all" && ` - Tháng ${selectedMonth}`}
        </h3>
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
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {Array.from({ length: 12 }, (_, index) => {
                const month = index + 1;
                const monthName = new Date(2000, index).toLocaleString('vi', { month: 'long' });
                return (
                  <SelectItem key={month} value={month.toString()}>{monthName}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 flex flex-col pt-1 px-4">
        {/* Danh sách chi tiết - phía trên */}
        <div className="flex justify-center items-center py-2">
          <div className="flex flex-row flex-wrap justify-center gap-x-8 gap-y-2">
            {teamOrders.map((team, index) => (
              <div key={index} className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: team.color }}></div>
                <span className="text-sm font-medium mr-1">{team.team}</span>
                <span className="text-lg font-bold mr-1" style={{ color: team.color }}>{team.count}</span>
                <span className="text-xs font-medium text-muted-foreground">({team.percent > 1 ? Math.round(team.percent) : Math.round(team.percent * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Biểu đồ tròn - ở giữa */}
        <div className="flex justify-center items-center flex-1">
          <div className="relative w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={teamOrders}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={isMobile ? 100 : 140}
                  innerRadius={isMobile ? 50 : 70}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="team"
                  paddingAngle={3}
                  minAngle={15}
                >
                  {teamOrders.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={CustomTooltip} />
                {/* Bỏ Legend để tránh chồng chéo */}
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={32}
                  fontWeight="bold"
                >
                  {ordersThisYear}
                </text>
                <text
                  x="50%"
                  y="58%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={16}
                  fill="#666"
                >
                  đơn hàng
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default memo(EnhancedTeamDonutChart);
