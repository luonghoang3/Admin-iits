-- Script chuyển đổi cấu trúc quản lý hàng hóa
-- Tác giả: AI Assistant
-- Ngày: 19/04/2024

-- Bước 1: Tạo bảng tạm thời để lưu trữ thông tin phân cấp
CREATE TEMPORARY TABLE temp_category_hierarchy AS
SELECT 
    c.id as category_id, 
    c.name as category_name, 
    ch.parent_id,
    parent.name as parent_name,
    ch.level,
    ch.path
FROM categories c
JOIN category_hierarchy ch ON c.id = ch.category_id
LEFT JOIN categories parent ON ch.parent_id = parent.id;

-- Bước 2: Tạo bảng categories_new với cấu trúc mới
CREATE TABLE categories_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bước 3: Chèn dữ liệu từ bảng categories và category_hierarchy vào bảng categories_new
-- Đầu tiên, chèn các danh mục gốc (level = 1)
INSERT INTO categories_new (id, name, description, parent_id, created_at, updated_at)
SELECT 
    c.id, 
    c.name, 
    c.description, 
    NULL as parent_id, 
    c.created_at, 
    c.updated_at
FROM categories c
JOIN category_hierarchy ch ON c.id = ch.category_id
WHERE ch.level = 1;

-- Sau đó, chèn các danh mục con (level > 1)
INSERT INTO categories_new (id, name, description, parent_id, created_at, updated_at)
SELECT 
    c.id, 
    c.name, 
    c.description, 
    ch.parent_id, 
    c.created_at, 
    c.updated_at
FROM categories c
JOIN category_hierarchy ch ON c.id = ch.category_id
WHERE ch.level > 1;

-- Bước 4: Thêm ràng buộc khóa ngoại cho bảng categories_new
ALTER TABLE categories_new 
ADD CONSTRAINT categories_new_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES categories_new(id);

-- Bước 5: Tạo bảng commodities_new với cấu trúc mới
CREATE TABLE commodities_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category_id UUID REFERENCES categories_new(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bước 6: Chèn dữ liệu từ bảng commodities vào bảng commodities_new
-- Sử dụng truy vấn con trực tiếp thay vì bảng tạm thời
INSERT INTO commodities_new (id, name, description, category_id, created_at, updated_at)
SELECT 
    c.id, 
    c.name, 
    c.description, 
    COALESCE(
        -- Ưu tiên danh mục chính (is_primary = true)
        (SELECT category_id FROM commodities_categories 
         WHERE commodity_id = c.id AND is_primary = true
         LIMIT 1),
        -- Nếu không có danh mục chính, lấy danh mục đầu tiên
        (SELECT category_id FROM commodities_categories 
         WHERE commodity_id = c.id
         LIMIT 1)
    ) as category_id,
    c.created_at, 
    c.updated_at
FROM commodities c;

-- Bước 7: Tạo bảng commodities_teams_new với cấu trúc mới
CREATE TABLE commodities_teams_new (
    commodity_id UUID REFERENCES commodities_new(id),
    team_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (commodity_id, team_id)
);

-- Bước 8: Chèn dữ liệu từ bảng commodities_teams vào bảng commodities_teams_new
INSERT INTO commodities_teams_new (commodity_id, team_id, created_at)
SELECT 
    ct.commodity_id, 
    ct.team_id, 
    ct.created_at
FROM commodities_teams ct;

-- Bước 9: Thêm ràng buộc khóa ngoại cho bảng commodities_teams_new
ALTER TABLE commodities_teams_new 
ADD CONSTRAINT commodities_teams_new_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES teams(id);

-- Bước 10: Xử lý ràng buộc khóa ngoại của bảng order_items
-- Tạo bảng tạm thời để lưu trữ dữ liệu order_items
CREATE TEMPORARY TABLE temp_order_items AS
SELECT * FROM order_items;

-- Xóa ràng buộc khóa ngoại của bảng order_items
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_commodity_id_fkey;

-- Bước 11: Đổi tên các bảng cũ
ALTER TABLE categories RENAME TO categories_old;
ALTER TABLE commodities RENAME TO commodities_old;
ALTER TABLE commodities_teams RENAME TO commodities_teams_old;

-- Bước 12: Đổi tên các bảng mới
ALTER TABLE categories_new RENAME TO categories;
ALTER TABLE commodities_new RENAME TO commodities;
ALTER TABLE commodities_teams_new RENAME TO commodities_teams;

-- Bước 13: Thêm lại ràng buộc khóa ngoại cho bảng order_items
ALTER TABLE order_items
ADD CONSTRAINT order_items_commodity_id_fkey
FOREIGN KEY (commodity_id) REFERENCES commodities(id);

-- Bước 14: Xóa các bảng không cần thiết
DROP TABLE IF EXISTS commodities_categories;
DROP TABLE IF EXISTS category_hierarchy;

-- Bước 15: Xóa các bảng tạm thời
DROP TABLE IF EXISTS temp_category_hierarchy;
DROP TABLE IF EXISTS temp_order_items;

-- Bước 16: Xóa các bảng cũ (tùy chọn, có thể giữ lại để backup)
-- DROP TABLE IF EXISTS categories_old;
-- DROP TABLE IF EXISTS commodities_old;
-- DROP TABLE IF EXISTS commodities_teams_old;
