import { useEffect, useState, useCallback } from 'react';
import { fetchCommodities, fetchCommodity } from '@/utils/supabase/client';
import type { Commodity } from '@/types/orders';

export function useCommodities() {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);

  // Tải commodities với tìm kiếm và phân trang
  const loadCommodities = useCallback(async (searchText: string = '', pageNum: number = 1) => {
    try {
      // Nếu trang đầu tiên, đặt isLoading = true, ngược lại đặt isLoadingMore = true
      if (pageNum === 1) {
        setIsLoading(true);
        setIsLoadingMore(false);
      } else {
        setIsLoadingMore(true);
      }

      const { commodities: data, total, error: fetchError } = await fetchCommodities(pageNum, 20, searchText);

      if (fetchError) {
        throw new Error(fetchError);
      }

      // Nếu trang đầu tiên hoặc đang tìm kiếm mới, thay thế toàn bộ danh sách
      if (pageNum === 1) {
        setCommodities(data);
      } else {
        // Nếu tải thêm, nối vào danh sách hiện tại
        setCommodities(prev => [...prev, ...data]);
      }

      // Cập nhật thông tin phân trang
      setTotalItems(total || 0);
      setHasMore(data.length >= 20 && (pageNum * 20) < total);
      setPage(pageNum);
      setSearchQuery(searchText);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commodities');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Tìm commodity theo ID và đảm bảo nó có trong danh sách
  const findCommodityById = useCallback(async (commodityId: string) => {
    // Kiểm tra xem commodity đã có trong danh sách chưa
    const existingCommodity = commodities.find(c => c.id === commodityId);
    if (existingCommodity) return existingCommodity;

    // Nếu chưa có, tải từ API
    try {
      const { commodity, error } = await fetchCommodity(commodityId);
      if (error) throw new Error(error);

      if (commodity) {
        // Thêm vào danh sách commodities nếu chưa có
        setCommodities(prev => {
          // Kiểm tra lại một lần nữa để tránh trùng lặp
          if (prev.some(c => c.id === commodity.id)) return prev;
          return [commodity, ...prev];
        });
        return commodity;
      }
    } catch (err) {
      console.error('Error loading commodity:', err);
    }

    return null;
  }, [commodities]);

  // Tìm kiếm commodity
  const searchCommodities = useCallback((query: string) => {
    loadCommodities(query, 1);
  }, [loadCommodities]);

  // Tải thêm commodity
  const loadMoreCommodities = useCallback(() => {
    if (!isLoading && hasMore) {
      loadCommodities(searchQuery, page + 1);
    }
  }, [isLoading, hasMore, searchQuery, page, loadCommodities]);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    loadCommodities();
  }, [loadCommodities]);

  return {
    commodities,
    isLoading,
    isLoadingMore, // Thêm trạng thái isLoadingMore
    error,
    hasMore,
    totalItems,
    searchQuery,
    searchCommodities,
    loadMoreCommodities,
    findCommodityById
  };
}