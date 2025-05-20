-- standardize-units.sql
-- Script để chuẩn hóa bảng Units
-- Tác giả: Admin IITS
-- Ngày tạo: 2023-11-15

-- 1. Tạo bảng ánh xạ từ đơn vị cũ sang đơn vị chuẩn hóa
CREATE TEMP TABLE unit_mapping (
    old_unit_id UUID,
    old_unit_name TEXT,
    new_unit_id UUID,
    new_unit_name TEXT
);

-- 2. Thêm ánh xạ cho các đơn vị ngày/day
INSERT INTO unit_mapping (old_unit_id, old_unit_name, new_unit_id, new_unit_name)
SELECT id, name,
    CASE
        WHEN name IN ('day', 'days', 'Day(s)(') THEN
            (SELECT id FROM public.units WHERE name = 'Day(s)')
        WHEN name IN ('manday', 'mandays', 'manday]') THEN
            (SELECT id FROM public.units WHERE name = 'Manday(s)')
        WHEN name IN ('ngày côngngày công', 'Ngày công\n(Manday)') THEN
            (SELECT id FROM public.units WHERE name = 'Ngày công')
        WHEN name = 'Ngày\n(Day)' THEN
            (SELECT id FROM public.units WHERE name = 'Ngày')
    END,
    CASE
        WHEN name IN ('day', 'days', 'Day(s)(') THEN 'Day(s)'
        WHEN name IN ('manday', 'mandays', 'manday]') THEN 'Manday(s)'
        WHEN name IN ('ngày côngngày công', 'Ngày công\n(Manday)') THEN 'Ngày công'
        WHEN name = 'Ngày\n(Day)' THEN 'Ngày'
    END
FROM public.units
WHERE name IN ('day', 'days', 'Day(s)(', 'manday', 'mandays', 'manday]',
               'ngày côngngày công', 'Ngày công\n(Manday)', 'Ngày\n(Day)');

-- 3. Thêm ánh xạ cho các đơn vị giờ/hour
INSERT INTO unit_mapping (old_unit_id, old_unit_name, new_unit_id, new_unit_name)
SELECT id, name,
    CASE
        WHEN name IN ('hour', 'hours', 'Hour(s))') THEN
            (SELECT id FROM public.units WHERE name = 'Hour(s)')
    END,
    CASE
        WHEN name IN ('hour', 'hours', 'Hour(s))') THEN 'Hour(s)'
    END
FROM public.units
WHERE name IN ('hour', 'hours', 'Hour(s))');

-- 4. Thêm ánh xạ cho các đơn vị container
INSERT INTO unit_mapping (old_unit_id, old_unit_name, new_unit_id, new_unit_name)
SELECT id, name,
    CASE
        WHEN name IN ('cont', 'Cont)', 'Cont.', 'conts', 'conts)', 'containers', 'CoNl(s)') THEN
            (SELECT id FROM public.units WHERE name = 'Cont(s)')
        WHEN name IN ('x 20 Cont.', 'x 20 cont(s)') THEN
            (SELECT id FROM public.units WHERE name = 'Container 20''')
        WHEN name IN ('X 40 cont(s)') THEN
            (SELECT id FROM public.units WHERE name = 'Container 40''')
    END,
    CASE
        WHEN name IN ('cont', 'Cont)', 'Cont.', 'conts', 'conts)', 'containers', 'CoNl(s)') THEN 'Cont(s)'
        WHEN name IN ('x 20 Cont.', 'x 20 cont(s)') THEN 'Container 20'''
        WHEN name IN ('X 40 cont(s)') THEN 'Container 40'''
    END
FROM public.units
WHERE name IN ('cont', 'Cont)', 'Cont.', 'conts', 'conts)', 'containers', 'CoNl(s)',
               'x 20 Cont.', 'x 20 cont(s)', 'X 40 cont(s)');

-- 5. Thêm ánh xạ cho các đơn vị visit/inspector
INSERT INTO unit_mapping (old_unit_id, old_unit_name, new_unit_id, new_unit_name)
SELECT id, name,
    CASE
        WHEN name = 'Visit' THEN
            (SELECT id FROM public.units WHERE name = 'Visit(s)')
        WHEN name IN ('visit(s)X2inspectors', 'visitsX2inspectors', 'VisitX2inspectors') THEN
            (SELECT id FROM public.units WHERE name = 'Visit x02 Inspectors')
        WHEN name = 'visitX1inspectors' THEN
            (SELECT id FROM public.units WHERE name = 'Visit x01 Inspectors')
        WHEN name IN ('days x 02 inspectors', 'daysx2 inspectors', 'days x 2inspectors', 'daysX2Inspectors') THEN
            (SELECT id FROM public.units WHERE name = 'Days x02 Inspectors')
        WHEN name = 'Attendence(s)' THEN
            (SELECT id FROM public.units WHERE name = 'Attendance')
    END,
    CASE
        WHEN name = 'Visit' THEN 'Visit(s)'
        WHEN name IN ('visit(s)X2inspectors', 'visitsX2inspectors', 'VisitX2inspectors') THEN 'Visit x02 Inspectors'
        WHEN name = 'visitX1inspectors' THEN 'Visit x01 Inspectors'
        WHEN name IN ('days x 02 inspectors', 'daysx2 inspectors', 'days x 2inspectors', 'daysX2Inspectors') THEN 'Days x02 Inspectors'
        WHEN name = 'Attendence(s)' THEN 'Attendance'
    END
FROM public.units
WHERE name IN ('Visit', 'visit(s)X2inspectors', 'visitsX2inspectors', 'VisitX2inspectors', 'visitX1inspectors',
               'days x 02 inspectors', 'daysx2 inspectors', 'days x 2inspectors', 'daysX2Inspectors', 'Attendence(s)');

-- 6. Thêm ánh xạ cho các đơn vị sample/mẫu
INSERT INTO unit_mapping (old_unit_id, old_unit_name, new_unit_id, new_unit_name)
SELECT id, name,
    CASE
        WHEN name IN ('Sample', 'Sample(s))', 'Samples)') THEN
            (SELECT id FROM public.units WHERE name = 'Sample(s)')
    END,
    CASE
        WHEN name IN ('Sample', 'Sample(s))', 'Samples)') THEN 'Sample(s)'
    END
FROM public.units
WHERE name IN ('Sample', 'Sample(s))', 'Samples)');

-- 7. Thêm ánh xạ cho các đơn vị person/người
INSERT INTO unit_mapping (old_unit_id, old_unit_name, new_unit_id, new_unit_name)
SELECT id, name,
    CASE
        WHEN name = 'Person' THEN
            (SELECT id FROM public.units WHERE name = 'Person(s)')
    END,
    CASE
        WHEN name = 'Person' THEN 'Person(s)'
    END
FROM public.units
WHERE name = 'Person';

-- 8. Thêm ánh xạ cho các đơn vị trip/chuyến
INSERT INTO unit_mapping (old_unit_id, old_unit_name, new_unit_id, new_unit_name)
SELECT id, name,
    CASE
        WHEN name = 'trip' THEN
            (SELECT id FROM public.units WHERE name = 'Trip(s)')
    END,
    CASE
        WHEN name = 'trip' THEN 'Trip(s)'
    END
FROM public.units
WHERE name = 'trip';

-- 9. Thêm ánh xạ cho các đơn vị đóng gói
INSERT INTO unit_mapping (old_unit_id, old_unit_name, new_unit_id, new_unit_name)
SELECT id, name,
    CASE
        WHEN name = 'Parcel (s)' THEN
            (SELECT id FROM public.units WHERE name = 'Parcel')
        WHEN name = 'PIECES' THEN
            (SELECT id FROM public.units WHERE name = 'Pcs')
        WHEN name = 'PALLETS' THEN
            (SELECT id FROM public.units WHERE name = 'Pallet(s)')
        WHEN name = 'PACKS' THEN
            (SELECT id FROM public.units WHERE name = 'Package(s)')
    END,
    CASE
        WHEN name = 'Parcel (s)' THEN 'Parcel'
        WHEN name = 'PIECES' THEN 'Pcs'
        WHEN name = 'PALLETS' THEN 'Pallet(s)'
        WHEN name = 'PACKS' THEN 'Package(s)'
    END
FROM public.units
WHERE name IN ('Parcel (s)', 'PIECES', 'PALLETS', 'PACKS');

-- 10. Thêm ánh xạ cho các đơn vị khác
INSERT INTO unit_mapping (old_unit_id, old_unit_name, new_unit_id, new_unit_name)
SELECT id, name,
    CASE
        WHEN name = 'Lần(s)' THEN
            (SELECT id FROM public.units WHERE name = 'Lần')
        WHEN name = 'mtsMts' THEN
            (SELECT id FROM public.units WHERE name = 'MTS')
        WHEN name = 'time' THEN
            (SELECT id FROM public.units WHERE name = 'Time(s)')
    END,
    CASE
        WHEN name = 'Lần(s)' THEN 'Lần'
        WHEN name = 'mtsMts' THEN 'MTS'
        WHEN name = 'time' THEN 'Time(s)'
    END
FROM public.units
WHERE name IN ('Lần(s)', 'mtsMts', 'time');

-- 11. Cập nhật các bản ghi trong bảng invoice_details
UPDATE public.invoice_details
SET unit_id = m.new_unit_id
FROM unit_mapping m
WHERE invoice_details.unit_id = m.old_unit_id;

-- 12. Cập nhật các bản ghi trong bảng order_items
UPDATE public.order_items
SET unit_id = m.new_unit_id
FROM unit_mapping m
WHERE order_items.unit_id = m.old_unit_id;

-- 13. Xóa các đơn vị cũ
DELETE FROM public.units
WHERE id IN (SELECT old_unit_id FROM unit_mapping);

-- 14. Cập nhật mô tả cho các đơn vị
-- Đơn vị thời gian
UPDATE public.units SET description = 'Đơn vị ngày (Day)' WHERE name = 'Day(s)';
UPDATE public.units SET description = 'Đơn vị ngày (tiếng Việt)' WHERE name = 'Ngày';
UPDATE public.units SET description = 'Đơn vị giờ (Hour)' WHERE name = 'Hour(s)';
UPDATE public.units SET description = 'Đơn vị giờ (tiếng Việt)' WHERE name = 'Giờ';
UPDATE public.units SET description = 'Đơn vị ngày công (Man-day)' WHERE name = 'Manday(s)';
UPDATE public.units SET description = 'Đơn vị ngày công (tiếng Việt)' WHERE name = 'Ngày công';
UPDATE public.units SET description = 'Đơn vị đêm (Night)' WHERE name = 'Night(s)';
UPDATE public.units SET description = 'Đơn vị đêm (tiếng Việt)' WHERE name = 'Đêm';
UPDATE public.units SET description = 'Đơn vị tháng (Month)' WHERE name = 'Tháng';
UPDATE public.units SET description = 'Đơn vị ca làm việc (Shift)' WHERE name = 'Shift(s)';
UPDATE public.units SET description = 'Đơn vị thời gian (Time)' WHERE name = 'Time(s)';
UPDATE public.units SET description = 'Ngày làm việc với 2 thanh tra viên' WHERE name = 'Days x02 Inspectors';

-- Đơn vị container
UPDATE public.units SET description = 'Container (viết tắt)' WHERE name = 'Cont(s)';
UPDATE public.units SET description = 'Container 20 feet' WHERE name = 'Container 20''';
UPDATE public.units SET description = 'Container 20 feet Dry Cargo (hàng khô)' WHERE name = 'Container 20'' DC';
UPDATE public.units SET description = 'Container 40 feet' WHERE name = 'Container 40''';
UPDATE public.units SET description = 'Container 40 feet Dry Cargo (hàng khô)' WHERE name = 'Container 40'' DC';
UPDATE public.units SET description = 'Container 40 feet High Cube (cao)' WHERE name = 'Container 40'' HC';
UPDATE public.units SET description = 'Container 40 feet High Quality (chất lượng cao)' WHERE name = 'Container 40'' HQ';
UPDATE public.units SET description = 'Less than Container Load (hàng lẻ)' WHERE name = 'LCL';

-- Đơn vị visit/inspector
UPDATE public.units SET description = 'Lần thăm/kiểm tra (Visit)' WHERE name = 'Visit(s)';
UPDATE public.units SET description = 'Lần thăm/kiểm tra với 1 thanh tra viên' WHERE name = 'Visit x01 Inspectors';
UPDATE public.units SET description = 'Lần thăm/kiểm tra với 2 thanh tra viên' WHERE name = 'Visit x02 Inspectors';
UPDATE public.units SET description = 'Sự tham dự, điểm danh (Attendance)' WHERE name = 'Attendance';

-- Đơn vị pricing types
UPDATE public.units SET description = 'Theo chi phí thực tế (At cost)' WHERE name = 'At cost';
UPDATE public.units SET description = 'Trọn gói (Lumpsum)' WHERE name = 'Lumpsum';
UPDATE public.units SET description = 'Phí tối thiểu (Minimum charge)' WHERE name = 'Mincharge';
UPDATE public.units SET description = 'Phí cố định (Fixed fee - tiếng Việt)' WHERE name = 'Phí cố định';
UPDATE public.units SET description = 'Phí tối thiểu (Minimum charge - tiếng Việt)' WHERE name = 'Phí tối thiểu';
UPDATE public.units SET description = 'Phí trọn gói (Lumpsum - tiếng Việt)' WHERE name = 'Phí trọn gói';

-- Đơn vị sample/mẫu
UPDATE public.units SET description = 'Mẫu (Sample)' WHERE name = 'Sample(s)';
UPDATE public.units SET description = 'Mẫu (tiếng Việt)' WHERE name = 'Mẫu';

-- Đơn vị person/người
UPDATE public.units SET description = 'Người (Person)' WHERE name = 'Person(s)';
UPDATE public.units SET description = 'Người (tiếng Việt)' WHERE name = 'Người';

-- Đơn vị trip/chuyến
UPDATE public.units SET description = 'Chuyến đi (Trip)' WHERE name = 'Trip(s)';
UPDATE public.units SET description = 'Chuyến đi (tiếng Việt)' WHERE name = 'Chuyến';
UPDATE public.units SET description = 'Chuyến khứ hồi (Roundtrip)' WHERE name = 'Roundtrip(s)';
UPDATE public.units SET description = 'Chuyến khứ hồi (tiếng Việt)' WHERE name = 'Chuyến khứ hồi';

-- Đơn vị đóng gói
UPDATE public.units SET description = 'Bao, túi (Bag)' WHERE name = 'Bag(s)';
UPDATE public.units SET description = 'Kiện hàng (Bale)' WHERE name = 'Bale(s)';
UPDATE public.units SET description = 'Bộ (Set - tiếng Việt)' WHERE name = 'Bộ';
UPDATE public.units SET description = 'Hộp (Box)' WHERE name = 'Box(es)';
UPDATE public.units SET description = 'Bó, gói (Bundle)' WHERE name = 'Bundle(s)';
UPDATE public.units SET description = 'Lon, hộp (Can)' WHERE name = 'Can(s)';
UPDATE public.units SET description = 'Thùng carton (Carton)' WHERE name = 'Carton(s)';
UPDATE public.units SET description = 'Thùng, hộp (Case)' WHERE name = 'Case(s)';
UPDATE public.units SET description = 'Vụ việc/Thanh tra viên' WHERE name = 'Case/Inspector';
UPDATE public.units SET description = 'Cuộn (Coil)' WHERE name = 'Coil(s)';
UPDATE public.units SET description = 'Cartons (viết tắt)' WHERE name = 'CTNS';
UPDATE public.units SET description = 'Thùng phuy (Drum)' WHERE name = 'Drum(s)';
UPDATE public.units SET description = 'Khoang hàng (Hold)' WHERE name = 'Hold(s)';
UPDATE public.units SET description = 'Kiện (tiếng Việt)' WHERE name = 'Kiện';
UPDATE public.units SET description = 'Gói hàng (Package)' WHERE name = 'Package(s)';
UPDATE public.units SET description = 'Đôi, cặp (Pair)' WHERE name = 'Pair(s)';
UPDATE public.units SET description = 'Pallet' WHERE name = 'Pallet(s)';
UPDATE public.units SET description = 'Bưu kiện (Parcel)' WHERE name = 'Parcel';
UPDATE public.units SET description = 'Cái, chiếc (Piece)' WHERE name = 'Pcs';
UPDATE public.units SET description = 'Cuộn (Roll)' WHERE name = 'ROLLS';
UPDATE public.units SET description = 'Bao tải (Sack)' WHERE name = 'Sack(s)';
UPDATE public.units SET description = 'Phần, khu vực (Section)' WHERE name = 'Section(s)';
UPDATE public.units SET description = 'Bộ (Set)' WHERE name = 'Set(s)';
UPDATE public.units SET description = 'Lô hàng (Shipment)' WHERE name = 'Shipment';
UPDATE public.units SET description = 'Bồn, thùng (Tank)' WHERE name = 'Tank';

-- Đơn vị đo lường
UPDATE public.units SET description = 'Kilogram (KG)' WHERE name = 'KGS';
UPDATE public.units SET description = 'Kilometer (Km)' WHERE name = 'Km(s)';
UPDATE public.units SET description = 'Metric Tons (Tấn)' WHERE name = 'MTS';
UPDATE public.units SET description = 'Tấn (Metric Tons)' WHERE name = 'Tấn';
UPDATE public.units SET description = 'Thông số (Parameter)' WHERE name = 'Parameter(s)';
UPDATE public.units SET description = 'Liều lượng (Dose)' WHERE name = 'Dose(s)';

-- Đơn vị khác
UPDATE public.units SET description = 'Đơn vị số lượng' WHERE name = '1';
UPDATE public.units SET description = 'Đơn hàng (tiếng Việt)' WHERE name = 'Đơn hàng';
UPDATE public.units SET description = 'Đợt hàng (tiếng Việt)' WHERE name = 'Đợt';
UPDATE public.units SET description = 'Lần (tiếng Việt)' WHERE name = 'Lần';
UPDATE public.units SET description = 'Đơn vị cơ bản (Unit)' WHERE name = 'Unit(s)';
UPDATE public.units SET description = 'Đơn vị mặc định cho dữ liệu thiếu' WHERE name = 'Unknown Unit';
UPDATE public.units SET description = 'Đô la Mỹ (USD)' WHERE name = 'USD';
UPDATE public.units SET description = 'Vụ việc (tiếng Việt)' WHERE name = 'Vụ';

-- 15. Kiểm tra kết quả
SELECT COUNT(*) FROM public.units;
