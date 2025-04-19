import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Commodity } from '@/types/commodities';

interface UseCommoditiesReturn {
  commodities: Commodity[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  searchQuery: string;
  searchCommodities: (query: string) => void;
  loadMoreCommodities: () => Promise<void>;
  findCommodityById: (id: string) => Commodity | undefined;
}

export function useCommodities(): UseCommoditiesReturn {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Hàm tải dữ liệu hàng hóa
  const loadCommodities = useCallback(async (query: string, pageNumber: number, replace: boolean = false) => {
    try {
      const supabase = createClient();
      const from = pageNumber * pageSize;
      const to = from + pageSize - 1;

      // Sử dụng bảng commodities_new thay vì commodities
      let request = supabase
        .from('commodities_new')
        .select(`
          *,
          category:categories_new(*),
          teams:commodities_teams_new(team_id, teams(*))
        `)
        .order('name');

      // Thêm điều kiện tìm kiếm nếu có
      if (query) {
        request = request.ilike('name', `%${query}%`);
      }

      // Phân trang
      request = request.range(from, to);

      const { data, error, count } = await request;

      if (error) throw error;

      // Chuyển đổi dữ liệu để phù hợp với interface Commodity
      const formattedData = data?.map(item => ({
        ...item,
        category_id: item.category_id,
        category: item.category,
        teams: item.teams?.map((t: any) => t.teams)
      })) || [];

      // Cập nhật state
      if (replace) {
        setCommodities(formattedData);
      } else {
        setCommodities(prev => [...prev, ...formattedData]);
      }

      // Kiểm tra xem còn dữ liệu để tải không
      setHasMore(formattedData.length === pageSize);
      setError(null);
    } catch (err) {
      console.error('Error loading commodities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load commodities');
    }
  }, [pageSize]);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    async function initialLoad() {
      setIsLoading(true);
      await loadCommodities('', 0, true);
      setIsLoading(false);
    }

    initialLoad();
  }, [loadCommodities]);

  // Hàm tìm kiếm hàng hóa
  const searchCommodities = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(0);
    setIsLoading(true);
    loadCommodities(query, 0, true).then(() => {
      setIsLoading(false);
    });
  }, [loadCommodities]);

  // Hàm tải thêm dữ liệu
  const loadMoreCommodities = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextPage = page + 1;
    await loadCommodities(searchQuery, nextPage, false);
    setPage(nextPage);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, page, searchQuery, loadCommodities]);

  // Hàm tìm hàng hóa theo ID
  const findCommodityById = useCallback((id: string) => {
    return commodities.find(commodity => commodity.id === id);
  }, [commodities]);

  return {
    commodities,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    searchQuery,
    searchCommodities,
    loadMoreCommodities,
    findCommodityById
  };
}
