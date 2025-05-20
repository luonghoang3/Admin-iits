'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import logger from '@/lib/logger'
import {
  createCacheKey,
  getMemoryCache,
  setMemoryCache,
  getPersistentCache,
  setPersistentCache
} from '@/utils/cache-utils'

// Thời gian sống của cache (1 giờ vì dữ liệu thay đổi ít)
const TOP_CLIENTS_CACHE_TTL = 60 * 60 * 1000;

// Singleton Supabase client
const supabaseClient = createClient();

export interface TopClientByOrders {
  client_id: string
  client_name: string
  order_count: number
}

export interface TopClientByRevenue {
  client_id: string
  client_name: string
  total_revenue_vnd: number
  total_revenue_usd: number
  currency?: string
}

export function useTopClients(selectedYear: number, limit: number = 10) {
  const [topClientsByOrders, setTopClientsByOrders] = useState<TopClientByOrders[]>([])
  const [topClientsByRevenue, setTopClientsByRevenue] = useState<TopClientByRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const memoryCache = useRef<Record<string, any>>({})

  useEffect(() => {
    async function fetchTopClients() {
      try {
        // Tạo cache key nhất quán
        const cacheKey = createCacheKey('useTopClients', {
          year: selectedYear,
          limit: limit
        });

        // Kiểm tra memory cache trước
        const memoryCachedData = getMemoryCache<{
          topClientsByOrders: TopClientByOrders[],
          topClientsByRevenue: TopClientByRevenue[]
        }>(cacheKey, memoryCache.current);

        if (memoryCachedData) {
          setTopClientsByOrders(memoryCachedData.topClientsByOrders);
          setTopClientsByRevenue(memoryCachedData.topClientsByRevenue);
          setLoading(false);
          return;
        }

        // Nếu không có trong memory cache, kiểm tra persistent cache
        const persistentCachedData = getPersistentCache<{
          topClientsByOrders: TopClientByOrders[],
          topClientsByRevenue: TopClientByRevenue[]
        }>(cacheKey);

        if (persistentCachedData) {
          // Cập nhật cả memory cache và state
          memoryCache.current = setMemoryCache(
            cacheKey,
            persistentCachedData,
            TOP_CLIENTS_CACHE_TTL,
            memoryCache.current
          );

          setTopClientsByOrders(persistentCachedData.topClientsByOrders);
          setTopClientsByRevenue(persistentCachedData.topClientsByRevenue);
          setLoading(false);
          return;
        }

        setLoading(true)

        // Truy vấn top khách hàng theo số lượng đơn hàng
        const { data: orderData, error: orderError } = await supabaseClient.rpc('get_top_clients_by_orders', {
          year_param: selectedYear,
          limit_param: limit
        })

        if (orderError) throw orderError

        // Truy vấn top khách hàng theo doanh thu (sử dụng stored procedure mới)
        const { data: revenueData, error: revenueError } = await supabaseClient.rpc('get_top_clients_by_revenue_currency', {
          year_param: selectedYear,
          limit_param: limit
        })

        if (revenueError) throw revenueError

        // Định dạng dữ liệu top khách hàng theo số lượng đơn hàng
        const formattedOrderData = orderData ? orderData.map(item => ({
          client_id: item.client_id,
          client_name: item.client_name || 'Không xác định',
          order_count: typeof item.order_count === 'string' ? parseInt(item.order_count) : item.order_count
        })) : []

        // Định dạng dữ liệu top khách hàng theo doanh thu
        const formattedRevenueData = revenueData ? revenueData.map(item => ({
          client_id: item.client_id,
          client_name: item.client_name || 'Không xác định',
          total_revenue_vnd: typeof item.total_revenue_vnd === 'string' ? parseFloat(item.total_revenue_vnd) : item.total_revenue_vnd || 0,
          total_revenue_usd: typeof item.total_revenue_usd === 'string' ? parseFloat(item.total_revenue_usd) : item.total_revenue_usd || 0,
          currency: item.currency
        })) : []

        // Tạo đối tượng cache
        const cacheData = {
          topClientsByOrders: formattedOrderData,
          topClientsByRevenue: formattedRevenueData
        };

        // Lưu vào cả memory cache và persistent cache
        memoryCache.current = setMemoryCache(
          cacheKey,
          cacheData,
          TOP_CLIENTS_CACHE_TTL,
          memoryCache.current
        );

        // Lưu vào persistent cache để giữ giữa các lần refresh
        setPersistentCache(cacheKey, cacheData, TOP_CLIENTS_CACHE_TTL);

        setTopClientsByOrders(formattedOrderData)
        setTopClientsByRevenue(formattedRevenueData)

        logger.info(`Đã tải và cache ${formattedOrderData.length} khách hàng top theo đơn hàng và ${formattedRevenueData.length} khách hàng top theo doanh thu cho năm ${selectedYear}`)
      } catch (error: any) {
        console.error('Error fetching top clients:', error)
        logger.error('Error fetching top clients:', error)
        setError(error.message || 'Lỗi khi tải dữ liệu top khách hàng')

        // Đặt giá trị mặc định khi có lỗi
        setTopClientsByOrders([])
        setTopClientsByRevenue([])
      } finally {
        setLoading(false)
      }
    }

    fetchTopClients()
  }, [selectedYear, limit])

  // Thêm hàm để xóa cache khi cần
  const clearCache = () => {
    memoryCache.current = {};
    logger.info('Đã xóa memory cache cho top clients');
  };

  return { topClientsByOrders, topClientsByRevenue, loading, error, clearCache }
}
