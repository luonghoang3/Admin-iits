# Cấu trúc và Phân chia Trách nhiệm

> **Lưu ý quan trọng**: Tài liệu này được lưu vào bộ nhớ để đảm bảo tính nhất quán trong việc phát triển dự án. Vui lòng tuân thủ các quy tắc được mô tả ở đây khi thêm hoặc sửa đổi mã nguồn.

## Tổng quan

Dự án này sử dụng mô hình phân lớp để tổ chức mã nguồn, với các lớp chính sau:

1. **Lớp truy cập dữ liệu (Data Access Layer)**: `utils/supabase/client.ts`
2. **Lớp dịch vụ (Service Layer)**: `services/orderService.ts`, v.v.
3. **Lớp giao diện người dùng (UI Layer)**: Components, Pages, v.v.

## Phân chia Trách nhiệm

### 1. client.ts (Lớp truy cập dữ liệu cơ bản)

- Cung cấp hàm `createClient()` để tạo kết nối Supabase
- Chứa các hàm tiện ích cơ bản như `fetchNextOrderSequence`
- Quản lý các thực thể không liên quan đến đơn hàng: Users, Teams, Clients, Contacts, Commodities, Units
- Cung cấp các hàm truy vấn cơ bản cho tất cả các thực thể

### 2. orderService.ts (Lớp dịch vụ đơn hàng)

- Sử dụng `createClient()` từ client.ts
- Tập trung vào quản lý đơn hàng và mục đơn hàng
- Sử dụng các hàm tiện ích từ client.ts khi cần thiết (như `fetchNextOrderSequence`)
- Cung cấp giao diện đơn giản hơn cho các thao tác liên quan đến đơn hàng
- Thêm logic nghiệp vụ bổ sung khi cần thiết

## Quy tắc Sử dụng

1. **Các component UI** nên sử dụng các hàm từ lớp dịch vụ (orderService.ts) thay vì truy cập trực tiếp vào lớp dữ liệu (client.ts)
2. **Các hook** nên sử dụng các hàm từ lớp dịch vụ
3. **Các script import/export** có thể sử dụng trực tiếp các hàm từ client.ts

## Lưu ý

- Tránh trùng lặp mã nguồn giữa các file
- Đảm bảo logic nghiệp vụ được tập trung trong lớp dịch vụ
- Khi thêm chức năng mới, hãy tuân thủ cấu trúc phân lớp này

## Kế hoạch phát triển tương lai

Trong tương lai, chúng ta sẽ tiếp tục phân tách các dịch vụ thành các module riêng biệt:

1. **ClientService**: Quản lý khách hàng và liên hệ
2. **InvoiceService**: Quản lý hóa đơn
3. **StaffService**: Quản lý nhân viên
4. **CommodityService**: Quản lý hàng hóa

Mỗi dịch vụ sẽ tuân theo các nguyên tắc phân lớp đã được áp dụng cho OrderService.
