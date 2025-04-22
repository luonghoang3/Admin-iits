"use client"

import * as React from "react"
import { Search, Loader2 } from "lucide-react"
import { fetchClientsForCombobox } from "@/utils/supabase/client"
import { useDebounce } from "@/hooks/useDebounce"
import logger from '@/lib/logger'

interface ClientOption {
  value: string
  label: string
}

interface ClientComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  initialOptions?: ClientOption[]
}

export function ClientCombobox({
  value,
  onChange,
  placeholder = "Tìm kiếm khách hàng...",
  initialOptions = []
}: ClientComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [options, setOptions] = React.useState<ClientOption[]>(initialOptions)
  const [loading, setLoading] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false) // Trạng thái riêng cho việc tải thêm
  const [hasMore, setHasMore] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const optionsContainerRef = React.useRef<HTMLDivElement>(null)
  const optionsRef = React.useRef<ClientOption[]>(initialOptions)
  const loadingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null) // Timeout cho việc hiển thị loading
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null) // Timeout cho việc tìm kiếm
  // Giảm thời gian debounce xuống 200ms để phản hồi nhanh hơn
  const debouncedSearchQuery = useDebounce(searchQuery, 200)

  // Cập nhật optionsRef khi options thay đổi
  React.useEffect(() => {
    optionsRef.current = options
  }, [options])

  // Tìm label của giá trị hiện tại
  const selectedLabel = React.useMemo(() => {
    const selected = options.find(option => option.value === value)
    return selected?.label || ""
  }, [value, options])

  // Tải dữ liệu khách hàng
  const loadClients = React.useCallback(async (reset = false) => {
    try {
      logger.log(`loadClients called with reset=${reset}, current page=${page}`)

      // Xóa timeout hiển thị loading nếu có
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }

      // Đặt trạng thái loading phù hợp
      if (reset || optionsRef.current.length === 0) {
        // Nếu reset hoặc không có dữ liệu, hiển thị loading chính
        setLoading(true)
        setLoadingMore(false)
      } else {
        // Nếu đang tải thêm, hiển thị loadingMore
        setLoadingMore(true)
        setLoading(false)
      }

      // Nếu reset, đặt lại trang về 1
      // Nếu không reset, tăng trang lên 1 để tải trang tiếp theo
      const currentPage = reset ? 1 : page

      // Nếu đang tải thêm (không reset), tăng trang lên 1 cho lần tải tiếp theo
      if (!reset) {
        logger.log(`Incrementing page from ${page} to ${page + 1}`)
        setPage(page + 1)
      } else {
        // Nếu reset, đặt lại trang về 1
        if (page !== 1) {
          logger.log(`Resetting page from ${page} to 1`)
          setPage(1)
        }
      }

      try {
        logger.log(`Fetching clients: page=${currentPage}, query="${debouncedSearchQuery}"`)

        const { clients, hasMore: moreResults, error, total } = await fetchClientsForCombobox({
          page: currentPage,
          limit: 15, // Giảm số lượng mỗi lần tải để đảm bảo lazy loading hoạt động
          searchQuery: debouncedSearchQuery
        })

        logger.log(`API returned: ${clients?.length || 0} clients, hasMore=${moreResults}, total=${total}`)

        if (error) {
          logger.error('Error loading clients:', error)
          return
        }

        // Nếu không có lỗi và không có dữ liệu, cũng dừng
        if (!clients || clients.length === 0) {
          if (reset) {
            setOptions([])
          }
          setHasMore(false)
          return
        }

        // Cập nhật danh sách tùy chọn
        if (reset) {
          logger.log(`Setting ${clients.length} clients (reset)`)
          setOptions(clients)
          optionsRef.current = clients
        } else {
          // Tránh trùng lặp bằng cách kiểm tra ID
          const existingIds = new Set(optionsRef.current.map(opt => opt.value))
          const newClients = clients.filter(client => !existingIds.has(client.value))

          logger.log(`Adding ${newClients.length} new clients to existing ${optionsRef.current.length} clients`)

          // Cách đơn giản hơn để loại bỏ trùng lặp
          const allOptions = [...optionsRef.current, ...newClients]
          const uniqueOptions = Array.from(new Map(allOptions.map(item => [item.value, item])).values())

          logger.log(`Final unique options count: ${uniqueOptions.length}`)
          setOptions(uniqueOptions)
          optionsRef.current = uniqueOptions
        }

        logger.log(`Has more results: ${moreResults}`)
        setHasMore(moreResults)

        // Đã cập nhật page ở trên, không cần cập nhật ở đây nữa
        // Chỉ log để debug
        logger.log(`Current page after API call: ${page}, next page will be: ${page + 1}`)
      } catch (err) {
        logger.error('Error in loadClients try/catch:', err)
      }
    } catch (err) {
      logger.error('Error in loadClients:', err)
    } finally {
      // Xóa timeout hiển thị loading nếu có
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }

      // Tắt cả hai trạng thái loading
      setLoading(false)
      setLoadingMore(false)
    }
  // Loại bỏ options khỏi dependencies để tránh vòng lặp vô hạn
  // Sử dụng useRef để truy cập giá trị hiện tại của options trong callback
  }, [page, debouncedSearchQuery])

  // Khai báo hàm loadMoreData trước để tránh lỗi tham chiếu
  const loadMoreData = React.useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      logger.log(`Cannot load more: loading=${loading}, loadingMore=${loadingMore}, hasMore=${hasMore}`);
      return;
    }

    logger.log('MANUALLY LOADING MORE DATA...');

    // Đặt trạng thái loadingMore ngay lập tức
    setLoadingMore(true);

    // Sử dụng setTimeout để đảm bảo state được cập nhật trước khi gọi API
    setTimeout(() => {
      loadClients(false);
    }, 50);
  }, [loading, loadingMore, hasMore, loadClients]);

  // Xử lý cuộn để tải thêm - được gọi trực tiếp từ sự kiện onScroll
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Lấy phần tử đang cuộn
    const container = e.currentTarget;
    if (!container) return;

    // Kiểm tra điều kiện có thể tải thêm hay không
    if (!hasMore) {
      // logger.log('No more data to load');
      return;
    }

    if (loading || loadingMore) {
      // logger.log('Already loading data');
      return;
    }

    // Tính toán khoảng cách đến cuối
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;

    // Chỉ log khi gần đến cuối để tránh quá nhiều log
    if (distanceToBottom < 200) {
      logger.log(`Scroll event - Distance to bottom: ${distanceToBottom}px`);
    }

    // Nếu đã cuộn gần đến cuối (còn 100px), tải thêm dữ liệu
    if (distanceToBottom < 100) {
      logger.log('LOADING MORE CLIENTS FROM SCROLL!');

      // Sử dụng requestAnimationFrame để đảm bảo hiệu suất tốt
      window.requestAnimationFrame(() => {
        // Kiểm tra lại điều kiện để tránh gọi nhiều lần
        if (!loading && !loadingMore && hasMore) {
          loadMoreData();
        }
      });
    }
  }, [hasMore, loading, loadingMore, loadMoreData]);

  // Hàm loadMoreData đã được khai báo ở trên

  // Tải dữ liệu ban đầu khi component mount
  React.useEffect(() => {
    // Sử dụng biến cờ để chỉ tải một lần
    let isMounted = true
    let initialLoadTimeout: NodeJS.Timeout | null = null

    const initialLoad = async () => {
      // Chỉ tải nếu chưa có dữ liệu và component vẫn mounted
      if (optionsRef.current.length === 0 && isMounted && !loading && !loadingMore) {
        // Đặt trạng thái loading ngay lập tức
        setLoading(true)

        // Sử dụng setTimeout để tránh nhiều lần gọi liên tục
        initialLoadTimeout = setTimeout(() => {
          if (isMounted) {
            loadClients(true)
          }
        }, 100)
      }
    }

    initialLoad()

    // Cleanup function
    return () => {
      isMounted = false
      if (initialLoadTimeout) {
        clearTimeout(initialLoadTimeout)
      }
    }
  // Chỉ chạy một lần khi component mount
  }, [])

  // Tải thêm dữ liệu khi mở dropdown
  React.useEffect(() => {
    // Không làm gì nếu dropdown đóng hoặc đang tải
    if (!isOpen || loading || loadingMore || !hasMore) return

    // Chỉ tải thêm khi số lượng ít hơn 30 mục
    if (optionsRef.current.length < 30) {
      // Sử dụng biến cờ để tránh vòng lặp vô hạn
      let isMounted = true
      let timeoutId: NodeJS.Timeout | null = null

      logger.log('Initial load when dropdown opens')

      // Đặt trạng thái loadingMore ngay lập tức
      setLoadingMore(true)

      // Sử dụng setTimeout với delay ngắn hơn để phản hồi nhanh hơn
      timeoutId = setTimeout(() => {
        if (isMounted) {
          loadClients(false)
        }
      }, 100) // Giảm delay xuống 100ms để phản hồi nhanh hơn

      return () => {
        isMounted = false
        // Xóa timeout khi unmount hoặc dependencies thay đổi
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }
  }, [isOpen, hasMore, loading, loadingMore])

  // Không cần useEffect để gắn sự kiện scroll nữa vì chúng ta sử dụng onScroll trực tiếp

  // Tải lại dữ liệu khi truy vấn tìm kiếm thay đổi (sau khi debounce)
  React.useEffect(() => {
    // Không làm gì nếu dropdown đóng
    if (!isOpen) return

    // Hủy timeout tìm kiếm hiện tại nếu có
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Sử dụng biến cờ để tránh vòng lặp vô hạn
    let isMounted = true

    // Chỉ tìm kiếm khi có truy vấn
    if (debouncedSearchQuery !== '') {
      // Đặt trạng thái loading ngay lập tức
      setLoading(true)

      // Sử dụng timeout ngắn để phản hồi nhanh hơn
      searchTimeoutRef.current = setTimeout(() => {
        if (isMounted) {
          loadClients(true)
        }
      }, 100) // Giảm delay xuống 100ms để phản hồi nhanh hơn
    }

    return () => {
      isMounted = false
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [debouncedSearchQuery, isOpen])

  // Xử lý click bên ngoài để đóng dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className="flex items-center justify-between w-full px-3 py-2 border rounded-md bg-white cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 truncate">
          {value ? selectedLabel : placeholder}
        </div>
        {options.length === 0 && loading ? (
          <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
        ) : (
          <Search className="h-4 w-4 text-gray-400" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
          <div className="p-2 border-b sticky top-0 bg-white z-10">
            <div className="relative">
              <input
                type="text"
                className="w-full pl-8 pr-8 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => {
                  // Luôn cho phép nhập, ngay cả khi đang tải
                  const newValue = e.target.value
                  setSearchQuery(newValue)

                  // Hủy timeout tìm kiếm hiện tại nếu có
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current)
                  }

                  // Nếu xóa hết tìm kiếm, tải lại dữ liệu ban đầu ngay lập tức
                  if (newValue === '') {
                    // Hủy trạng thái loading hiện tại
                    setLoading(false)
                    // Tải lại dữ liệu ban đầu
                    loadClients(true)
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                // Không vô hiệu hóa input để người dùng có thể tiếp tục nhập
              />
              {/* Biểu tượng tìm kiếm hoặc loading */}
              {loading && debouncedSearchQuery ? (
                <Loader2 className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
              ) : (
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              )}
              {/* Nút xóa tìm kiếm - luôn cho phép xóa */}
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSearchQuery('')
                    // Khi xóa tìm kiếm, tải lại dữ liệu ban đầu
                    if (loading) {
                      // Hủy trạng thái loading hiện tại
                      setLoading(false)
                      // Tải lại dữ liệu ban đầu sau một khoảng thời gian ngắn
                      setTimeout(() => loadClients(true), 100)
                    }
                  }}
                  // Không vô hiệu hóa nút để người dùng có thể xóa tìm kiếm bất cứ lúc nào
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div
            className="max-h-[300px] overflow-y-auto p-1 overscroll-contain"
            ref={optionsContainerRef}
            onScroll={handleScroll} // Sử dụng hàm handleScroll đã cập nhật
            style={{ scrollBehavior: 'smooth' }}
            data-testid="client-options-container" // Thêm data-testid để dễ dàng debug
            id="client-options-scroll-container" // Thêm ID để dễ dàng debug
          >
            {/* Hiển thị trạng thái loading khi đang tìm kiếm và không có kết quả */}
            {loading && options.length === 0 ? (
              <div className="py-4 px-3 text-sm text-gray-500 text-center flex items-center justify-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tìm kiếm...
              </div>
            ) : options.length === 0 ? (
              <div className="py-4 px-3 text-sm text-gray-500 text-center">
                Không tìm thấy khách hàng
              </div>
            ) : (
              <>
                {/* Sử dụng Set để loại bỏ trùng lặp khi render */}
                {Array.from(new Map(options.map(item => [item.value, item])).values()).map((option) => (
                  <div
                    key={option.value}
                    className={`px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 ${value === option.value ? 'bg-gray-100 font-medium' : ''}`}
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                      setSearchQuery("")
                    }}
                  >
                    {option.label}
                  </div>
                ))}

                {/* Chỉ hiển thị loading khi đang tải thêm và có dữ liệu */}
                {loadingMore && (
                  <div className="py-3 px-3 text-sm text-gray-500 text-center flex items-center justify-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tải thêm khách hàng...
                  </div>
                )}

                {/* Hiển thị nút tải thêm thủ công nếu có thể tải thêm */}
                {!loading && !loadingMore && hasMore && options.length > 0 && (
                  <div
                    className="py-3 px-3 text-sm text-blue-500 text-center cursor-pointer hover:bg-blue-50 flex items-center justify-center"
                    onClick={(e) => {
                      // Ngăn chặn sự kiện lan truyền để tránh đóng dropdown
                      e.preventDefault()
                      e.stopPropagation()

                      logger.log('Manual load more clicked')
                      // Gọi trực tiếp loadClients để đảm bảo tải thêm dữ liệu
                      setLoadingMore(true)
                      setTimeout(() => loadClients(false), 50)
                    }}
                    data-testid="load-more-button"
                  >
                    <Loader2 className="h-4 w-4 mr-2" />
                    Tải thêm khách hàng
                  </div>
                )}

                {/* Đã thay thế bằng nút tải thêm thủ công ở trên */}

                {!loading && !loadingMore && !hasMore && options.length > 0 && (
                  <div className="py-2 px-3 text-sm text-gray-500 text-center">
                    Đã hiển thị tất cả kết quả
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
