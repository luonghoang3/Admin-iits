# Chuẩn hóa bảng Units

Tài liệu này mô tả các file và cách sử dụng để chuẩn hóa bảng Units trong cơ sở dữ liệu.

## Mục đích

Chuẩn hóa bảng Units nhằm:
- Loại bỏ các đơn vị trùng lặp
- Giữ lại các đơn vị tiếng Anh và tiếng Việt riêng biệt
- Cập nhật mô tả cho các đơn vị
- Cập nhật các bản ghi trong bảng invoice_details và order_items để sử dụng các đơn vị đã chuẩn hóa

## Các file liên quan

### 1. File SQL

- **standardize-units.sql**: File SQL chính để chuẩn hóa bảng Units
  - Tạo bảng ánh xạ từ đơn vị cũ sang đơn vị chuẩn hóa
  - Cập nhật các bản ghi trong bảng invoice_details và order_items
  - Xóa các đơn vị cũ
  - Cập nhật mô tả cho các đơn vị

### 2. File JavaScript

- **run-standardize-units.js**: Script để chạy file SQL chuẩn hóa
  - Tạo bản sao lưu bảng units trước khi chuẩn hóa
  - Thực thi file SQL chuẩn hóa
  - Tạo file log với thông tin về quá trình chuẩn hóa

- **list-units.js**: Script để liệt kê tất cả các đơn vị trong bảng Units
  - Hiển thị ID, tên và mô tả của các đơn vị

- **generate-unit-mapping-cg.js**: Script để tạo file mapping cho unit từ file CG INVOICE.csv
  - Tính toán độ tương đồng giữa các đơn vị
  - Tạo file mapping với các thông tin: old_unit_name, new_unit_id, new_unit_name, similarity, source

- **fix-invoice-units.js**: Script để sửa unit_id trong bảng invoice_details
  - Tạo các đơn vị tính mới nếu cần
  - Cập nhật unit_id cho các chi tiết hóa đơn

### 3. File CSV

- **unit-mapping-cg.csv**: File mapping đơn vị cho team CG
- **unit-mapping-cg-full.csv**: File mapping đơn vị đầy đủ cho team CG
- **unit-mapping-cg-full-updated.csv**: File mapping đơn vị đã cập nhật cho team CG

## Cách sử dụng

### 1. Chuẩn hóa bảng Units

```bash
# Chạy script chuẩn hóa
node run-standardize-units.js
```

Script này sẽ:
- Tạo bản sao lưu bảng units với tên units_backup
- Thực thi file SQL chuẩn hóa
- Tạo file log với thông tin về quá trình chuẩn hóa

### 2. Liệt kê các đơn vị

```bash
# Liệt kê tất cả các đơn vị
node list-units.js
```

### 3. Tạo file mapping cho unit

```bash
# Tạo file mapping cho unit từ file CG INVOICE.csv
node generate-unit-mapping-cg.js
```

### 4. Sửa unit_id trong bảng invoice_details

```bash
# Sửa unit_id trong bảng invoice_details
node fix-invoice-units.js <invoices-csv-path>
```

## Kết quả chuẩn hóa

Sau khi chuẩn hóa, bảng Units sẽ:
- Giảm số lượng bản ghi từ 122 xuống còn 80 (giảm 34%)
- Các đơn vị được tổ chức rõ ràng, dễ tìm kiếm
- Tất cả các đơn vị đều có mô tả rõ ràng
- Vẫn giữ được các đơn vị tiếng Anh và tiếng Việt riêng biệt
- Tất cả các bản ghi trong bảng invoice_details và order_items đã được cập nhật để sử dụng các đơn vị đã chuẩn hóa

## Các nhóm đơn vị đã chuẩn hóa

1. **Đơn vị thời gian**: Day(s), Ngày, Hour(s), Giờ, Manday(s), Ngày công, Night(s), Đêm, Tháng, Shift(s), Time(s)
2. **Đơn vị container**: Cont(s), Container 20', Container 40', Container 20' DC, Container 40' DC, Container 40' HC, Container 40' HQ, LCL
3. **Đơn vị visit/inspector**: Visit(s), Visit x01 Inspectors, Visit x02 Inspectors, Days x02 Inspectors, Attendance
4. **Đơn vị pricing types**: At cost, Lumpsum, Mincharge, Phí cố định, Phí tối thiểu, Phí trọn gói
5. **Đơn vị sample/mẫu**: Sample(s), Mẫu
6. **Đơn vị person/người**: Person(s), Người
7. **Đơn vị trip/chuyến**: Trip(s), Chuyến, Roundtrip(s), Chuyến khứ hồi
8. **Đơn vị đóng gói**: Bag(s), Bale(s), Box(es), Bundle(s), Can(s), Carton(s), Case(s), Coil(s), CTNS, Drum(s), Package(s), Pallet(s), Parcel, Pcs, ROLLS, Sack(s), Set(s), Bộ, Kiện
9. **Đơn vị đo lường**: KGS, Km(s), MTS, Tấn, Parameter(s), Dose(s)
10. **Đơn vị khác**: 1, Đơn hàng, Đợt, Lần, Unit(s), Unknown Unit, USD, Vụ, Hold(s), Section(s), Shipment, Tank

## Lưu ý

- Bản sao lưu bảng units được lưu trong bảng units_backup
- File log được tạo trong thư mục scripts với tên standardize-units-[timestamp].log
- Nếu có lỗi xảy ra trong quá trình chuẩn hóa, hãy kiểm tra file log để biết thêm chi tiết
