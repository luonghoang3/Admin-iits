'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import logger from '@/lib/logger'

export function useAvailableYears() {
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchAvailableYears() {
      try {
        // Sử dụng truy vấn trực tiếp thay vì stored procedure
        const { data, error } = await supabase
          .from('orders')
          .select('order_date')
          .order('order_date', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          // Lấy danh sách các năm duy nhất
          const years = [...new Set(data.map(order =>
            new Date(order.order_date).getFullYear()
          ))].sort((a, b) => b - a); // Sắp xếp giảm dần

          setAvailableYears(years);
        } else {
          // Fallback nếu không có dữ liệu
          const currentYear = new Date().getFullYear();
          setAvailableYears([currentYear, currentYear - 1, currentYear - 2]);
        }

        logger.info('Đã tải danh sách năm');
      } catch (error: any) {
        logger.error('Error fetching available years:', error);
        // Fallback to default years if there's an error
        const currentYear = new Date().getFullYear();
        setAvailableYears([currentYear, currentYear - 1, currentYear - 2]);
      } finally {
        setLoading(false);
      }
    }

    fetchAvailableYears();
  }, []);

  return { availableYears, loading, error };
}
