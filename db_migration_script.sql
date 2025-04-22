-- Script để cập nhật ràng buộc khóa ngoại và xóa bảng commodities.bk
-- Thực hiện bởi DBA

-- Bước 1: Xóa ràng buộc khóa ngoại hiện tại
ALTER TABLE order_items DROP CONSTRAINT order_items_commodity_id_fkey;

-- Bước 2: Thêm ràng buộc khóa ngoại mới đến bảng commodities_new
ALTER TABLE order_items ADD CONSTRAINT order_items_commodity_id_fkey 
FOREIGN KEY (commodity_id) REFERENCES commodities_new(id) ON DELETE RESTRICT;

-- Bước 3: Xóa trigger đồng bộ dữ liệu (nếu có)
DROP TRIGGER IF EXISTS sync_commodities_new_to_bk_trigger ON commodities_new;
DROP FUNCTION IF EXISTS sync_commodities_new_to_bk();

-- Bước 4: Xóa bảng commodities.bk
DROP TABLE IF EXISTS "commodities.bk";

-- Bước 5: Kiểm tra lại ràng buộc khóa ngoại
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM
    pg_constraint
WHERE
    contype = 'f'
    AND conrelid::regclass::text = 'order_items';
