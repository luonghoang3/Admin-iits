'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Order } from '@/app/dashboard/orders/columns-dashboard'
import logger from '@/lib/logger'

export function useOrdersList(selectedYear: number, selectedMonth: string, currentPage: number) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [cachedOrders, setCachedOrders] = useState<Record<string, Order[]>>({})
  const supabase = createClient()

  useEffect(() => {
    async function fetchOrders() {
      try {
        // Tạo key cho cache dựa trên năm, tháng và trang
        const cacheKey = `${selectedYear}-${selectedMonth}-${currentPage}`;

        // Kiểm tra xem đã có dữ liệu trong cache chưa
        if (cachedOrders[cacheKey]) {
          setOrders(cachedOrders[cacheKey]);
          return;
        }

        setLoading(true);

        // Chuẩn bị truy vấn cơ bản
        let query = supabase
          .from('orders')
          .select(`
            *,
            clients(name),
            teams(name)
          `)
          .order('order_date', { ascending: false })
          .gte('order_date', `${selectedYear}-01-01`)
          .lte('order_date', `${selectedYear}-12-31`);

        // Chuẩn bị truy vấn đếm
        let countQuery = supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .gte('order_date', `${selectedYear}-01-01`)
          .lte('order_date', `${selectedYear}-12-31`);

        // Lọc theo tháng nếu có chọn tháng cụ thể
        if (selectedMonth !== "all") {
          const month = parseInt(selectedMonth);
          const startDate = `${selectedYear}-${month.toString().padStart(2, '0')}-01`;

          // Tính ngày cuối tháng
          let endDate;
          if (month === 12) {
            endDate = `${selectedYear}-12-31`;
          } else {
            const nextMonth = month + 1;
            endDate = `${selectedYear}-${nextMonth.toString().padStart(2, '0')}-01`;
            const date = new Date(endDate);
            date.setDate(date.getDate() - 1);
            endDate = date.toISOString().split('T')[0];
          }

          query = query.gte('order_date', startDate).lte('order_date', endDate);
          countQuery = countQuery.gte('order_date', startDate).lte('order_date', endDate);
        }

        // Thực hiện cả hai truy vấn song song
        const [countResult, dataResult] = await Promise.all([
          countQuery,
          query.range((currentPage - 1) * 10, currentPage * 10 - 1)
        ]);

        if (countResult.error) throw countResult.error;
        if (dataResult.error) throw dataResult.error;

        // Tính tổng số trang
        const totalItems = countResult.count || 0;
        const pageSize = 10;
        setTotalPages(Math.ceil(totalItems / pageSize));

        // Lưu vào cache và cập nhật state
        setCachedOrders(prev => ({
          ...prev,
          [cacheKey]: dataResult.data || []
        }));

        setOrders(dataResult.data || []);

        logger.info(`Đã tải ${dataResult.data?.length || 0} đơn hàng`);
      } catch (error: any) {
        logger.error('Error fetching orders:', error);
        setError(error.message || 'Lỗi khi tải danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [selectedYear, selectedMonth, currentPage]);

  return { orders, loading, error, totalPages };
}
