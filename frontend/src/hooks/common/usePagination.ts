import { useState, useCallback, useMemo } from 'react'

interface PaginationOptions {
  initialPage?: number
  initialPageSize?: number
  totalItems?: number
}

/**
 * Hook để quản lý phân trang cho dữ liệu
 */
export function usePagination<T = any>({
  initialPage = 1,
  initialPageSize = 10,
  totalItems = 0
}: PaginationOptions = {}) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(totalItems)

  // Tính toán tổng số trang
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize))
  }, [total, pageSize])

  // Xử lý chuyển đến trang cụ thể
  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)))
  }, [totalPages])

  // Xử lý chuyển đến trang tiếp theo
  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }, [page, totalPages])

  // Xử lý chuyển đến trang trước
  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1)
    }
  }, [page])

  // Thay đổi kích thước trang
  const changePageSize = useCallback((newSize: number) => {
    setPageSize(newSize)
    // Đặt lại trang hiện tại để tránh tình trạng trang trống
    setPage(1)
  }, [])

  // Tính toán các thông tin phân trang
  const paginationInfo = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, total)
    
    return {
      startIndex,
      endIndex,
      currentPage: page,
      totalPages,
      pageSize,
      totalItems: total,
      showing: endIndex - startIndex,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }, [page, pageSize, total, totalPages])

  // Áp dụng phân trang vào mảng dữ liệu
  const paginateData = useCallback((data: T[]) => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    
    return data.slice(startIndex, endIndex)
  }, [page, pageSize])

  return {
    page,
    pageSize,
    items,
    setItems,
    total,
    setTotal,
    paginateData,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    paginationInfo
  }
} 