# Import CG Data

Script để import dữ liệu đơn hàng Consumer Goods từ file CSV vào hệ thống.

## Import Orders

Script `import-cg-orders.js` được sử dụng để import dữ liệu đơn hàng từ file CSV `CG data.csv` vào Supabase.

### Cài đặt

```bash
cd scripts
npm install
```

### Sử dụng

```bash
node import-cg-orders.js "CG data.csv"
```

### Đặc điểm của file CSV

File CSV `CG data.csv` có cấu trúc như sau:
- Mỗi dòng đại diện cho một order item
- Các dòng có cùng `order_number` thuộc về cùng một đơn hàng
- File chứa thông tin về khách hàng, người liên hệ, nhà vận chuyển, bên mua, hàng hóa và đơn vị tính

### Xử lý dữ liệu

Script sẽ thực hiện các bước sau:
1. Đọc file CSV
2. Import clients (khách hàng)
3. Import contacts (người liên hệ)
4. Import shippers (nhà vận chuyển)
5. Import buyers (bên mua)
6. Import commodities (hàng hóa)
7. Import units (đơn vị tính)
8. Import orders (đơn hàng)
9. Import order items (chi tiết đơn hàng)

### Xử lý các trường đặc biệt

1. **Định dạng ngày**: Script sẽ chuyển đổi định dạng ngày từ DD/MM/YYYY sang YYYY-MM-DD.
2. **Phân biệt giữa các trường mô tả**:
   - `commodity_name`: Tên hàng hóa, được lưu trong bảng `commodities`
   - `commodity_description`: Mô tả chung về hàng hóa, được lưu trong bảng `commodities`
   - `item_description`: Mô tả chi tiết hàng hóa trong đơn hàng, được lưu trong bảng `order_items` dưới tên trường `commodity_description`

### Lưu ý

- Script sẽ kiểm tra xem dữ liệu đã tồn tại trong cơ sở dữ liệu chưa trước khi tạo mới
- Nếu một bản ghi đã tồn tại, script sẽ cập nhật thông tin thay vì tạo mới
- Script sẽ ghi log quá trình import để bạn có thể theo dõi tiến trình
- Đối với các trường không bắt buộc, bạn có thể để trống

### Xử lý lỗi

Nếu gặp lỗi trong quá trình import, script sẽ:
1. Ghi log lỗi ra console
2. Bỏ qua bản ghi lỗi và tiếp tục với bản ghi tiếp theo
3. Hoàn thành quá trình import với các bản ghi còn lại

### Kiểm tra kết quả

Sau khi import xong, bạn có thể kiểm tra kết quả bằng cách:
1. Đăng nhập vào Supabase Studio
2. Kiểm tra các bảng `clients`, `contacts`, `shippers`, `buyers`, `commodities`, `units`, `orders` và `order_items`
3. Kiểm tra xem dữ liệu đã được import đúng chưa
