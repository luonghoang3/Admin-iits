-- Script để cập nhật danh mục cho các hàng hóa chưa được gán danh mục
-- Dựa trên bảng đề xuất gộp trong file commodity-mapping-suggestions.csv

-- Tạo bảng tạm để lưu trữ thông tin ánh xạ
CREATE TEMP TABLE commodity_mapping (
    uncategorized_name TEXT,
    standardized_name TEXT,
    category_name TEXT
);

-- Chèn dữ liệu từ file CSV vào bảng tạm (cần thực hiện thủ công hoặc sử dụng COPY command)
-- Dưới đây là một số ví dụ về cách cập nhật category_id cho các hàng hóa chưa gán danh mục

-- 1. Cập nhật danh mục cho các thiết bị điện và điện tử
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'ELECTRICAL SUPPLIES & LIGHTING')
WHERE c.category_id IS NULL
AND c.name IN (
    'ACCESSRIES & ELECTRIC', 'Cable', 'CABLE ELECTRIC', 'CABLE & ELECTRIC ACCESSORIES',
    'Cable Reel', 'Cables', 'Electric Accessories', 'Electrical accessories',
    'ELECTRODUCTO', 'ElECTRONIC MATERIAL', 'Electronic Pipes', 'WIRE & ELECTRIC ACCESSORIES',
    'BATTERIES 6V - 4AH', 'BATERIAS PARA UPS 12V 7A', 'Compact Fl', 'LAMP', 'LED', 'LIGHT', 'Lights'
);

-- 2. Cập nhật danh mục cho các thiết bị gia dụng
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'HOME APPLIANCES & ELECTRONICS')
WHERE c.category_id IS NULL
AND c.name IN (
    'AIR COOLER AND ACCESSORIES', 'Electrical Fans', 'Electric Fan', 'EXHANST FANS',
    'FAN', 'FAN ACCESSORIES', 'Fan and spare parts', 'TABLE FANS',
    'REFRIGATORS', 'REFRIGERATORS & SPARTS', 'REFRIRATORS & SPARE PARTS',
    'SAMSUNG REFRIGERATOR', 'VTB DOMESSTIC REFRIGERATORS',
    'SAMSUNG AUTOMATIC WASHING MACHINES', 'Semi Automatic Washing Machine 4.0 KG Brand LG MOD',
    'Washing Machine (Model-701N)', 'SAMSUNG BRAND TELEVISION', 'TIVI'
);

-- 3. Cập nhật danh mục cho các sản phẩm chăm sóc cá nhân
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'PERSONAL CARE & COSMETICS')
WHERE c.category_id IS NULL
AND c.name IN (
    'BABIES DIAPER', 'BOT GIAT FAMI', 'condom', 'Condoms', 'COSMECTIC', 'DIANA',
    'Detergent', 'DETERGENT BRAND MIO & MIO PLUS', 'FAMI DP',
    'SOAP. BRAND HARMORY', 'soap chip 95/5', 'SOAP NOODLE', 'SOAP NOODLE 95/5',
    'TOILET SOAP CHIPS 85/15', 'TOILET SOAP NOODLE 90/10', 'TOILET SOAP NOODLES',
    'TOILET SOAP[ NOODLES', 'TOOTHBRUSH', 'TOOTHPASTE', 'VIGOR LATEX CONDOM',
    'VIRUTA DE JABBON DE TOCADOR 80/20', 'VIRUTA DE JABON 95/5', 'VIRUTA DE JABON DE TOCADO 80/20',
    'VIRUTA DE JABON DE TOCADO 85/15', 'VIRUTA DE JABÓN DE TOCADOR 80/20',
    'VIRUTA DE JABÓN DE TOCADOR 85/15', 'VIRUTA DE JABÓN DE TOCADOR 90/10',
    'VIRUTA DE JABÓN DE TOCADOR 95/5', 'VIRUTA DE JABON TOCADOR 90/10',
    'VIRUTA DE LAVAR 80/20', 'VIRUTA DE LAVAR 95/5', 'Viruta de Tocado 90/10',
    'VIRUTA DE TOCADO 90/10', 'VIRUTA JABON DE TOCADOR 85/15', 'VIRUTA JABON DE TOCADOR 90/10',
    'LAUNDRY SOAP NOODLES'
);

-- 4. Cập nhật danh mục cho các sản phẩm thực phẩm
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'PROCESSED FOODS')
WHERE c.category_id IS NULL
AND c.name IN (
    'APPROXIMATED 160MT', 'BISCAFUN', 'BISCUITS (TAN TAN)', 'CANDY AND BISCUIT',
    'CANNED SE IN VEGETABLE 425G', 'CHICKEN CASE', 'INSTANT NOODLE',
    'INSTANT SOUP, SAUCES, CONDIMENTS', 'Instant soups vifont brand',
    'KETPCHUP CHOILIMEX', 'NOODLE', 'RICE Noodle AND SOY SAUCE',
    'Rice noodle soup', 'RICHY', 'SLICED PINEAPPLE IN OWN JUICE',
    'Snack', 'SOUPS', 'SOUP VIFON BRAND', 'SOY SAUCE', 'SWEET CHILLI SAUCE 200G & 900G'
);

-- 5. Cập nhật danh mục cho các sản phẩm giấy và văn phòng phẩm
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'PAPER & STATIONERY')
WHERE c.category_id IS NULL
AND c.name IN (
    'ART PAPER MATE 115GSM', 'Bond Paper', 'Bond Paper, Board, Coated',
    'BRIEFCARD BLUISH WHITE 180g', 'BRIEFCARD PAPER', 'BRISTOL CARD',
    'BRITOL BOARD & PAPER', 'CARTULINA BRISTOL 180-250G', 'CARTULINAS OFFSET',
    'DUPLICATOR', 'ENVELOPE', 'PAPER', 'RISO DUPLICATING MACHINE & ACCESSORIES',
    'SINAR CARD', 'SINAR FOLD/ CARD', 'SOURVENIRS', 'SPECIAL PAPER, BOARDS',
    'TABLE ROLL', 'TWO LAYERS TISSUEB PAPER IN COIL 400MM & 300MM', 'WR 5%'
);

-- 6. Cập nhật danh mục cho các sản phẩm dầu và chất béo
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'OILS & FATS')
WHERE c.category_id IS NULL
AND c.name IN (
    'ACEITE OLEINA DE PALMA', 'DEEP FRYINGGOIL ECASOL', 'DEEP FRYING OIL ECASOL',
    'Liquid Fat RBD Palm Olien', 'MARGARINE', 'OLEINA DE PALMA', 'PALM OIL',
    'RBD OLEINA PALMA (CP8)', 'RBD PALM ILEIN', 'RBE', 'Shortening',
    'Shortening & Margarine', 'Shortening & Puff Pastry Magarine'
);

-- 7. Cập nhật danh mục cho các sản phẩm đồ gia dụng
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'HOUSEHOLD ITEMS & KITCHENWARE')
WHERE c.category_id IS NULL
AND c.name IN (
    'ASSORTED GOODS', 'COOKER', 'Cooler with valve', 'home supplies',
    'houseware', 'TBA', 'TOUELS', 'UTENSIL', 'Utiles Del Hogar', 'WATER BOTTLE'
);

-- 8. Cập nhật danh mục cho các sản phẩm nội thất
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'FURNITURE & HOME DECOR')
WHERE c.category_id IS NULL
AND c.name IN (
    'BABIES WALKING CHAIR', 'benches', 'FUNITURE', 'FURNISHER',
    'WOODEN PRODUCT', 'Wooden product (Funiture)'
);

-- 9. Cập nhật danh mục cho các sản phẩm giày dép và phụ kiện
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'FOOTWEAR & ACCESSORIES')
WHERE c.category_id IS NULL
AND c.name IN (
    'FOOTWEAR', 'Handbags', 'Shoes, SLIPPER, BACKPACK & PURSES',
    'SHOES + SLIPPERS', 'Shoes, Wallet', 'Slippers', 'slippers & handbags',
    'SLIPPER & SHOES', 'SPORT FOOTWEAR', 'SPORT SHOE',
    'ZAPATILLAS TEXTILES PARA DAMAS, HOMBRES Y NINOS'
);

-- 10. Cập nhật danh mục cho các sản phẩm hải sản
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'SEAFOOD & FISH PRODUCTS')
WHERE c.category_id IS NULL
AND c.name IN (
    'BASA FILLET', 'BASS FILLET GLACE', 'CANNED TUNA 170G/1,000G',
    'FILETE DE BASA', 'Frozen Pangasius fillet', 'TUNA FISH IN OIL'
);

-- 11. Cập nhật danh mục cho các sản phẩm dệt may
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'TEXTILES & GARMENTS')
WHERE c.category_id IS NULL
AND c.name IN (
    'CHILDREN GARMENT', 'CLOTHES', 'CONFECCIONS', 'GARMENT',
    'Garment for Children', 'GARMENT& IMITATION JEWELLERY',
    'Garments - socks', 'UNDERWEAR & GARMENT', 'VARIOUS TISSUES AND ACCESSORIES'
);

-- 12. Cập nhật danh mục cho các sản phẩm vật liệu xây dựng
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'BUILDING MATERIALS & HARDWARE')
WHERE c.category_id IS NULL
AND c.name IN (
    'BATHROOM ACCESSORI', 'BATHROOM FITTING', 'CERAMIC & MARBLED PAVE AND COVERING',
    'DOOR', 'FOLDING & SCROLLING DOOR', 'PVC Doors', 'PVCWARES',
    'SANITARY WARES', 'SINKS AND ACCESSORIES', 'SLAPS OF TERRA COTTA',
    'TAP', 'TILES GROUT'
);

-- 13. Cập nhật danh mục cho các sản phẩm hóa chất công nghiệp
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'INDUSTRIAL CHEMICALS')
WHERE c.category_id IS NULL
AND c.name IN (
    'ADDITIVES', 'CHEMICAL', 'CHEMICAL PRODUCTS', 'EMULSIFIER PROPYLENE',
    'GLY PHOSATE TECHNICAL 95% (54 MTS)', 'HOT MELT DE CONTRUCCION',
    'REFINE GLYCERINE'
);

-- 14. Cập nhật danh mục cho các sản phẩm vật liệu công nghiệp
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'INDUSTRIAL MATERIALS')
WHERE c.category_id IS NULL
AND c.name IN (
    'Accessories', 'Al rod 9.5mm accoriding to ASTM,Temper H14',
    'Aluminum Wires', 'ALUMIUM WIRES', 'STEEL COIL', 'STEEL PLATE & EQUIPMENT',
    'Steel plates', 'STEEL STRUCTURE', 'STEEL WIRES'
);

-- 15. Cập nhật danh mục cho các sản phẩm nhựa và vật liệu
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'PLASTICS & MATERIALS')
WHERE c.category_id IS NULL
AND c.name IN (
    'ACRYLIC PAINTING', 'AEROFLEX INSULATION', 'BOPP', 'HDPE',
    'RESIN', 'Resinas', 'Resinas de Polietileno Reticulado',
    'Rubber', 'Ruber', 'SIMILI SHEET', 'thermal insulation for pipes'
);

-- 16. Cập nhật danh mục cho các sản phẩm bao bì
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'PACKAGING MATERIALS')
WHERE c.category_id IS NULL
AND c.name IN (
    'BAG', 'PLASTIC BAGS', 'WOVEN POLYPROPYLENE FLOUR BAG WITH PRINTING',
    'Woven PP bag with printed'
);

-- 17. Cập nhật danh mục cho các sản phẩm cà phê và trà
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'COFFEE & TEA')
WHERE c.category_id IS NULL
AND c.name IN (
    'Coffee', 'Instant Coffee G7', 'INTANTS COFFEE G7'
);

-- 18. Cập nhật danh mục cho các sản phẩm ngô
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'CORN & CORN PRODUCTS')
WHERE c.category_id IS NULL
AND c.name IN (
    'Corn'
);

-- 19. Cập nhật danh mục cho các sản phẩm y tế
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'MEDICAL & HEALTHCARE PRODUCTS')
WHERE c.category_id IS NULL
AND c.name IN (
    'BAGS FOR BLOOD. KAWASUMI BRAND', 'Sport Articles'
);

-- 20. Cập nhật danh mục cho các sản phẩm thức ăn chăn nuôi
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'ANIMAL FEED & NUTRITION')
WHERE c.category_id IS NULL
AND c.name IN (
    'RICE BRAN EXTRACTION'
);

-- 21. Cập nhật danh mục cho các sản phẩm thuốc lá
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'TOBACCO PRODUCTS')
WHERE c.category_id IS NULL
AND c.name IN (
    'Raw black - tobacco'
);

-- Kiểm tra kết quả
-- SELECT COUNT(*) FROM public.commodities_new WHERE category_id IS NULL;
