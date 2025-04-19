# Hướng dẫn chuyển đổi cấu trúc quản lý hàng hóa

## Tổng quan

Tài liệu này mô tả quá trình chuyển đổi cấu trúc quản lý hàng hóa từ mô hình hiện tại sang mô hình mới đơn giản hơn. Mô hình mới sẽ:

1. Loại bỏ bảng `category_hierarchy` và sử dụng trường `parent_id` trong bảng `categories` để quản lý phân cấp
2. Loại bỏ bảng `commodities_categories` và sử dụng trường `category_id` trong bảng `commodities` để tham chiếu trực tiếp đến danh mục
3. Chuyển từ mối quan hệ nhiều-nhiều (N-N) sang mối quan hệ một-nhiều (1-N) giữa danh mục và hàng hóa

## Cấu trúc mới

### Bảng `categories`

- `id` (UUID): Khóa chính, tự động tạo
- `name` (text): Tên danh mục, không được null và phải duy nhất
- `description` (text): Mô tả danh mục, có thể null
- `parent_id` (UUID): Tham chiếu đến danh mục cha, có thể null (nếu là danh mục gốc)
- `created_at` (timestamp): Thời gian tạo, mặc định là thời gian hiện tại
- `updated_at` (timestamp): Thời gian cập nhật, mặc định là thời gian hiện tại

### Bảng `commodities`

- `id` (UUID): Khóa chính, tự động tạo
- `name` (text): Tên hàng hóa, không được null và phải duy nhất
- `description` (text): Mô tả hàng hóa, có thể null
- `category_id` (UUID): Tham chiếu đến danh mục, có thể null
- `created_at` (timestamp): Thời gian tạo, mặc định là thời gian hiện tại
- `updated_at` (timestamp): Thời gian cập nhật, mặc định là thời gian hiện tại

### Bảng `commodities_teams`

- `commodity_id` (UUID): Tham chiếu đến hàng hóa, không được null
- `team_id` (UUID): Tham chiếu đến đội nhóm, không được null
- `created_at` (timestamp): Thời gian tạo, mặc định là thời gian hiện tại
- Khóa chính: (`commodity_id`, `team_id`)

## Các bước triển khai

### Trước khi triển khai

1. Sao lưu cơ sở dữ liệu
2. Kiểm tra script chuyển đổi trong môi trường phát triển hoặc kiểm thử

### Triển khai

1. Chạy script `migration_script.sql` để thực hiện chuyển đổi
2. Kiểm tra dữ liệu sau khi chuyển đổi
3. Cập nhật mã nguồn để sử dụng cấu trúc mới

### Khôi phục (nếu cần)

Nếu có vấn đề xảy ra trong quá trình chuyển đổi, chạy script `rollback_script.sql` để khôi phục lại cấu trúc cũ.

## Cập nhật mã nguồn

Sau khi chuyển đổi cơ sở dữ liệu, cần cập nhật mã nguồn để sử dụng cấu trúc mới:

1. Cập nhật các truy vấn liên quan đến danh mục và hàng hóa
2. Cập nhật các hàm xây dựng cây phân cấp danh mục
3. Cập nhật giao diện người dùng để hiển thị cây phân cấp danh mục

## Lưu ý

- Quá trình chuyển đổi sẽ giữ nguyên ID của các danh mục và hàng hóa
- Mỗi hàng hóa sẽ chỉ thuộc một danh mục (danh mục chính hoặc danh mục đầu tiên nếu không có danh mục chính)
- Các bảng cũ sẽ được đổi tên thành `categories_old`, `commodities_old` và `commodities_teams_old` để backup
- Các bảng `commodities_categories` và `category_hierarchy` sẽ bị xóa
