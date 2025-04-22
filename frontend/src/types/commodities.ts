// Định nghĩa các types cơ bản cho hàng hóa
export interface Commodity {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  category_id?: string;

  // Thông tin danh mục
  category?: Category | null;
  root_category?: Category | null;

  // Các trường từ nested join
  teams?: Team[];
  commodities?: any; // Để tương thích với các trường cũ
  units?: any; // Để tương thích với các trường cũ
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
