// Định nghĩa các types cơ bản cho hàng hóa
export interface Commodity {
  id: string;
  name: string;
  description?: string | null;
  category_id?: string | null;
  created_at?: string;
  updated_at?: string;

  // Các trường từ nested join
  category?: Category | null;
  teams?: Team[];
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
  level?: number;
  path?: string;
  children?: Category[];
  created_at?: string;
  updated_at?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Interface cho cấu trúc cây danh mục
export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

// Interface cho thống kê hàng hóa
export interface CommodityStats {
  totalCommodities: number;
  categorizedCommodities: number;
  uncategorizedCommodities: number;
  commoditiesByCategory: { category_id: string; category_name: string; count: number }[];
  commoditiesByTeam: { team_id: string; team_name: string; count: number }[];
}
