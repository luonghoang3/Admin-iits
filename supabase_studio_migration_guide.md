# Hướng dẫn xóa bảng commodities.bk thông qua Supabase Studio

## Bước 1: Đăng nhập vào Supabase Studio

1. Truy cập vào Supabase Studio của dự án của bạn
2. Đăng nhập với tài khoản có quyền quản trị

## Bước 2: Xóa ràng buộc khóa ngoại hiện tại

1. Trong Supabase Studio, chọn tab "Table Editor"
2. Tìm và chọn bảng "order_items"
3. Chọn tab "Constraints" hoặc "Foreign Keys"
4. Tìm ràng buộc khóa ngoại "order_items_commodity_id_fkey" trỏ đến bảng "commodities.bk"
5. Nhấn vào biểu tượng xóa (thường là biểu tượng thùng rác) để xóa ràng buộc này
6. Xác nhận xóa ràng buộc

## Bước 3: Thêm ràng buộc khóa ngoại mới đến bảng commodities_new

1. Vẫn trong tab "Constraints" hoặc "Foreign Keys" của bảng "order_items"
2. Nhấn vào nút "Add Foreign Key" hoặc tương tự
3. Điền thông tin cho ràng buộc mới:
   - Column: commodity_id
   - Referenced Table: commodities_new
   - Referenced Column: id
   - On Delete: RESTRICT
   - On Update: NO ACTION (hoặc tùy chọn mặc định)
4. Lưu ràng buộc mới

## Bước 4: Xóa trigger đồng bộ dữ liệu (nếu có)

1. Chọn tab "SQL Editor" hoặc "SQL"
2. Chạy các lệnh SQL sau:

```sql
DROP TRIGGER IF EXISTS sync_commodities_new_to_bk_trigger ON commodities_new;
DROP FUNCTION IF EXISTS sync_commodities_new_to_bk();
```

## Bước 5: Xóa bảng commodities.bk

1. Quay lại tab "Table Editor"
2. Tìm bảng "commodities.bk"
3. Nhấn vào biểu tượng "More" hoặc "..." bên cạnh tên bảng
4. Chọn "Delete table" hoặc "Drop table"
5. Xác nhận xóa bảng

## Bước 6: Kiểm tra lại ràng buộc khóa ngoại

1. Chọn tab "SQL Editor" hoặc "SQL"
2. Chạy lệnh SQL sau để kiểm tra ràng buộc khóa ngoại mới:

```sql
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM
    pg_constraint
WHERE
    contype = 'f'
    AND conrelid::regclass::text = 'order_items';
```

3. Xác nhận rằng ràng buộc khóa ngoại mới đã được tạo đúng, trỏ đến bảng "commodities_new" thay vì "commodities.bk"

## Lưu ý quan trọng

- Đảm bảo sao lưu dữ liệu trước khi thực hiện các thay đổi này
- Thực hiện các thay đổi này trong thời gian ít người sử dụng hệ thống
- Kiểm tra kỹ lưỡng ứng dụng sau khi thực hiện các thay đổi để đảm bảo mọi thứ vẫn hoạt động đúng
