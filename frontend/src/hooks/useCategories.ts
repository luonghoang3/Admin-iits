import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Category } from '@/types/commodities';
import logger from '@/lib/logger'

interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hàm tải danh sách danh mục
  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Sử dụng bảng categories_new
      const { data, error } = await supabase
        .from('categories_new')
        .select('*')
        .order('name');

      if (error) throw error;

      setCategories(data || []);
      setError(null);
    } catch (err) {
      logger.error('Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Tải danh sách danh mục khi component mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    isLoading,
    error,
    refreshCategories: loadCategories
  };
}
