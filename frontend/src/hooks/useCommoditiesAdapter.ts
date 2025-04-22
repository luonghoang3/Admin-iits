import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Commodity } from '@/types/commodities';
import logger from '@/lib/logger'
import { useCommodities } from './useCommodities';

/**
 * Hook này là một adapter để đảm bảo tính tương thích với bảng commodities.bk
 * trong khi chúng ta chuyển đổi sang bảng commodities_new.
 * 
 * Nó sẽ tự động đồng bộ dữ liệu từ commodities_new sang commodities.bk
 * để đảm bảo rằng các ràng buộc khóa ngoại vẫn hoạt động đúng.
 */
export function useCommoditiesAdapter() {
  // Sử dụng hook useCommodities để lấy dữ liệu từ bảng commodities_new
  const {
    commodities,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    searchQuery,
    searchCommodities,
    loadMoreCommodities,
    findCommodityById,
    addCommodity: addCommodityToNew
  } = useCommodities();

  // Hàm thêm mới commodity vào cả hai bảng
  const addCommodity = useCallback(async (data: any): Promise<Commodity> => {
    try {
      // Thêm vào bảng commodities_new trước
      const newCommodity = await addCommodityToNew(data);
      
      // Sau đó, thêm vào bảng commodities.bk với cùng ID
      try {
        const supabase = createClient();
        
        // Chuẩn bị dữ liệu để thêm vào bảng commodities.bk
        const commodityData = {
          id: newCommodity.id, // Sử dụng cùng ID
          name: newCommodity.name,
          description: newCommodity.description || null,
          category_id: newCommodity.category_id || null,
          created_at: new Date().toISOString()
        };
        
        // Thêm vào bảng commodities.bk
        const { error: insertError } = await supabase
          .from('commodities.bk')
          .insert([commodityData]);
        
        if (insertError) {
          logger.error('Error syncing to commodities.bk:', insertError);
          // Không throw error, vẫn trả về commodity đã tạo
        }
      } catch (syncError) {
        logger.error('Error in sync process:', syncError);
        // Không throw error, vẫn trả về commodity đã tạo
      }
      
      return newCommodity;
    } catch (err) {
      logger.error('Error in addCommodity adapter:', err);
      throw err;
    }
  }, [addCommodityToNew]);

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
