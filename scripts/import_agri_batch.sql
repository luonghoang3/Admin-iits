-- Script để import dữ liệu từ file Data AG.csv vào database
-- ID của team Agri
DO $$
DECLARE
    agri_team_id UUID := '26b6ad02-03c0-45ac-9b65-3caeac723829';
BEGIN
    -- 1. Import clients
    INSERT INTO clients (name, address, email, phone, team_ids)
    VALUES 
        ('NGOC PHUONG NAM TRADING COMPANY LIMITED', 'Ấp Long Thạnh, Xã Bình An, Huyện Thủ Thừa, Long An', NULL, '0976487878', ARRAY[agri_team_id]),
        ('BSMI International Inspection Company', 'No. 05, South Sima  St., Yazdanian St., Shariati St., Postal code: 1913813192', NULL, NULL, ARRAY[agri_team_id]),
        ('VU PHAT INTERNATIONAL CO., LTD', '54 Đường số 8, Khu phố 2, P. An Lạc, Q. Bình Tân, TP Hồ Chí Minh', NULL, '+84976487878/ +84937738686', ARRAY[agri_team_id]),
        ('VINAFOOD 1', 'Số 6, Phố Ngô Quyền, Phường Lý Thái Tổ, Quận Hoàn Kiếm, TP. Hà Nội', NULL, '(024) 393 51572', ARRAY[agri_team_id]),
        ('VISIMEX CORPORATION', NULL, NULL, NULL, ARRAY[agri_team_id]),
        ('JOINT VENTURE COMPANY FOR RICE PRODUCTION, PROCESSING AND EXPORT (V.I.P. LTD)', NULL, NULL, NULL, ARRAY[agri_team_id]),
        ('TIEN GIANG FOOD COMPANY', NULL, NULL, NULL, ARRAY[agri_team_id]),
        ('OLAM GLOBAL AGRI VIETNAM CO., LTD', NULL, NULL, NULL, ARRAY[agri_team_id]),
        ('LE DEVELOPMENTS PTY LTD', NULL, NULL, NULL, ARRAY[agri_team_id]),
        ('VINH PHAT INVESTMENT CORPORATION', NULL, NULL, NULL, ARRAY[agri_team_id]),
        ('NHAT TRANG TRADE & TOURISM CO., LTD', 'Tổ 17A, cụm 9, phường Liễu Giai, quận Ba Đình, Thành phố Hà Nội, Việt Nam.', NULL, '(84-4) 628 15 704', ARRAY[agri_team_id]),
        ('SIMEXCO DAKLAK LTD, HCMC BR', '23 Ngô Quyền, Buôn Ma Thuột, Daklak', NULL, '083 842 7293', ARRAY[agri_team_id]),
        ('DU TRU QUOC GIA COMPANY', '46 Tấn Ấp, Ba Đình, Hà Nội', NULL, '043 8292267/ 0913208383', ARRAY[agri_team_id]),
        ('ATAKA & CO., LTD', 'Sanno Grand Bldg, 2-14-2, Nagata-cho, Chiyoda-ku, Tokyo, Japan 100-0014', NULL, '81-3-5510-4455', ARRAY[agri_team_id]),
        ('PETROLEUM TRADING SERVICES CO. LTD', 'Lầu 3, 12 Nam Kỳ Khởi Nghĩa, P. Nguyễn Thái Bình, Q1, TP. HCM', NULL, '083 821 7770', ARRAY[agri_team_id])
    ON CONFLICT DO NOTHING;

    -- 2. Cập nhật team_ids cho clients đã tồn tại
    UPDATE clients c
    SET team_ids = CASE
        WHEN c.team_ids IS NULL THEN ARRAY[agri_team_id]
        WHEN agri_team_id = ANY(c.team_ids) THEN c.team_ids
        ELSE c.team_ids || ARRAY[agri_team_id]
    END
    WHERE c.name IN (
        'NGOC PHUONG NAM TRADING COMPANY LIMITED',
        'BSMI International Inspection Company',
        'VU PHAT INTERNATIONAL CO., LTD',
        'VINAFOOD 1',
        'VISIMEX CORPORATION',
        'JOINT VENTURE COMPANY FOR RICE PRODUCTION, PROCESSING AND EXPORT (V.I.P. LTD)',
        'TIEN GIANG FOOD COMPANY',
        'OLAM GLOBAL AGRI VIETNAM CO., LTD',
        'LE DEVELOPMENTS PTY LTD',
        'VINH PHAT INVESTMENT CORPORATION',
        'NHAT TRANG TRADE & TOURISM CO., LTD',
        'SIMEXCO DAKLAK LTD, HCMC BR',
        'DU TRU QUOC GIA COMPANY',
        'ATAKA & CO., LTD',
        'PETROLEUM TRADING SERVICES CO. LTD'
    );

    -- 3. Import contacts
    INSERT INTO contacts (client_id, full_name, position, email, phone)
    SELECT 
        c.id, 
        contact_name, 
        NULL, 
        NULL, 
        NULL
    FROM (
        VALUES
            ('NGOC PHUONG NAM TRADING COMPANY LIMITED', 'Mr. Vũ'),
            ('BSMI International Inspection Company', 'Ms. Mahjube Zarei'),
            ('VU PHAT INTERNATIONAL CO., LTD', 'Mr. Le Van  Vu'),
            ('VINAFOOD 1', 'Ms. Thảo'),
            ('VINAFOOD 1', 'Mr. Sơn'),
            ('NHAT TRANG TRADE & TOURISM CO., LTD', 'Pham Nguyen Doanh'),
            ('SIMEXCO DAKLAK LTD, HCMC BR', 'Mr. Nhân'),
            ('DU TRU QUOC GIA COMPANY', 'Mr. Lập'),
            ('ATAKA & CO., LTD', 'Mr. Hiroyuki Ikeo'),
            ('PETROLEUM TRADING SERVICES CO. LTD', 'Mr. Nam')
    ) AS data(client_name, contact_name)
    JOIN clients c ON data.client_name = c.name
    ON CONFLICT DO NOTHING;

    -- 4. Import commodities
    INSERT INTO commodities (name, description)
    VALUES 
        ('RICE 5%', NULL),
        ('RICE', NULL),
        ('Coffee', NULL),
        ('JASMINE RICE 5%', NULL),
        ('PEPPER', NULL),
        ('BAGS', NULL),
        ('Rubber', NULL),
        ('WR 5%', NULL),
        ('WR 10%', NULL),
        ('WR 15%', NULL),
        ('Black Pepper', NULL),
        ('White Pepper', NULL)
    ON CONFLICT DO NOTHING;

    -- 5. Import units
    INSERT INTO units (name, description)
    VALUES 
        ('Cont(s)', 'Container'),
        ('MTS', 'Metric Tons'),
        ('Case(s)', 'Cases'),
        ('KGS', 'Kilograms'),
        ('Sample(s)', 'Samples'),
        ('Bag(s)', 'Bags'),
        ('Bale(s)', 'Bales'),
        ('Carton(s)', 'Cartons'),
        ('CTNS', 'Cartons')
    ON CONFLICT DO NOTHING;

    -- 6. Import shippers
    INSERT INTO shippers (name, address, email, phone)
    VALUES 
        ('NGOC PHUONG NAM TRADING COMPANY LIMITED', NULL, NULL, NULL),
        ('SIMEXCO DAKLAK LTD.', NULL, NULL, NULL),
        ('VU PHAT INTERNATIONAL CO., LTD', NULL, NULL, NULL),
        ('VINAFOOD 1', NULL, NULL, NULL),
        ('VISIMEX CORPORATION', NULL, NULL, NULL),
        ('TBA', NULL, NULL, NULL),
        ('JOINT VENTURE COMPANY FOR RICE PRODUCTION, PROCESSING AND EXPORT (V.I.P. LTD)', NULL, NULL, NULL),
        ('VIETNAM SOUTHERN FOOD CORPORATION', NULL, NULL, NULL),
        ('VIP', NULL, NULL, NULL),
        ('TIGIFOOD', NULL, NULL, NULL),
        ('DAKMAN - DAKLAK', NULL, NULL, NULL),
        ('NHAT TRANG TRADE & TOURISM CO., LTD', NULL, NULL, NULL),
        ('SIMEXCO DAKLAK LTD', NULL, NULL, NULL),
        ('ATAKA & CO., LTD', NULL, NULL, NULL),
        ('PETROLEUM TRADING SERVICES CO. LTD', NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;

    -- 7. Import buyers
    INSERT INTO buyers (name, address, email, phone)
    VALUES 
        ('UNICONCEPT TRADING FZ-LLC', NULL, NULL, NULL),
        ('TRUST me s.r.o.', NULL, NULL, NULL),
        ('OWNER DO VAN HUNG IM-UND EXPORT SOWIE GROßHANDLER MIT LEBENSMITTELN', NULL, NULL, NULL),
        ('RICE BROS, LLC', NULL, NULL, NULL),
        ('HA LONG FOOD KFT', NULL, NULL, NULL),
        ('MERCHANT AFFINITY GROUP LE SHOP', NULL, NULL, NULL),
        ('AUSFOODLAND PTY LTD', NULL, NULL, NULL),
        ('ORCA GmbH', NULL, NULL, NULL),
        ('GOLDEN SEED GRAIN TRADING LLC.', NULL, NULL, NULL),
        ('FORTUNE LIBERTY, LLC', NULL, NULL, NULL),
        ('GEPROCOR', NULL, NULL, NULL),
        ('CUBAEXPORT', NULL, NULL, NULL),
        ('SEOW GUAN CO., (PTE) LTD', NULL, NULL, NULL),
        ('ALIMPORT', NULL, NULL, NULL),
        ('TBA', NULL, NULL, NULL),
        ('ROYAL GOLDEN TRADING LLC', NULL, NULL, NULL),
        ('DAO HEUYEN GRUP IN PAKS LAOS', NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;

    -- 8. Import orders
    -- LAF11-004
    INSERT INTO orders (
        order_number, 
        client_id, 
        contact_id, 
        type, 
        team_id, 
        order_date, 
        inspection_place, 
        vessel_carrier, 
        client_ref_code, 
        shipper_id, 
        buyer_id, 
        inspection_date_started,
        inspection_date_completed,
        status
    )
    VALUES (
        'LAF11-004',
        (SELECT id FROM clients WHERE name = 'BSMI International Inspection Company'),
        (SELECT id FROM contacts WHERE client_id = (SELECT id FROM clients WHERE name = 'BSMI International Inspection Company') AND full_name = 'Ms. Mahjube Zarei'),
        'local',
        agri_team_id,
        '2011-02-15',
        NULL,
        'CONTS',
        'Purchase contract: DM10R2UNW110110',
        (SELECT id FROM shippers WHERE name = 'DAKMAN - DAKLAK'),
        (SELECT id FROM buyers WHERE name = 'GEPROCOR'),
        '2011-02-16',
        '2011-02-18',
        'draft'
    )
    ON CONFLICT DO NOTHING;

    -- LAF11-003
    INSERT INTO orders (
        order_number, 
        client_id, 
        contact_id, 
        type, 
        team_id, 
        order_date, 
        inspection_place, 
        vessel_carrier, 
        shipper_id, 
        buyer_id, 
        inspection_date_started,
        inspection_date_completed,
        status
    )
    VALUES (
        'LAF11-003',
        (SELECT id FROM clients WHERE name = 'NHAT TRANG TRADE & TOURISM CO., LTD'),
        (SELECT id FROM contacts WHERE client_id = (SELECT id FROM clients WHERE name = 'NHAT TRANG TRADE & TOURISM CO., LTD') AND full_name = 'Pham Nguyen Doanh'),
        'local',
        agri_team_id,
        '2011-01-26',
        'ORIENTAL COFFEE-BINH DUONG',
        'CONTS',
        (SELECT id FROM shippers WHERE name = 'NHAT TRANG TRADE & TOURISM CO., LTD'),
        (SELECT id FROM buyers WHERE name = 'CUBAEXPORT'),
        '2011-01-27',
        '2011-01-29',
        'draft'
    )
    ON CONFLICT DO NOTHING;

    -- LAF11-002
    INSERT INTO orders (
        order_number, 
        client_id, 
        contact_id, 
        type, 
        team_id, 
        order_date, 
        inspection_place, 
        vessel_carrier, 
        shipper_id, 
        buyer_id, 
        inspection_date_started,
        inspection_date_completed,
        status
    )
    VALUES (
        'LAF11-002',
        (SELECT id FROM clients WHERE name = 'SIMEXCO DAKLAK LTD, HCMC BR'),
        (SELECT id FROM contacts WHERE client_id = (SELECT id FROM clients WHERE name = 'SIMEXCO DAKLAK LTD, HCMC BR') AND full_name = 'Mr. Nhân'),
        'local',
        agri_team_id,
        '2011-01-11',
        'BUON MA THUOT',
        'CONTS',
        (SELECT id FROM shippers WHERE name = 'SIMEXCO DAKLAK LTD'),
        (SELECT id FROM buyers WHERE name = 'SEOW GUAN CO., (PTE) LTD'),
        '2011-01-12',
        '2011-01-14',
        'draft'
    )
    ON CONFLICT DO NOTHING;

    -- LAF11-001
    INSERT INTO orders (
        order_number, 
        client_id, 
        contact_id, 
        type, 
        team_id, 
        order_date, 
        inspection_place, 
        vessel_carrier, 
        client_ref_code, 
        shipper_id, 
        buyer_id, 
        status
    )
    VALUES (
        'LAF11-001',
        (SELECT id FROM clients WHERE name = 'VINAFOOD 1'),
        (SELECT id FROM contacts WHERE client_id = (SELECT id FROM clients WHERE name = 'VINAFOOD 1') AND full_name = 'Mr. Sơn'),
        'local',
        agri_team_id,
        '2011-01-05',
        'SAI GON PORT',
        '"LUCKY STAR"',
        'CMi1101-0025',
        (SELECT id FROM shippers WHERE name = 'VINAFOOD 1'),
        (SELECT id FROM buyers WHERE name = 'ALIMPORT'),
        'draft'
    )
    ON CONFLICT DO NOTHING;

    -- LAF10-005
    INSERT INTO orders (
        order_number, 
        client_id, 
        contact_id, 
        type, 
        team_id, 
        order_date, 
        vessel_carrier, 
        shipper_id, 
        buyer_id, 
        status
    )
    VALUES (
        'LAF10-005',
        (SELECT id FROM clients WHERE name = 'BSMI International Inspection Company'),
        (SELECT id FROM contacts WHERE client_id = (SELECT id FROM clients WHERE name = 'BSMI International Inspection Company') AND full_name = 'Ms. Mahjube Zarei'),
        'local',
        agri_team_id,
        '2010-02-09',
        'CONTS',
        (SELECT id FROM shippers WHERE name = 'THE TAY NGUYEN COFFEE INVESTMENT IMPORT-EXPORT'),
        (SELECT id FROM buyers WHERE name = 'GEPROCOR'),
        'draft'
    )
    ON CONFLICT DO NOTHING;

    -- LAF10-004
    INSERT INTO orders (
        order_number, 
        client_id, 
        contact_id, 
        type, 
        team_id, 
        order_date, 
        vessel_carrier, 
        shipper_id, 
        buyer_id, 
        status
    )
    VALUES (
        'LAF10-004',
        (SELECT id FROM clients WHERE name = 'PETROLEUM TRADING SERVICES CO. LTD'),
        (SELECT id FROM contacts WHERE client_id = (SELECT id FROM clients WHERE name = 'PETROLEUM TRADING SERVICES CO. LTD') AND full_name = 'Mr. Nam'),
        'local',
        agri_team_id,
        '2010-02-03',
        'CONT.',
        (SELECT id FROM shippers WHERE name = 'PETROLEUM TRADING SERVICES CO. LTD'),
        (SELECT id FROM buyers WHERE name = 'ROYAL GOLDEN TRADING LLC'),
        'draft'
    )
    ON CONFLICT DO NOTHING;

    -- LAF10-003
    INSERT INTO orders (
        order_number, 
        client_id, 
        contact_id, 
        type, 
        team_id, 
        order_date, 
        vessel_carrier, 
        shipper_id, 
        buyer_id, 
        status
    )
    VALUES (
        'LAF10-003',
        (SELECT id FROM clients WHERE name = 'VINAFOOD 1'),
        (SELECT id FROM contacts WHERE client_id = (SELECT id FROM clients WHERE name = 'VINAFOOD 1') AND full_name = 'Mr. Sơn'),
        'local',
        agri_team_id,
        '2010-01-14',
        '"HAI CHANG"',
        (SELECT id FROM shippers WHERE name = 'VINAFOOD 1'),
        (SELECT id FROM buyers WHERE name = 'CUBAEXPORT'),
        'draft'
    )
    ON CONFLICT DO NOTHING;

    -- IAF10-001
    INSERT INTO orders (
        order_number, 
        client_id, 
        contact_id, 
        type, 
        team_id, 
        order_date, 
        inspection_place, 
        vessel_carrier, 
        shipper_id, 
        buyer_id, 
        status
    )
    VALUES (
        'IAF10-001',
        (SELECT id FROM clients WHERE name = 'ATAKA & CO., LTD'),
        (SELECT id FROM contacts WHERE client_id = (SELECT id FROM clients WHERE name = 'ATAKA & CO., LTD') AND full_name = 'Mr. Hiroyuki Ikeo'),
        'international',
        agri_team_id,
        '2010-01-08',
        'Pakse Laos, Dao Heuyeng Processing Factory',
        'CONTS',
        (SELECT id FROM shippers WHERE name = 'ATAKA & CO., LTD'),
        (SELECT id FROM buyers WHERE name = 'DAO HEUYEN GRUP IN PAKS LAOS'),
        'draft'
    )
    ON CONFLICT DO NOTHING;

    -- LAF10-002
    INSERT INTO orders (
        order_number, 
        client_id, 
        contact_id, 
        type, 
        team_id, 
        order_date, 
        vessel_carrier, 
        shipper_id, 
        buyer_id, 
        status
    )
    VALUES (
        'LAF10-002',
        (SELECT id FROM clients WHERE name = 'VINAFOOD 1'),
        (SELECT id FROM contacts WHERE client_id = (SELECT id FROM clients WHERE name = 'VINAFOOD 1') AND full_name = 'Mr. Sơn'),
        'local',
        agri_team_id,
        '2010-01-04',
        '"DIAMOND STAR"',
        (SELECT id FROM shippers WHERE name = 'VINAFOOD 1'),
        (SELECT id FROM buyers WHERE name = 'CUBAEXPORT'),
        'draft'
    )
    ON CONFLICT DO NOTHING;

    -- LAF10-001
    INSERT INTO orders (
        order_number, 
        client_id, 
        contact_id, 
        type, 
        team_id, 
        order_date, 
        vessel_carrier, 
        shipper_id, 
        buyer_id, 
        status
    )
    VALUES (
        'LAF10-001',
        (SELECT id FROM clients WHERE name = 'DU TRU QUOC GIA COMPANY'),
        (SELECT id FROM contacts WHERE client_id = (SELECT id FROM clients WHERE name = 'DU TRU QUOC GIA COMPANY') AND full_name = 'Mr. Lập'),
        'local',
        agri_team_id,
        '2010-01-02',
        'CONTS',
        (SELECT id FROM shippers WHERE name = 'SIMEXCO DAKLAK LTD.'),
        (SELECT id FROM buyers WHERE name = 'TBA'),
        'draft'
    )
    ON CONFLICT DO NOTHING;

    -- 9. Import order items
    -- LAF11-004
    INSERT INTO order_items (
        order_id, 
        commodity_id, 
        quantity, 
        unit_id, 
        commodity_description
    )
    VALUES (
        (SELECT id FROM orders WHERE order_number = 'LAF11-004'),
        (SELECT id FROM commodities WHERE name = 'Coffee'),
        180,
        (SELECT id FROM units WHERE name = 'MTS'),
        'VIETNAM ROBUSTA UNWASHED - GRADE 2'
    )
    ON CONFLICT DO NOTHING;

    -- LAF11-003
    INSERT INTO order_items (
        order_id, 
        commodity_id, 
        quantity, 
        unit_id, 
        commodity_description
    )
    VALUES (
        (SELECT id FROM orders WHERE order_number = 'LAF11-003'),
        (SELECT id FROM commodities WHERE name = 'Coffee'),
        90,
        (SELECT id FROM units WHERE name = 'MTS'),
        'GREEN COFFEE'
    )
    ON CONFLICT DO NOTHING;

    -- LAF11-002
    INSERT INTO order_items (
        order_id, 
        commodity_id, 
        quantity, 
        unit_id, 
        commodity_description
    )
    VALUES (
        (SELECT id FROM orders WHERE order_number = 'LAF11-002'),
        (SELECT id FROM commodities WHERE name = 'White Pepper'),
        18,
        (SELECT id FROM units WHERE name = 'MTS'),
        'White Pepper'
    )
    ON CONFLICT DO NOTHING;

    -- LAF11-001
    INSERT INTO order_items (
        order_id, 
        commodity_id, 
        quantity, 
        unit_id, 
        commodity_description
    )
    VALUES (
        (SELECT id FROM orders WHERE order_number = 'LAF11-001'),
        (SELECT id FROM commodities WHERE name = 'WR 15%'),
        21700,
        (SELECT id FROM units WHERE name = 'MTS'),
        'WHITE RICE 15%'
    )
    ON CONFLICT DO NOTHING;

    -- LAF10-005
    INSERT INTO order_items (
        order_id, 
        commodity_id, 
        quantity, 
        unit_id, 
        commodity_description
    )
    VALUES (
        (SELECT id FROM orders WHERE order_number = 'LAF10-005'),
        (SELECT id FROM commodities WHERE name = 'Coffee'),
        10,
        (SELECT id FROM units WHERE name = 'Cont(s)'),
        'COFFEE'
    )
    ON CONFLICT DO NOTHING;

    -- LAF10-004
    INSERT INTO order_items (
        order_id, 
        commodity_id, 
        quantity, 
        unit_id, 
        commodity_description
    )
    VALUES (
        (SELECT id FROM orders WHERE order_number = 'LAF10-004'),
        (SELECT id FROM commodities WHERE name = 'PEPPER'),
        26,
        (SELECT id FROM units WHERE name = 'MTS'),
        'BLACK & WHITE PEPPER'
    )
    ON CONFLICT DO NOTHING;

    -- LAF10-003
    INSERT INTO order_items (
        order_id, 
        commodity_id, 
        quantity, 
        unit_id, 
        commodity_description
    )
    VALUES (
        (SELECT id FROM orders WHERE order_number = 'LAF10-003'),
        (SELECT id FROM commodities WHERE name = 'WR 15%'),
        23500,
        (SELECT id FROM units WHERE name = 'MTS'),
        'WHITE RICE 15%'
    )
    ON CONFLICT DO NOTHING;

    -- IAF10-001
    INSERT INTO order_items (
        order_id, 
        commodity_id, 
        quantity, 
        unit_id, 
        commodity_description
    )
    VALUES (
        (SELECT id FROM orders WHERE order_number = 'IAF10-001'),
        (SELECT id FROM commodities WHERE name = 'Coffee'),
        35,
        (SELECT id FROM units WHERE name = 'MTS'),
        'COFFEE'
    )
    ON CONFLICT DO NOTHING;

    -- LAF10-002
    INSERT INTO order_items (
        order_id, 
        commodity_id, 
        quantity, 
        unit_id, 
        commodity_description
    )
    VALUES (
        (SELECT id FROM orders WHERE order_number = 'LAF10-002'),
        (SELECT id FROM commodities WHERE name = 'WR 15%'),
        26250,
        (SELECT id FROM units WHERE name = 'MTS'),
        'WHITE RICE 15%'
    )
    ON CONFLICT DO NOTHING;

    -- LAF10-001
    INSERT INTO order_items (
        order_id, 
        commodity_id, 
        quantity, 
        unit_id, 
        commodity_description
    )
    VALUES (
        (SELECT id FROM orders WHERE order_number = 'LAF10-001'),
        (SELECT id FROM commodities WHERE name = 'WR 15%'),
        3000,
        (SELECT id FROM units WHERE name = 'MTS'),
        'WHITE RICE 15%'
    )
    ON CONFLICT DO NOTHING;
END $$;
