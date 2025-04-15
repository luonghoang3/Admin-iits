-- Script để import dữ liệu từ file Data AG.csv vào database
-- ID của team Agri
\set agri_team_id '26b6ad02-03c0-45ac-9b65-3caeac723829'

-- 1. Tạo bảng tạm thời để lưu dữ liệu từ CSV
CREATE TEMP TABLE temp_agri_data (
    order_number TEXT,
    client_name TEXT,
    contact_name TEXT,
    order_type TEXT,
    department TEXT,
    order_date TEXT,
    inspection_place TEXT,
    commodity_name TEXT,
    item_description TEXT,
    quantity TEXT,
    unit_name TEXT,
    client_address TEXT,
    client_email TEXT,
    client_phone TEXT,
    contact_position TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    shipper_name TEXT,
    shipper_address TEXT,
    shipper_email TEXT,
    shipper_phone TEXT,
    buyer_name TEXT,
    buyer_address TEXT,
    buyer_email TEXT,
    buyer_phone TEXT,
    client_ref_code TEXT,
    vessel_carrier TEXT,
    bill_of_lading TEXT,
    bill_of_lading_date TEXT,
    status TEXT,
    notes TEXT,
    commodity_description TEXT,
    unit_description TEXT
);

-- 2. Import dữ liệu từ CSV vào bảng tạm thời
\COPY temp_agri_data FROM 'scripts/Data AG.csv' WITH (FORMAT csv, HEADER true);

-- 3. Import clients
INSERT INTO clients (name, address, email, phone, team_ids)
SELECT DISTINCT 
    client_name, 
    client_address, 
    client_email, 
    client_phone, 
    ARRAY[:'agri_team_id'::UUID]
FROM temp_agri_data
WHERE client_name IS NOT NULL AND client_name != ''
ON CONFLICT (name) 
DO UPDATE SET 
    team_ids = CASE
        WHEN clients.team_ids IS NULL THEN ARRAY[:'agri_team_id'::UUID]
        WHEN :'agri_team_id'::UUID = ANY(clients.team_ids) THEN clients.team_ids
        ELSE clients.team_ids || ARRAY[:'agri_team_id'::UUID]
    END;

-- 4. Import contacts
WITH client_ids AS (
    SELECT id, name FROM clients
)
INSERT INTO contacts (client_id, full_name, position, email, phone)
SELECT DISTINCT 
    c.id, 
    t.contact_name, 
    t.contact_position, 
    t.contact_email, 
    t.contact_phone
FROM temp_agri_data t
JOIN client_ids c ON t.client_name = c.name
WHERE t.contact_name IS NOT NULL AND t.contact_name != ''
ON CONFLICT (client_id, full_name) 
DO UPDATE SET 
    position = EXCLUDED.position,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

-- 5. Import shippers
INSERT INTO shippers (name, address, email, phone)
SELECT DISTINCT 
    shipper_name, 
    shipper_address, 
    shipper_email, 
    shipper_phone
FROM temp_agri_data
WHERE shipper_name IS NOT NULL AND shipper_name != ''
ON CONFLICT (name) 
DO UPDATE SET 
    address = EXCLUDED.address,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

-- 6. Import buyers
INSERT INTO buyers (name, address, email, phone)
SELECT DISTINCT 
    buyer_name, 
    buyer_address, 
    buyer_email, 
    buyer_phone
FROM temp_agri_data
WHERE buyer_name IS NOT NULL AND buyer_name != ''
ON CONFLICT (name) 
DO UPDATE SET 
    address = EXCLUDED.address,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

-- 7. Import commodities
INSERT INTO commodities (name, description)
SELECT DISTINCT 
    commodity_name, 
    commodity_description
FROM temp_agri_data
WHERE commodity_name IS NOT NULL AND commodity_name != ''
ON CONFLICT (name) 
DO UPDATE SET 
    description = EXCLUDED.description;

-- 8. Import units
INSERT INTO units (name, description)
SELECT DISTINCT 
    unit_name, 
    unit_description
FROM temp_agri_data
WHERE unit_name IS NOT NULL AND unit_name != ''
ON CONFLICT (name) 
DO UPDATE SET 
    description = EXCLUDED.description;

-- 9. Import orders
WITH 
client_ids AS (
    SELECT id, name FROM clients
),
contact_ids AS (
    SELECT c.id, c.client_id, c.full_name 
    FROM contacts c
),
shipper_ids AS (
    SELECT id, name FROM shippers
),
buyer_ids AS (
    SELECT id, name FROM buyers
)
INSERT INTO orders (
    order_number, 
    client_id, 
    contact_id, 
    type, 
    team_id, 
    order_date, 
    client_ref_code, 
    shipper_id, 
    buyer_id, 
    vessel_carrier, 
    bill_of_lading, 
    bill_of_lading_date, 
    inspection_place, 
    status, 
    notes
)
SELECT DISTINCT ON (t.order_number)
    t.order_number,
    cl.id,
    co.id,
    LOWER(t.order_type),
    :'agri_team_id'::UUID,
    CASE 
        WHEN t.order_date ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN 
            TO_DATE(t.order_date, 'DD/MM/YYYY')
        ELSE 
            CURRENT_DATE
    END,
    t.client_ref_code,
    s.id,
    b.id,
    t.vessel_carrier,
    t.bill_of_lading,
    CASE 
        WHEN t.bill_of_lading_date ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN 
            TO_DATE(t.bill_of_lading_date, 'DD/MM/YYYY')
        ELSE 
            NULL
    END,
    t.inspection_place,
    COALESCE(LOWER(t.status), 'draft'),
    t.notes
FROM temp_agri_data t
LEFT JOIN client_ids cl ON t.client_name = cl.name
LEFT JOIN contact_ids co ON co.client_id = cl.id AND t.contact_name = co.full_name
LEFT JOIN shipper_ids s ON t.shipper_name = s.name
LEFT JOIN buyer_ids b ON t.buyer_name = b.name
WHERE t.order_number IS NOT NULL AND t.order_number != ''
ON CONFLICT (order_number) 
DO UPDATE SET 
    client_id = EXCLUDED.client_id,
    contact_id = EXCLUDED.contact_id,
    type = EXCLUDED.type,
    team_id = EXCLUDED.team_id,
    order_date = EXCLUDED.order_date,
    client_ref_code = EXCLUDED.client_ref_code,
    shipper_id = EXCLUDED.shipper_id,
    buyer_id = EXCLUDED.buyer_id,
    vessel_carrier = EXCLUDED.vessel_carrier,
    bill_of_lading = EXCLUDED.bill_of_lading,
    bill_of_lading_date = EXCLUDED.bill_of_lading_date,
    inspection_place = EXCLUDED.inspection_place,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes;

-- 10. Import order_items
WITH 
order_ids AS (
    SELECT id, order_number FROM orders
),
commodity_ids AS (
    SELECT id, name FROM commodities
),
unit_ids AS (
    SELECT id, name FROM units
)
INSERT INTO order_items (
    order_id, 
    commodity_id, 
    quantity, 
    unit_id, 
    commodity_description
)
SELECT 
    o.id,
    c.id,
    CAST(NULLIF(t.quantity, '') AS NUMERIC),
    u.id,
    t.item_description
FROM temp_agri_data t
JOIN order_ids o ON t.order_number = o.order_number
JOIN commodity_ids c ON t.commodity_name = c.name
JOIN unit_ids u ON t.unit_name = u.name
WHERE t.commodity_name IS NOT NULL AND t.commodity_name != ''
ON CONFLICT (order_id, commodity_id) 
DO UPDATE SET 
    quantity = EXCLUDED.quantity,
    unit_id = EXCLUDED.unit_id,
    commodity_description = EXCLUDED.commodity_description;

-- 11. Xóa bảng tạm thời
DROP TABLE temp_agri_data;

-- 12. Hiển thị số lượng bản ghi đã import
SELECT 'clients' AS table_name, COUNT(*) AS record_count FROM clients
UNION ALL
SELECT 'contacts' AS table_name, COUNT(*) AS record_count FROM contacts
UNION ALL
SELECT 'shippers' AS table_name, COUNT(*) AS record_count FROM shippers
UNION ALL
SELECT 'buyers' AS table_name, COUNT(*) AS record_count FROM buyers
UNION ALL
SELECT 'commodities' AS table_name, COUNT(*) AS record_count FROM commodities
UNION ALL
SELECT 'units' AS table_name, COUNT(*) AS record_count FROM units
UNION ALL
SELECT 'orders' AS table_name, COUNT(*) AS record_count FROM orders
UNION ALL
SELECT 'order_items' AS table_name, COUNT(*) AS record_count FROM order_items;
