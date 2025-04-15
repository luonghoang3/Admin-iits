-- Script đơn giản để import dữ liệu Agri
-- ID của team Agri
DO $$
DECLARE
    agri_team_id UUID := '26b6ad02-03c0-45ac-9b65-3caeac723829';
BEGIN
    -- 1. Import clients
    INSERT INTO clients (name, address, email, phone, team_ids)
    VALUES 
        ('NGOC PHUONG NAM TRADING COMPANY LIMITED', 'Ấp Long Thạnh, Xã Bình An, Huyện Thủ Thừa, Long An', NULL, '0976487878', ARRAY[agri_team_id]),
        ('BSMI International Inspection Company', NULL, NULL, NULL, ARRAY[agri_team_id]),
        ('VU PHAT INTERNATIONAL CO., LTD', NULL, NULL, NULL, ARRAY[agri_team_id]),
        ('VINAFOOD 1', NULL, NULL, NULL, ARRAY[agri_team_id]),
        ('VISIMEX CORPORATION', NULL, NULL, NULL, ARRAY[agri_team_id]),
        ('JOINT VENTURE COMPANY FOR RICE PRODUCTION, PROCESSING AND EXPORT (V.I.P. LTD)', NULL, NULL, NULL, ARRAY[agri_team_id]),
        ('TIEN GIANG FOOD COMPANY', NULL, NULL, NULL, ARRAY[agri_team_id]),
        ('OLAM GLOBAL AGRI VIETNAM CO., LTD', NULL, NULL, NULL, ARRAY[agri_team_id]),
        ('LE DEVELOPMENTS PTY LTD', NULL, NULL, NULL, ARRAY[agri_team_id]),
        ('VINH PHAT INVESTMENT CORPORATION', NULL, NULL, NULL, ARRAY[agri_team_id])
    ON CONFLICT (name) 
    DO UPDATE SET 
        team_ids = CASE
            WHEN clients.team_ids IS NULL THEN ARRAY[agri_team_id]
            WHEN agri_team_id = ANY(clients.team_ids) THEN clients.team_ids
            ELSE clients.team_ids || ARRAY[agri_team_id]
        END;

    -- 2. Import commodities
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
        ('Black Pepper', NULL)
    ON CONFLICT (name) 
    DO NOTHING;

    -- 3. Import units
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
    ON CONFLICT (name) 
    DO NOTHING;

    -- 4. Import shippers
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
        ('TIGIFOOD', NULL, NULL, NULL)
    ON CONFLICT (name) 
    DO NOTHING;

    -- 5. Import buyers
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
        ('FORTUNE LIBERTY, LLC', NULL, NULL, NULL)
    ON CONFLICT (name) 
    DO NOTHING;

    -- 6. Import some sample orders
    INSERT INTO orders (order_number, client_id, type, team_id, order_date, inspection_place, status)
    VALUES 
        ('LAF25-024', (SELECT id FROM clients WHERE name = 'NGOC PHUONG NAM TRADING COMPANY LIMITED'), 'local', agri_team_id, '2025-04-11', NULL, 'draft'),
        ('LAF25-026', (SELECT id FROM clients WHERE name = 'NGOC PHUONG NAM TRADING COMPANY LIMITED'), 'local', agri_team_id, '2025-04-11', NULL, 'draft'),
        ('LAF25-025', (SELECT id FROM clients WHERE name = 'NGOC PHUONG NAM TRADING COMPANY LIMITED'), 'local', agri_team_id, '2025-04-10', NULL, 'draft'),
        ('LAF25-023', (SELECT id FROM clients WHERE name = 'NGOC PHUONG NAM TRADING COMPANY LIMITED'), 'local', agri_team_id, '2025-04-04', NULL, 'draft')
    ON CONFLICT (order_number) 
    DO NOTHING;

    -- 7. Import order items
    INSERT INTO order_items (order_id, commodity_id, quantity, unit_id, commodity_description)
    VALUES 
        ((SELECT id FROM orders WHERE order_number = 'LAF25-024'), 
         (SELECT id FROM commodities WHERE name = 'RICE 5%'), 
         1, 
         (SELECT id FROM units WHERE name = 'Cont(s)'), 
         'VIETNAM CALROSE RICE 5% BROKEN'),
        ((SELECT id FROM orders WHERE order_number = 'LAF25-026'), 
         (SELECT id FROM commodities WHERE name = 'RICE 5%'), 
         1, 
         (SELECT id FROM units WHERE name = 'Cont(s)'), 
         'VIETNAM JASMINE RICE, 5% BROKEN'),
        ((SELECT id FROM orders WHERE order_number = 'LAF25-025'), 
         (SELECT id FROM commodities WHERE name = 'RICE 5%'), 
         1, 
         (SELECT id FROM units WHERE name = 'Cont(s)'), 
         'VIETNAM ST25 RICE, 5% BROKEN'),
        ((SELECT id FROM orders WHERE order_number = 'LAF25-023'), 
         (SELECT id FROM commodities WHERE name = 'RICE 5%'), 
         2, 
         (SELECT id FROM units WHERE name = 'Cont(s)'), 
         'VIETNAM ST25, 5% BROKEN')
    ON CONFLICT (order_id, commodity_id) 
    DO UPDATE SET
        quantity = EXCLUDED.quantity,
        unit_id = EXCLUDED.unit_id,
        commodity_description = EXCLUDED.commodity_description;
END $$;
