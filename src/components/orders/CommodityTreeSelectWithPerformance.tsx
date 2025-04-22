'use client'

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Commodity, Category } from '@/types/commodities'
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import logger from '@/lib/logger'

interface CommodityTreeSelectProps {
  commodities: Commodity[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  onSearch?: (query: string) => void
  loading?: boolean
  // Không còn cần các props liên quan đến phân trang
}

// Interface cho cấu trúc phân cấp danh mục
interface CategoryNode {
  id: string;
  name: string;
  isParent: boolean;
  level: number;
  commodities: Commodity[];
  children: CategoryNode[];
}

// Hàm xây dựng cấu trúc cây danh mục - đã tối ưu hóa hiệu suất
function buildCategoryTree(commodities: Commodity[]): CategoryNode[] {
  // Đo thời gian thực thi
  const startTime = performance.now();
  
  // Tạo map để lưu trữ các danh mục
  const categoryMap = new Map<string, CategoryNode>();

  // Danh sách danh mục gốc
  const rootCategories: CategoryNode[] = [];

  // Danh sách hàng hóa không thuộc danh mục nào
  const uncategorizedCommodities: Commodity[] = [];

  // Tạo map các danh mục để tránh tìm kiếm lặp đi lặp lại
  const uniqueCategories = new Map<string, Category>();

  // Tạo danh sách các danh mục duy nhất
  commodities.forEach(commodity => {
    if (commodity.category && commodity.category_id) {
      if (!uniqueCategories.has(commodity.category_id)) {
        uniqueCategories.set(commodity.category_id, commodity.category);
      }
    }
  });

  // Bước 1: Tạo các nút danh mục
  uniqueCategories.forEach((category, categoryId) => {
    categoryMap.set(categoryId, {
      id: categoryId,
      name: category.name,
      isParent: category.parent_id === null,
      level: category.parent_id === null ? 0 : 1,
      commodities: [],
      children: []
    });
  });

  // Bước 2: Phân loại hàng hóa vào các danh mục
  commodities.forEach(commodity => {
    if (commodity.category_id && categoryMap.has(commodity.category_id)) {
      categoryMap.get(commodity.category_id)?.commodities.push(commodity);
    } else {
      uncategorizedCommodities.push(commodity);
    }
  });

  // Bước 3: Xây dựng cấu trúc cây
  uniqueCategories.forEach((category, categoryId) => {
    const node = categoryMap.get(categoryId);
    if (!node) return;

    if (category.parent_id && categoryMap.has(category.parent_id)) {
      // Đây là danh mục con
      const parentNode = categoryMap.get(category.parent_id);
      parentNode?.children.push(node);
    } else {
      // Đây là danh mục gốc hoặc không tìm thấy danh mục cha
      rootCategories.push(node);
    }
  });

  // Hàm sắp xếp theo tên
  const sortByName = (a: any, b: any) => a.name.localeCompare(b.name);

  // Sắp xếp danh mục gốc
  rootCategories.sort(sortByName);

  // Sắp xếp danh mục con và hàng hóa
  const sortNodeRecursive = (node: CategoryNode) => {
    // Sắp xếp danh mục con
    if (node.children.length > 0) {
      node.children.sort(sortByName);
      node.children.forEach(sortNodeRecursive);
    }

    // Sắp xếp hàng hóa
    if (node.commodities.length > 0) {
      node.commodities.sort(sortByName);
    }
  };

  // Chỉ sắp xếp nếu có danh mục
  if (rootCategories.length > 0) {
    rootCategories.forEach(sortNodeRecursive);
  }

  // Sắp xếp hàng hóa không thuộc danh mục nào
  if (uncategorizedCommodities.length > 0) {
    uncategorizedCommodities.sort(sortByName);

    // Thêm danh mục "Uncategorized"
    rootCategories.push({
      id: 'uncategorized',
      name: 'Uncategorized',
      isParent: true,
      level: 0,
      commodities: uncategorizedCommodities,
      children: []
    });
  }
  
  // Đo thời gian thực thi
  const endTime = performance.now();
  logger.error(`[Performance] buildCategoryTree took ${endTime - startTime}ms for ${commodities.length} commodities`);
  
  return rootCategories;
}

function CommodityTreeSelectWithPerformance({
  commodities,
  value,
  onChange,
  placeholder = "Select commodity...",
  disabled = false,
  onSearch,
  loading = false,
}: CommodityTreeSelectProps) {
  // Đo thời gian render
  const renderStartTime = performance.now();
  
  // State cho tìm kiếm local
  const [searchQuery, setSearchQuery] = useState('');
  const [renderCount, setRenderCount] = useState(0);

  // Tăng số lần render mỗi khi component render lại
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  // Xử lý tìm kiếm - sử dụng useCallback để tránh tạo hàm mới mỗi khi render
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  }, [onSearch]);
  
  // Lọc hàng hóa theo từ khóa tìm kiếm nếu không có onSearch callback
  // Sử dụng useEffect để tránh tính toán nặng trong render
  const [filteredCommodities, setFilteredCommodities] = useState<Commodity[]>(commodities);

  useEffect(() => {
    const filterStartTime = performance.now();
    
    if (!searchQuery || onSearch) {
      setFilteredCommodities(commodities);
      const filterEndTime = performance.now();
      logger.error(`[Performance] Setting filtered commodities took ${filterEndTime - filterStartTime}ms`);
      return;
    }

    // Sử dụng setTimeout để tránh block UI khi tìm kiếm
    const timeoutId = setTimeout(() => {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = commodities.filter(c =>
        c.name.toLowerCase().includes(lowerQuery) ||
        (c.description && c.description.toLowerCase().includes(lowerQuery))
      );
      setFilteredCommodities(filtered);
      
      const filterEndTime = performance.now();
      logger.error(`[Performance] Filtering ${commodities.length} commodities took ${filterEndTime - filterStartTime}ms`);
    }, 100); // Thêm delay nhỏ để tránh tìm kiếm quá nhiều lần

    return () => clearTimeout(timeoutId);
  }, [commodities, searchQuery, onSearch]);

  // Xây dựng cấu trúc cây danh mục - thêm state để theo dõi trạng thái loading
  const [isTreeBuilding, setIsTreeBuilding] = useState(false);

  // Sử dụng useEffect để xử lý việc xây dựng cấu trúc cây bất đồng bộ
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);

  useEffect(() => {
    // Chỉ xây dựng cấu trúc cây khi có dữ liệu và không đang loading
    if (filteredCommodities.length === 0 || loading) {
      setCategoryTree([]);
      return;
    }

    // Đánh dấu đang xây dựng cấu trúc cây
    setIsTreeBuilding(true);
    const treeStartTime = performance.now();

    // Sử dụng setTimeout để không block UI
    let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
      try {
        const tree = buildCategoryTree(filteredCommodities);
        setCategoryTree(tree);
      } catch (error) {
        setCategoryTree([]);
        logger.error('[Performance] Error building category tree:', error);
      } finally {
        setIsTreeBuilding(false);
        const treeEndTime = performance.now();
        logger.error(`[Performance] Tree building process took ${treeEndTime - treeStartTime}ms`);
      }
    }, 0);

    // Cleanup function để tránh memory leak
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }, [filteredCommodities, loading]);

  // Tìm tên của hàng hóa được chọn - sử dụng useEffect để tránh tính toán trong render
  const [selectedCommodityName, setSelectedCommodityName] = useState('');

  useEffect(() => {
    if (!value) {
      setSelectedCommodityName('');
      return;
    }

    // Tạo map để tìm kiếm nhanh hơn
    const commodityMap = new Map<string, string>();
    for (const commodity of commodities) {
      commodityMap.set(commodity.id, commodity.name);
    }

    const name = commodityMap.get(value) || '';
    setSelectedCommodityName(name);
  }, [commodities, value]);

  // Đo thời gian render
  const renderEndTime = performance.now();
  logger.error(`[Performance] Render #${renderCount} took ${renderEndTime - renderStartTime}ms`);

  return (
    <>
      {/* Hiển thị thông tin hiệu năng */}
      <div className="text-xs text-gray-500 mb-1">
        <span>Render count: {renderCount}</span>
        <span className="ml-2">Items: {commodities.length}</span>
        <span className="ml-2">Filtered: {filteredCommodities.length}</span>
        <span className="ml-2">Categories: {categoryTree.length}</span>
      </div>
      
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {selectedCommodityName}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-hidden">
          {/* Ô tìm kiếm - đặt sticky và z-index cao hơn */}
          <div className="px-2 py-2 sticky top-0 bg-popover border-b z-10">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Type to search..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>
          {/* Thêm khoảng cách để tránh chồng lấn */}
          <div className="pt-1"></div>
          {/* Hiển thị trạng thái loading ban đầu hoặc đang xây dựng cấu trúc cây */}
          {(loading || isTreeBuilding) && (
            <div className="flex items-center justify-center py-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          )}

          {/* Hiển thị thông báo không có kết quả */}
          {!loading && !isTreeBuilding && categoryTree.length === 0 && (
            <div className="py-3 text-center">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No results found" : "No items available"}
              </p>
            </div>
          )}

          {/* Hiển thị cấu trúc cây danh mục */}
          <div className="overflow-y-auto max-h-[250px]">
            {!loading && !isTreeBuilding && categoryTree.map(category => (
              <SelectGroup key={category.id}>
                {/* Danh mục chính */}
                <SelectLabel className="font-bold text-base py-1 border-b bg-muted/30">{category.name}</SelectLabel>

                {/* Danh mục con */}
                {category.children.map(subCategory => (
                  <React.Fragment key={subCategory.id}>
                    <SelectLabel className="font-semibold text-sm py-1 pl-4 border-b border-dashed bg-muted/20">
                      {subCategory.name}
                    </SelectLabel>

                    {/* Hàng hóa trong danh mục con */}
                    {subCategory.commodities.map(commodity => (
                      <SelectItem
                        key={commodity.id}
                        value={commodity.id}
                        className="pl-8 text-sm"
                      >
                        {commodity.name}
                      </SelectItem>
                    ))}
                  </React.Fragment>
                ))}

                {/* Hàng hóa trong danh mục chính */}
                {category.commodities.map(commodity => (
                  <SelectItem
                    key={commodity.id}
                    value={commodity.id}
                    className="pl-6 text-sm"
                  >
                    {commodity.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </div>
        </SelectContent>
      </Select>
    </>
  )
}

// Sử dụng React.memo để tránh render lại không cần thiết
export default React.memo(CommodityTreeSelectWithPerformance);
