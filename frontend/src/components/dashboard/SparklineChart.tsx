'use client';

import { memo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface SparklineChartProps {
  data: Array<{
    month: number;
    value: number;
  }>;
  color?: string;
  height?: number;
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
}

const SparklineChart = memo(({
  data,
  color = '#3b82f6',
  height = 40,
  showTooltip = false,
  formatValue
}: SparklineChartProps) => {
  // Ensure data is sorted by month
  const sortedData = [...data].sort((a, b) => a.month - b.month);
  
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          {showTooltip && (
            <Tooltip
              formatter={(value: number) => [
                formatValue ? formatValue(value) : value,
                'Doanh thu'
              ]}
              labelFormatter={(label) => `Tháng ${label}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                padding: '4px 8px',
                fontSize: '0.75rem'
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: color, stroke: 'white', strokeWidth: 1 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

SparklineChart.displayName = 'SparklineChart';

export default SparklineChart;
