# Import Scripts

Scripts để import dữ liệu từ file CSV vào hệ thống.

## Import Orders

Script `import-orders.js` được sử dụng để import dữ liệu đơn hàng từ file CSV vào Supabase.

### Cài đặt

```bash
cd scripts
npm install
```

### Sử dụng

```bash
npm run import -- /path/to/your/orders.csv
```

### Định dạng CSV

File CSV cần có các cột sau (không cần phải đúng thứ tự):

#### Thông tin khách hàng
- `client_name` (bắt buộc): Tên khách hàng
- `client_address`: Địa chỉ khách hàng
- `client_email`: Email khách hàng
- `client_phone`: Số điện thoại khách hàng
- `client_tax_id`: Mã số thuế khách hàng

#### Thông tin người liên hệ
- `contact_name`: Tên người liên hệ
- `contact_position`: Chức vụ người liên hệ
- `contact_phone`: Số điện thoại người liên hệ
- `contact_email`: Email người liên hệ

#### Thông tin nhà vận chuyển
- `shipper_name`: Tên nhà vận chuyển
- `shipper_address`: Địa chỉ nhà vận chuyển
- `shipper_phone`: Số điện thoại nhà vận chuyển
- `shipper_email`: Email nhà vận chuyển

#### Thông tin bên mua
- `buyer_name`: Tên bên mua
- `buyer_address`: Địa chỉ bên mua
- `buyer_phone`: Số điện thoại bên mua
- `buyer_email`: Email bên mua

#### Thông tin đơn hàng
- `order_number` (bắt buộc): Mã đơn hàng
- `order_type`: Loại đơn hàng (international/local)
- `department`: Bộ phận (marine/agri/consumer_goods)
- `order_date`: Ngày đặt hàng (YYYY-MM-DD)
- `client_ref_code`: Mã tham chiếu của khách hàng
- `vessel_carrier`: Tàu/Carrier
- `bill_of_lading`: Bill of lading
- `bill_of_lading_date`: Ngày bill of lading (YYYY-MM-DD)
- `status`: Trạng thái đơn hàng (draft/confirmed/completed/cancelled)
- `notes`: Ghi chú

#### Thông tin hàng hóa
- `commodity_name` (bắt buộc): Tên hàng hóa
- `commodity_description`: Mô tả hàng hóa
- `quantity`: Số lượng
- `unit_name` (bắt buộc): Tên đơn vị tính
- `unit_description`: Mô tả đơn vị tính
- `item_description`: Mô tả chi tiết hàng hóa

### Lưu ý

- Mỗi dòng trong file CSV sẽ được xử lý như một order item.
- Các dòng có cùng `order_number` sẽ được nhóm lại thành một đơn hàng.
- Script sẽ tự động tạo các bản ghi client, contact, shipper, buyer, commodity, unit nếu chúng chưa tồn tại.
- Nếu một bản ghi đã tồn tại (dựa trên tên), script sẽ sử dụng ID của bản ghi đó thay vì tạo mới.
- Đối với các đơn hàng đã tồn tại (dựa trên `order_number`), script sẽ cập nhật thông tin đơn hàng và các order items.

### Xử lý tiếng Việt

- File CSV nên được lưu với mã hóa UTF-8 để đảm bảo hiển thị đúng các ký tự tiếng Việt.
- Nếu gặp vấn đề với ký tự tiếng Việt, bạn có thể:
  1. Mở file CSV bằng Excel hoặc Google Sheets và lưu lại với mã hóa UTF-8
  2. Sử dụng các công cụ chuyển đổi mã hóa như iconv
  3. Thay thế các ký tự tiếng Việt bằng ký tự không dấu (như trong file mẫu)
- Script đã được cập nhật để xử lý các vấn đề về mã hóa ký tự.

### Ví dụ CSV

```csv
order_number,client_name,contact_name,order_type,department,order_date,commodity_name,quantity,unit_name
IMR25-001,Cong ty A,Nguyen Van A,international,marine,2025-01-01,Gao,1000,Kg
IMR25-001,Cong ty A,Nguyen Van A,international,marine,2025-01-01,Duong,500,Kg
IMR25-002,Cong ty B,Tran Thi B,international,marine,2025-01-02,Ca phe,200,Kg
```

Trong ví dụ trên:
- Sẽ tạo 2 đơn hàng: IMR25-001 và IMR25-002
- Đơn hàng IMR25-001 sẽ có 2 order items: Gao (Gạo) và Duong (Đường)
- Đơn hàng IMR25-002 sẽ có 1 order item: Ca phe (Cà phê)
