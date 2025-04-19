-- Script khôi phục lại cấu trúc cũ
-- Tác giả: AI Assistant
-- Ngày: 19/04/2024

-- Bước 1: Xóa ràng buộc khóa ngoại của bảng order_items
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_commodity_id_fkey;

-- Bước 2: Đổi tên các bảng mới
ALTER TABLE categories RENAME TO categories_new;
ALTER TABLE commodities RENAME TO commodities_new;
ALTER TABLE commodities_teams RENAME TO commodities_teams_new;

-- Bước 3: Đổi tên các bảng cũ
ALTER TABLE categories_old RENAME TO categories;
ALTER TABLE commodities_old RENAME TO commodities;
ALTER TABLE commodities_teams_old RENAME TO commodities_teams;

-- Bước 4: Thêm lại ràng buộc khóa ngoại cho bảng order_items
ALTER TABLE order_items
ADD CONSTRAINT order_items_commodity_id_fkey
FOREIGN KEY (commodity_id) REFERENCES commodities(id);

-- Bước 5: Khôi phục lại các bảng đã xóa (nếu đã xóa)
-- Khôi phục bảng category_hierarchy (nếu đã xóa)
CREATE TABLE IF NOT EXISTS category_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL UNIQUE REFERENCES categories(id),
    parent_id UUID REFERENCES categories(id),
    level INTEGER NOT NULL DEFAULT 1,
    path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Khôi phục bảng commodities_categories (nếu đã xóa)
CREATE TABLE IF NOT EXISTS commodities_categories (
    commodity_id UUID NOT NULL REFERENCES commodities(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (commodity_id, category_id)
);

-- Bước 6: Xóa các bảng mới
DROP TABLE IF EXISTS categories_new;
DROP TABLE IF EXISTS commodities_new;
DROP TABLE IF EXISTS commodities_teams_new;
