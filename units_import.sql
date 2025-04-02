-- Lệnh SQL để thêm các đơn vị tính vào bảng units
INSERT INTO units (name, description, created_at, updated_at)
VALUES 
    ('Box(es)', 'Hộp', NOW(), NOW()),
    ('Can(s)', 'Lon', NOW(), NOW()),
    ('Carton(s)', 'Thùng carton', NOW(), NOW()),
    ('Case(s)', 'Thùng', NOW(), NOW()),
    ('Coil(s)', 'Cuộn', NOW(), NOW()),
    ('CoNt(s)', 'Container', NOW(), NOW()),
    ('Cont(s)', 'Container', NOW(), NOW()),
    ('Cont(s) x 20''', 'Container 20 feet', NOW(), NOW()),
    ('Cont(s) x 20'' DC', 'Container 20 feet Dry', NOW(), NOW()),
    ('Cont(s) x 40''', 'Container 40 feet', NOW(), NOW()),
    ('Cont(s) x 40'' HC', 'Container 40 feet High Cube', NOW(), NOW()),
    ('Dose(s)', 'Liều lượng', NOW(), NOW()),
    ('Drum(s)', 'Thùng phi', NOW(), NOW()),
    ('KGS', 'Kilogram', NOW(), NOW()),
    ('LCL', 'Less than Container Load', NOW(), NOW()),
    ('Manday(s)', 'Ngày công lao động', NOW(), NOW()),
    ('MTS', 'Metric Ton', NOW(), NOW()),
    ('Ngày công', 'Ngày công lao động', NOW(), NOW()),
    ('Package(s)', 'Gói', NOW(), NOW()),
    ('PACKS', 'Gói hàng', NOW(), NOW()),
    ('Pair(s)', 'Cặp/Đôi', NOW(), NOW()),
    ('Pallet(s)', 'Pallet', NOW(), NOW()),
    ('PALLETS', 'Pallet', NOW(), NOW()),
    ('Sample(s)', 'Mẫu', NOW(), NOW()),
    ('Unit(s)', 'Đơn vị', NOW(), NOW()),
    ('Visit(s)', 'Lần thăm/kiểm tra', NOW(), NOW()),
    ('x 20 Cont(s)', '20 Container', NOW(), NOW());

-- Bạn cũng có thể kiểm tra các đơn vị đã nhập bằng lệnh:
-- SELECT * FROM units ORDER BY name; 