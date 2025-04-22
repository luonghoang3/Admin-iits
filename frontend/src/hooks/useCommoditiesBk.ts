import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Commodity } from '@/types/commodities';
import logger from '@/lib/logger'

interface CommodityInput {
  id?: string;
  name: string;
  description?: string;
  category_id?: string;
}

interface UseCommoditiesBkReturn {
  commodities: Commodity[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  searchQuery: string;
  searchCommodities: (query: string) => void;
  loadMoreCommodities: () => Promise<void>;
  findCommodityById: (id: string) => Commodity | undefined;
  addCommodity: (data: CommodityInput) => Promise<Commodity>;
}

export function useCommoditiesBk(): UseCommoditiesBkReturn {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Không còn sử dụng phân trang, tải tất cả dữ liệu một lần

  // Hàm tải dữ liệu hàng hóa - tải tất cả một lần
  const loadCommodities = useCallback(async (query: string) => {
    try {
      const supabase = createClient();

      // Lấy tất cả danh mục từ bảng categories_new
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories_new')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Tạo map categories để tra cứu nhanh
      const categoriesMap = new Map();
      categoriesData?.forEach(category => {
        categoriesMap.set(category.id, {
          ...category,
          children: [],
          parent: null
        });
      });

      // Xây dựng cấu trúc phân cấp danh mục
      categoriesData?.forEach(category => {
        if (category.parent_id && categoriesMap.has(category.parent_id)) {
          // Thêm danh mục con vào danh mục cha
          const parentCategory = categoriesMap.get(category.parent_id);
          parentCategory.children.push(category.id);

          // Thiết lập tham chiếu tới danh mục cha
          const childCategory = categoriesMap.get(category.id);
          childCategory.parent = parentCategory;
        }
      });

      // Sử dụng bảng commodities.bk thay vì commodities_new
      let request = supabase
        .from('commodities.bk')
        .select(`
          *
        `)
        .order('name');

      // Thêm điều kiện tìm kiếm nếu có
      if (query) {
        request = request.ilike('name', `%${query}%`);
      }

      const { data, error } = await request;

      if (error) throw error;

      // Chuyển đổi dữ liệu để phù hợp với interface Commodity
      const formattedData = data?.map(item => {
        const categoryEntry = item.category_id ? categoriesMap.get(item.category_id) : null;
        let category = null;
        let rootCategory = null;

        if (categoryEntry) {
          // Tạo thông tin danh mục trực tiếp
          category = {
            id: categoryEntry.id,
            name: categoryEntry.name,
            description: categoryEntry.description || null,
            parent_id: categoryEntry.parent_id || null
          };

          // Tìm danh mục gốc (root)
          let currentCategory = categoryEntry;
          while (currentCategory && currentCategory.parent) {
            currentCategory = currentCategory.parent;
          }

          if (currentCategory && currentCategory.id !== categoryEntry.id) {
            rootCategory = {
              id: currentCategory.id,
              name: currentCategory.name,
              description: currentCategory.description || null,
              parent_id: null
            };
          }
        }

        return {
          ...item,
          category_id: item.category_id,
          category: category,
          root_category: rootCategory || category, // Sử dụng danh mục hiện tại nếu không có danh mục gốc
          teams: []
        };
      }) || [];

      // Cập nhật state
      setCommodities(formattedData);
      setHasMore(false); // Không còn dữ liệu để tải thêm
      setError(null);
    } catch (err) {
      logger.error('Error loading commodities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load commodities');
    }
  }, []);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    async function initialLoad() {
      setIsLoading(true);
      await loadCommodities('');
      setIsLoading(false);
    }

    initialLoad();
  }, [loadCommodities]);

  // Hàm tìm kiếm hàng hóa
  const searchCommodities = useCallback((query: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    loadCommodities(query).then(() => {
      setIsLoading(false);
    });
  }, [loadCommodities]);

  // Hàm tải thêm dữ liệu - không còn cần thiết vì đã tải tất cả dữ liệu một lần
  const loadMoreCommodities = useCallback(async () => {
    // Không còn cần thiết vì đã tải tất cả dữ liệu một lần
    return;
  }, []);

  // Hàm tìm hàng hóa theo ID
  const findCommodityById = useCallback((id: string) => {
    return commodities.find(commodity => commodity.id === id);
  }, [commodities]);

  // Hàm thêm mới hàng hóa
  const addCommodity = useCallback(async (data: CommodityInput): Promise<Commodity> => {
    try {
      const supabase = createClient();

      // Kiểm tra dữ liệu đầu vào
      if (!data.name) {
        throw new Error('Commodity name is required');
      }

      // Chuẩn bị dữ liệu để thêm vào bảng
      const commodityData: any = {
        name: data.name,
        description: data.description || null,
        category_id: data.category_id === 'none' ? null : data.category_id || null
      };

      // Sử dụng ID được cung cấp nếu có
      if (data.id) {
        commodityData.id = data.id;
      }

      // Thêm mới hàng hóa vào bảng commodities.bk
      const { data: newCommodity, error: insertError } = await supabase
        .from('commodities.bk')
        .insert([commodityData]) // Đảm bảo dữ liệu được gửi dưới dạng mảng
        .select('*')
        .single();

      if (insertError) {
        logger.error('Insert error:', insertError);
        throw new Error(`Failed to insert commodity: ${insertError.message}`);
      }

      if (!newCommodity) {
        throw new Error('No data returned after commodity creation');
      }

      // Lấy thông tin danh mục nếu có
      let category = null;
      let rootCategory = null;

      if (newCommodity.category_id) {
        try {
          const { data: categoryData } = await supabase
            .from('categories_new')
            .select('*')
            .eq('id', newCommodity.category_id)
            .single();

          if (categoryData) {
            category = {
              id: categoryData.id,
              name: categoryData.name,
              description: categoryData.description || null,
              parent_id: categoryData.parent_id || null
            };

            // Nếu danh mục có parent_id, lấy thông tin danh mục gốc
            if (categoryData.parent_id) {
              const { data: rootCategoryData } = await supabase
                .from('categories_new')
                .select('*')
                .eq('id', categoryData.parent_id)
                .single();

              if (rootCategoryData) {
                rootCategory = {
                  id: rootCategoryData.id,
                  name: rootCategoryData.name,
                  description: rootCategoryData.description || null,
                  parent_id: null
                };
              }
            } else {
              // Nếu không có parent_id, danh mục hiện tại là danh mục gốc
              rootCategory = { ...category };
            }
          }
        } catch (categoryError) {
          logger.error('Error fetching category:', categoryError);
          // Không throw error, vẫn tiếp tục với commodity đã tạo
        }
      }

      // Thêm hàng hóa mới vào danh sách
      const formattedCommodity = {
        ...newCommodity,
        category: category,
        root_category: rootCategory,
        teams: []
      };

      setCommodities(prev => [formattedCommodity, ...prev]);

      return formattedCommodity as Commodity;
    } catch (err) {
      logger.error('Error adding commodity:', err);
      throw err;
    }
  }, []);

  return {
    commodities,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    searchQuery,
    searchCommodities,
    loadMoreCommodities,
    findCommodityById,
    addCommodity
  };
}
