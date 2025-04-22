import { createClient } from '@/utils/supabase/client'
import { Commodity, Category, CategoryWithChildren, Team } from '@/types/commodities'
import logger from '@/lib/logger'

/**
 * Lấy danh sách hàng hóa
 */
export async function fetchCommodities() {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('commodities_new')
      .select(`
        *,
        category:categories_new(*),
        teams:commodities_teams_new(team_id, teams(*))
      `)
      .order('name')

    if (error) throw error

    // Chuyển đổi dữ liệu để phù hợp với interface Commodity
    const commodities = data?.map(item => ({
      ...item,
      category_id: item.category_id,
      category: item.category,
      teams: item.teams?.map((t: any) => t.teams)
    })) || []

    return { commodities, error: null }
  } catch (error: any) {
    logger.error('Error fetching commodities:', error)
    return { commodities: [], error: error.message }
  }
}

/**
 * Lấy chi tiết hàng hóa theo ID
 */
export async function fetchCommodityById(id: string) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('commodities_new')
      .select(`
        *,
        category:categories_new(*),
        teams:commodities_teams_new(team_id, teams(*))
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Chuyển đổi dữ liệu để phù hợp với interface Commodity
    const commodity = {
      ...data,
      category_id: data.category_id,
      category: data.category,
      teams: data.teams?.map((t: any) => t.teams)
    }

    return { commodity, error: null }
  } catch (error: any) {
    logger.error('Error fetching commodity:', error)
    return { commodity: null, error: error.message }
  }
}

/**
 * Tìm kiếm hàng hóa
 */
export async function searchCommodities(query: string) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('commodities_new')
      .select(`
        *,
        category:categories_new(*),
        teams:commodities_teams_new(team_id, teams(*))
      `)
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(20)

    if (error) throw error

    // Chuyển đổi dữ liệu để phù hợp với interface Commodity
    const commodities = data?.map(item => ({
      ...item,
      category_id: item.category_id,
      category: item.category,
      teams: item.teams?.map((t: any) => t.teams)
    })) || []

    return { commodities, error: null }
  } catch (error: any) {
    logger.error('Error searching commodities:', error)
    return { commodities: [], error: error.message }
  }
}

/**
 * Lấy danh sách danh mục
 */
export async function fetchCategories() {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('categories_new')
      .select('*')
      .order('name')

    if (error) throw error

    return { categories: data || [], error: null }
  } catch (error: any) {
    logger.error('Error fetching categories:', error)
    return { categories: [], error: error.message }
  }
}

/**
 * Xây dựng cây phân cấp danh mục
 */
export function buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
  // Tạo map để truy cập nhanh danh mục theo ID
  const categoryMap = new Map<string, CategoryWithChildren>();

  // Khởi tạo các danh mục với mảng children rỗng
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Danh sách các danh mục gốc
  const rootCategories: CategoryWithChildren[] = [];

  // Xây dựng cây
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)!;

    if (category.parent_id) {
      // Nếu có parent_id, thêm vào danh sách children của danh mục cha
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children.push(categoryWithChildren);
      }
    } else {
      // Nếu không có parent_id, đây là danh mục gốc
      rootCategories.push(categoryWithChildren);
    }
  });

  // Sắp xếp các danh mục theo tên
  const sortByName = (a: CategoryWithChildren, b: CategoryWithChildren) => {
    return a.name.localeCompare(b.name);
  };

  // Sắp xếp danh mục gốc
  rootCategories.sort(sortByName);

  // Sắp xếp danh mục con
  const sortChildrenRecursive = (categories: CategoryWithChildren[]) => {
    categories.forEach(category => {
      category.children.sort(sortByName);
      sortChildrenRecursive(category.children);
    });
  };

  sortChildrenRecursive(rootCategories);

  return rootCategories;
}

/**
 * Lấy danh sách đội nhóm
 */
export async function fetchTeams() {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name')

    if (error) throw error

    return { teams: data || [], error: null }
  } catch (error: any) {
    logger.error('Error fetching teams:', error)
    return { teams: [], error: error.message }
  }
}
