'use client';

import { memo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CacheManagerDropdown from '@/components/dashboard/CacheManagerDropdown';

interface DashboardHeaderProps {
  selectedYear: number;
  availableYears: number[];
  onYearChange: (value: string) => void;
  onClearStats?: () => void;
  onClearOrders?: () => void;
  onClearClients?: () => void;
}

function DashboardHeader({
  selectedYear,
  availableYears,
  onYearChange,
  onClearStats,
  onClearOrders,
  onClearClients
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="flex items-center gap-2">
        <CacheManagerDropdown
          onClearStats={onClearStats}
          onClearOrders={onClearOrders}
          onClearClients={onClearClients}
        />
        <Select value={selectedYear.toString()} onValueChange={onYearChange}>
          <SelectTrigger className="w-[100px]">
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
  );
}

export default memo(DashboardHeader);
