'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import logger from '@/lib/logger'

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
  const supabase = createClient()

  useEffect(() => {
    async function fetchTopClients() {
      try {
        setLoading(true)

        // Truy vấn top khách hàng theo số lượng đơn hàng
        const { data: orderData, error: orderError } = await supabase.rpc('get_top_clients_by_orders', {
          year_param: selectedYear,
          limit_param: limit
        })

        if (orderError) throw orderError

        // Truy vấn top khách hàng theo doanh thu (sử dụng stored procedure mới)
        const { data: revenueData, error: revenueError } = await supabase.rpc('get_top_clients_by_revenue_currency', {
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

        setTopClientsByOrders(formattedOrderData)
        setTopClientsByRevenue(formattedRevenueData)

        logger.info(`Đã tải ${formattedOrderData.length} khách hàng top theo đơn hàng và ${formattedRevenueData.length} khách hàng top theo doanh thu`)
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

  return { topClientsByOrders, topClientsByRevenue, loading, error }
}
