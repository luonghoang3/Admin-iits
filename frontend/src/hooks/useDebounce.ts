import { useState, useEffect } from 'react'

/**
 * Hook để debounce giá trị, hữu ích cho các trường hợp như tìm kiếm
 * @param value Giá trị cần debounce
 * @param delay Thời gian trễ (ms)
 * @returns Giá trị đã được debounce
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Đặt timeout để cập nhật giá trị debounced sau khoảng thời gian delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Hủy timeout nếu giá trị thay đổi hoặc component unmount
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
