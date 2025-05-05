'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from '@/utils/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface OrderChartProps {
  year: number
}

interface MonthlyData {
  name: string
  pending: number
  inProgress: number
  completed: number
}

export function OrderChart({ year }: OrderChartProps) {
  const [data, setData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Lấy dữ liệu đơn hàng theo tháng và trạng thái
        const { data, error } = await supabase
          .from('orders')
          .select('id, status, order_date')
          .gte('order_date', `${year}-01-01`)
          .lte('order_date', `${year}-12-31`)

        if (error) throw error

        // Tạo dữ liệu cho biểu đồ
        const monthlyData: MonthlyData[] = Array(12).fill(0).map((_, index) => ({
          name: new Date(0, index).toLocaleString('vi', { month: 'short' }),
          pending: 0,
          inProgress: 0,
          completed: 0
        }))

        // Phân loại đơn hàng theo tháng và trạng thái
        data?.forEach(order => {
          const date = new Date(order.order_date)
          const month = date.getMonth()

          if (order.status === 'pending') {
            monthlyData[month].pending += 1
          } else if (order.status === 'in_progress') {
            monthlyData[month].inProgress += 1
          } else if (order.status === 'completed') {
            monthlyData[month].completed += 1
          }
        })

        setData(monthlyData)
      } catch (error: any) {
        console.error('Error fetching chart data:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [year])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thống kê đơn hàng theo tháng</CardTitle>
          <CardDescription>Đang tải dữ liệu...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          Đang tải...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thống kê đơn hàng theo tháng</CardTitle>
          <CardDescription>Lỗi: {error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thống kê đơn hàng theo tháng</CardTitle>
        <CardDescription>Số lượng đơn hàng theo trạng thái trong năm {year}</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="pending" name="Đang chờ" fill="#8884d8" />
            <Bar dataKey="inProgress" name="Đang thực hiện" fill="#82ca9d" />
            <Bar dataKey="completed" name="Hoàn thành" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
