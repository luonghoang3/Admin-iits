'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { DashboardStats, StatsData } from '@/types/dashboard'
import logger from '@/lib/logger'

const initialStats: DashboardStats = {
  totalUsers: 0,
  totalClients: 0,
  totalOrders: 0,
  ordersThisYear: 0,
  monthlyOrders: [],
  monthlyOrdersLastYear: [],
  teamOrders: []
}

export function useDashboardStats(selectedYear: number, selectedMonth: string) {
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cachedStats, setCachedStats] = useState<Record<string, DashboardStats>>({})
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        // Tạo key cho cache dựa trên năm và tháng
        const cacheKey = `${selectedYear}-${selectedMonth}`;

        // Kiểm tra xem đã có dữ liệu trong cache chưa
        if (cachedStats[cacheKey]) {
          setStats(cachedStats[cacheKey]);
          return;
        }

        setLoading(true);

        // Sử dụng stored procedure để lấy tất cả dữ liệu thống kê trong một lần gọi
        const { data, error } = await supabase
          .rpc('get_dashboard_stats', {
            year_param: selectedYear,
            month_param: selectedMonth
          });

        if (error) throw error;

        if (!data || data.length === 0) {
          throw new Error('Không có dữ liệu thống kê');
        }

        // Chuyển đổi dữ liệu từ định dạng bảng sang đối tượng
        const statsData: StatsData = {};
        data.forEach((item: { stat_type: string; stat_value: any }) => {
          statsData[item.stat_type as keyof StatsData] = item.stat_value;
        });

        // Xử lý dữ liệu team orders để thêm màu sắc
        const teamColors: Record<string, string> = {
          '26b6ad02-03c0-45ac-9b65-3caeac723829': '#3366cc', // Màu xanh dương cho Agri
          'e7697f59-05cc-434e-b679-fde4c53b7d7c': '#22aa99', // Màu xanh lá cho Marine
          '8189d1d3-531d-4328-a294-08cab9a50fcf': '#ff9900', // Màu cam cho CG
          'unknown': '#9E9E9E' // Màu xám cho không xác định
        };

        // Xử lý dữ liệu team orders
        let teamOrders = statsData.team_orders || [];
        teamOrders = teamOrders.map((team: any) => ({
          team: team.team || 'Không xác định',
          count: team.count || 0,
          percent: Math.round((team.count / (statsData.year_order_count?.count || 1)) * 100),
          color: teamColors[team.team_id] || '#9E9E9E',
          team_id: team.team_id
        })).sort((a: any, b: any) => b.count - a.count);

        // Điều chỉnh phần trăm để tổng luôn bằng 100%
        const totalPercent = teamOrders.reduce((sum: number, team: any) => sum + team.percent, 0);
        if (totalPercent !== 100 && teamOrders.length > 0) {
          const largestTeam = teamOrders[0];
          largestTeam.percent += (100 - totalPercent);
        }

        // Đảm bảo dữ liệu tháng đầy đủ 12 tháng
        const ensureFullMonths = (monthlyData: any[] | null) => {
          if (!monthlyData) return Array(12).fill(0).map((_, i) => ({ month: i + 1, count: 0 }));

          const result = Array(12).fill(0).map((_, i) => {
            const monthData = monthlyData.find((m: any) => m.month === i + 1);
            return { month: i + 1, count: monthData ? monthData.count : 0 };
          });

          return result;
        };

        // Tạo đối tượng stats mới
        const newStats: DashboardStats = {
          totalUsers: statsData.user_count?.count || 0,
          totalClients: statsData.client_count?.count || 0,
          totalOrders: statsData.order_count?.count || 0,
          ordersThisYear: statsData.year_order_count?.count || 0,
          monthlyOrders: ensureFullMonths(statsData.current_year_orders),
          monthlyOrdersLastYear: ensureFullMonths(statsData.previous_year_orders),
          teamOrders
        };

        // Lưu vào cache và cập nhật state
        setCachedStats(prev => ({
          ...prev,
          [cacheKey]: newStats
        }));

        setStats(newStats);

        logger.info('Đã tải dữ liệu thống kê từ stored procedure');
      } catch (error: any) {
        logger.error('Error fetching stats:', error);
        setError(error.message || 'Lỗi khi tải dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [selectedYear, selectedMonth]);

  return { stats, loading, error };
}
