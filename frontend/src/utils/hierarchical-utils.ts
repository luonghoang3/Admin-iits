import { Commodity, Category, CategoryWithChildren } from '@/types/commodities';
import { HierarchicalComboboxItem } from '@/components/ui/hierarchical-combobox';

/**
 * Xây dựng cấu trúc cây danh mục
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
 * Xây dựng danh sách phẳng các mục cho HierarchicalCombobox từ cây danh mục và hàng hóa
 */
export function buildHierarchicalItems(
  categories: CategoryWithChildren[],
  commodities: Commodity[],
  includeCategories: boolean = true,
  level: number = 0
): HierarchicalComboboxItem[] {
  let items: HierarchicalComboboxItem[] = [];

  // Thêm các danh mục vào danh sách
  categories.forEach(category => {
    // Thêm danh mục nếu cần
    if (includeCategories) {
      items.push({
        value: `category-${category.id}`,
        label: category.name,
        description: category.description || undefined,
        level,
        isCategory: true,
        disabled: true // Không thể chọn danh mục, chỉ có thể chọn hàng hóa
      });
    }

    // Thêm các hàng hóa thuộc danh mục này
    const categoryCommodities = commodities.filter(c => c.category_id === category.id);
    categoryCommodities.forEach(commodity => {
      items.push({
        value: commodity.id,
        label: commodity.name,
        description: commodity.description || undefined,
        level: level + 1,
        isCategory: false,
        categoryId: category.id
      });
    });

    // Đệ quy cho các danh mục con
    if (category.children && category.children.length > 0) {
      items = items.concat(
        buildHierarchicalItems(category.children, commodities, includeCategories, level + 1)
      );
    }
  });

  // Thêm các hàng hóa không thuộc danh mục nào
  if (level === 0) {
    const uncategorizedCommodities = commodities.filter(c => !c.category_id);
    if (uncategorizedCommodities.length > 0 && includeCategories) {
      items.push({
        value: 'category-uncategorized',
        label: 'Uncategorized',
        level: 0,
        isCategory: true,
        disabled: true
      });

      uncategorizedCommodities.forEach(commodity => {
        items.push({
          value: commodity.id,
          label: commodity.name,
          description: commodity.description || undefined,
          level: 1,
          isCategory: false
        });
      });
    }
  }

  return items;
}

/**
 * Lọc danh sách phẳng các mục theo từ khóa tìm kiếm
 */
export function filterHierarchicalItems(
  items: HierarchicalComboboxItem[],
  searchTerm: string
): HierarchicalComboboxItem[] {
  if (!searchTerm) return items;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  // Lọc các mục phù hợp với từ khóa tìm kiếm
  return items.filter(item => 
    item.label.toLowerCase().includes(lowerSearchTerm) || 
    (item.description && item.description.toLowerCase().includes(lowerSearchTerm))
  );
}
