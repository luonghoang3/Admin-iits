'use client'

import * as React from "react"
import { Search, Loader2, ChevronRight, Plus } from "lucide-react"
import { Commodity, Category } from '@/types/commodities'

interface GroupedCommodity {
  rootCategory: Category | null;
  category: Category | null;
  items: Commodity[];
}

interface CommodityComboboxProps {
  commodities: Commodity[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  onSearch?: (query: string) => void
  loading?: boolean
  onAddNew?: () => void
}

export default function CommodityCombobox({
  commodities,
  value,
  onChange,
  placeholder = "Select commodity...",
  disabled = false,
  onSearch,
  loading = false,
  onAddNew,
}: CommodityComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Tìm tên của hàng hóa được chọn
  const selectedCommodityName = React.useMemo(() => {
    if (!value) return '';
    const selected = commodities?.find(c => c.id === value);
    return selected?.name || '';
  }, [commodities, value]);

  // Lọc danh sách hàng hóa theo từ khóa tìm kiếm
  const filteredCommodities = React.useMemo(() => {
    if (!commodities) return [];
    if (!searchQuery) return commodities;

    return commodities.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [commodities, searchQuery]);

  // Xử lý tìm kiếm
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  // Xử lý click bên ngoài để đóng dropdown
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Nhóm hàng hóa theo danh mục gốc và danh mục con
  const groupedCommodities = React.useMemo(() => {
    if (!filteredCommodities || filteredCommodities.length === 0) return [];

    // Tạo map để nhóm các hàng hóa theo danh mục gốc
    const rootGroups: Record<string, GroupedCommodity[]> = {};

    // Thêm nhóm 'Uncategorized' cho các hàng hóa không có danh mục
    rootGroups['uncategorized'] = [{
      rootCategory: { id: 'uncategorized', name: 'Uncategorized', description: null, parent_id: null },
      category: { id: 'uncategorized', name: 'Uncategorized', description: null, parent_id: null },
      items: []
    }];

    // Nhóm các hàng hóa theo danh mục gốc và danh mục con
    filteredCommodities.forEach(commodity => {
      if (commodity.category && commodity.category_id) {
        const rootCategoryId = commodity.root_category?.id || commodity.category_id;
        const categoryId = commodity.category_id;

        // Tạo nhóm danh mục gốc nếu chưa có
        if (!rootGroups[rootCategoryId]) {
          rootGroups[rootCategoryId] = [];
        }

        // Tìm nhóm danh mục con trong danh mục gốc
        let subGroup = rootGroups[rootCategoryId].find(g => g.category?.id === categoryId);

        if (!subGroup) {
          subGroup = {
            rootCategory: commodity.root_category || commodity.category,
            category: commodity.category,
            items: []
          };
          rootGroups[rootCategoryId].push(subGroup);
        }

        subGroup.items.push(commodity);
      } else {
        // Nếu không có danh mục, thêm vào nhóm 'Uncategorized'
        rootGroups['uncategorized'][0].items.push(commodity);
      }
    });

    // Loại bỏ các nhóm không có hàng hóa
    Object.keys(rootGroups).forEach(rootKey => {
      rootGroups[rootKey] = rootGroups[rootKey].filter(group => group.items.length > 0);
      if (rootGroups[rootKey].length === 0) {
        delete rootGroups[rootKey];
      }
    });

    // Chuyển đổi thành mảng phẳng
    const result: GroupedCommodity[] = [];

    // Sắp xếp các nhóm gốc
    const sortedRootKeys = Object.keys(rootGroups).sort((a, b) => {
      if (a === 'uncategorized') return 1;
      if (b === 'uncategorized') return -1;
      return (rootGroups[a][0]?.rootCategory?.name || '').localeCompare(rootGroups[b][0]?.rootCategory?.name || '');
    });

    // Thêm các nhóm vào kết quả theo thứ tự đã sắp xếp
    sortedRootKeys.forEach(rootKey => {
      // Sắp xếp các nhóm con trong mỗi nhóm gốc
      const sortedSubGroups = rootGroups[rootKey].sort((a, b) => {
        // Đặt danh mục gốc lên đầu tiên
        const aIsRoot = a.category?.id === a.rootCategory?.id;
        const bIsRoot = b.category?.id === b.rootCategory?.id;

        if (aIsRoot && !bIsRoot) return -1;
        if (!aIsRoot && bIsRoot) return 1;

        // Sắp xếp theo tên
        return (a.category?.name || '').localeCompare(b.category?.name || '');
      });

      // Thêm vào kết quả
      result.push(...sortedSubGroups);
    });

    return result;
  }, [filteredCommodities]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <div
          className={`flex-1 flex items-center justify-between px-3 py-2 border rounded-md bg-background cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => {
            if (!disabled) {
              setIsOpen(prev => !prev);
            }
          }}
        >
          <div className="flex-1 truncate">
            {value ? selectedCommodityName : placeholder}
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {onAddNew && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddNew();
            }}
            className="flex-shrink-0 p-1 h-9 w-9 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            title="Add New Commodity"
            type="button"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
          <div className="p-2 border-b sticky top-0 bg-background z-10">
            <div className="relative">
              <input
                type="text"
                className="w-full pl-8 pr-8 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Type to search..."
                value={searchQuery}
                onChange={handleSearch}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              {loading ? (
                <Loader2 className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
              ) : (
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSearchQuery('')
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div
            className="max-h-[300px] overflow-y-auto p-1 overscroll-contain"
            style={{ scrollBehavior: 'smooth' }}
          >
            {loading ? (
              <div className="py-4 px-3 text-sm text-muted-foreground text-center flex items-center justify-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </div>
            ) : groupedCommodities.length === 0 ? (
              <div className="py-4 px-3 text-sm text-muted-foreground text-center">
                <div>{searchQuery ? "No results found" : "No items available"}</div>
              </div>
            ) : (
              <>

                {groupedCommodities.map((group, groupIndex) => (
                <div key={`${group.rootCategory?.id || 'uncategorized'}-${group.category?.id || 'sub'}-${groupIndex}`} className="mb-2">
                  {/* Hiển thị danh mục gốc nếu là danh mục đầu tiên trong nhóm */}
                  {groupIndex === 0 || (groupIndex > 0 && groupedCommodities[groupIndex-1]?.rootCategory?.id !== group.rootCategory?.id) ? (
                    <div className="font-bold text-base py-1 px-3 border-b bg-primary/10 text-primary">
                      {group.rootCategory?.name || 'Uncategorized'}
                    </div>
                  ) : null}

                  {/* Hiển thị danh mục con nếu khác với danh mục gốc */}
                  {group.category?.id !== group.rootCategory?.id && (
                    <div className="font-medium text-sm py-1 px-3 border-b bg-muted/10 pl-5">
                      {group.category?.name}
                    </div>
                  )}

                  {/* Hàng hóa trong danh mục */}
                  {group.items.map(commodity => (
                    <div
                      key={commodity.id}
                      className={`px-4 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground ${value === commodity.id ? 'bg-accent text-accent-foreground font-medium' : ''} ${group.category?.id !== group.rootCategory?.id ? 'pl-6' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(commodity.id);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="flex items-center">
                        <ChevronRight className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>{commodity.name}</span>
                      </div>
                      {commodity.description && (
                        <div className="text-xs text-muted-foreground ml-4">{commodity.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
