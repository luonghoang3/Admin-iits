import { useState, useCallback } from 'react'
import logger from '@/lib/logger'

/**
 * Hook để quản lý trạng thái loading và xử lý các thao tác bất đồng bộ
 */
export function useAsyncAction<T = any>() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)

  /**
   * Thực hiện một thao tác bất đồng bộ và cập nhật trạng thái loading/lỗi tương ứng
   */
  const execute = useCallback(async <R = T>(
    asyncFn: () => Promise<R>,
    onSuccess?: (result: R) => void,
    onError?: (error: Error) => void
  ): Promise<R | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await asyncFn()
      setIsLoading(false)
      setData(result as unknown as T)
      onSuccess?.(result)
      return result
    } catch (err) {
      setIsLoading(false)
      // Improve error handling
      let errorMessage: string;
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = err.message || JSON.stringify(err);
      } else {
        errorMessage = 'Unknown error occurred';
      }

      const error = new Error(errorMessage)
      setError(error)
      onError?.(error)
      logger.error('Async action failed:', error)
      return null
    }
  }, [])

  /**
   * Đặt lại trạng thái
   */
  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    isLoading,
    error,
    data,
    execute,
    reset
  }
}