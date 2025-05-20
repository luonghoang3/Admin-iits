'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Order } from '@/app/dashboard/orders/columns-dashboard'
import logger from '@/lib/logger'
import {
  createCacheKey,
  getMemoryCache,
  setMemoryCache,
  getPersistentCache,
  setPersistentCache
} from '@/utils/cache-utils'

// Thời gian sống của cache (15 phút)
const ORDERS_CACHE_TTL = 15 * 60 * 1000;

// Singleton Supabase client
const supabaseClient = createClient();

export function useOrdersList(selectedYear: number, selectedMonth: string, currentPage: number) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const memoryCache = useRef<Record<string, any>>({})
  // Không cần tạo Supabase client mới mỗi lần render

  useEffect(() => {
    async function fetchOrders() {
      try {
        // Tạo cache key nhất quán
        const cacheKey = createCacheKey('useOrdersList', {
          year: selectedYear,
          month: selectedMonth,
          page: currentPage
        });

        // Kiểm tra memory cache trước
        const memoryCachedData = getMemoryCache<{
          orders: Order[],
          totalPages: number
        }>(cacheKey, memoryCache.current);

        if (memoryCachedData) {
          setOrders(memoryCachedData.orders);
          setTotalPages(memoryCachedData.totalPages);
          setLoading(false);
          return;
        }

        // Nếu không có trong memory cache, kiểm tra persistent cache
        const persistentCachedData = getPersistentCache<{
          orders: Order[],
          totalPages: number
        }>(cacheKey);

        if (persistentCachedData) {
          // Cập nhật cả memory cache và state
          memoryCache.current = setMemoryCache(
            cacheKey,
            persistentCachedData,
            ORDERS_CACHE_TTL,
            memoryCache.current
          );

          setOrders(persistentCachedData.orders);
          setTotalPages(persistentCachedData.totalPages);
          setLoading(false);
          return;
        }

        setLoading(true);

        // Chuẩn bị truy vấn cơ bản
        let query = supabaseClient
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
        let countQuery = supabaseClient
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

        const ordersData = dataResult.data || [];

        // Tạo đối tượng cache
        const cacheData = {
          orders: ordersData,
          totalPages: Math.ceil(totalItems / pageSize)
        };

        // Lưu vào cả memory cache và persistent cache
        memoryCache.current = setMemoryCache(
          cacheKey,
          cacheData,
          ORDERS_CACHE_TTL,
          memoryCache.current
        );

        // Lưu vào persistent cache để giữ giữa các lần refresh
        setPersistentCache(cacheKey, cacheData, ORDERS_CACHE_TTL);

        setOrders(ordersData);
        setTotalPages(cacheData.totalPages);

        logger.info(`Đã tải và cache ${ordersData.length} đơn hàng cho ${selectedYear}-${selectedMonth}-trang ${currentPage}`);
      } catch (error: any) {
        logger.error('Error fetching orders:', error);
        setError(error.message || 'Lỗi khi tải danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [selectedYear, selectedMonth, currentPage]);

  // Thêm hàm để xóa cache khi cần
  const clearCache = () => {
    memoryCache.current = {};
    logger.info('Đã xóa memory cache cho orders list');
  };

  return { orders, loading, error, totalPages, clearCache };
}
