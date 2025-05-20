-- Script để cập nhật danh mục cho các hàng hóa còn lại
-- Sử dụng các danh mục có sẵn, không tạo thêm danh mục mới

-- Kiểm tra số lượng hàng hóa chưa gán danh mục ban đầu
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 1. Cập nhật các sản phẩm gạo vào danh mục RICE & RICE PRODUCTS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'RICE & RICE PRODUCTS')
WHERE c.category_id IS NULL
AND c.name IN (
    'JASMINE RICE 5%', 'JR 15%', 'JR 5%', 'RICE', 'RICE 15%', 'RICE 5%', 
    'Rice husk pellet', 'WHITE RICE 5%', 'WR 10%', 'WR 15%', 'WR15%', 'WR 25%'
);

-- Kiểm tra kết quả sau bước 1
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 2. Cập nhật các sản phẩm máy tính và văn phòng vào danh mục PAPER & STATIONERY
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'PAPER & STATIONERY')
WHERE c.category_id IS NULL
AND c.name IN (
    'APPLE MACBOOK', 'NOTEBOOKS', 'OFFICE STATIONARY', 'OFFICE SUPPLIER',
    'PAPEL BOND 60 GR EN BOBINAS 28''Y 33', 'PAPEL BOND 75 GMS',
    'Photocopy paper', 'photocopy paper in reams'
);

-- Kiểm tra kết quả sau bước 2
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 3. Cập nhật các sản phẩm y tế vào danh mục MEDICAL & HEALTHCARE PRODUCTS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'MEDICAL & HEALTHCARE PRODUCTS')
WHERE c.category_id IS NULL
AND c.name IN (
    'MEDICAL MASKS', 'Medical Products', 'Medicine', 'PRESERVATIVOS DE LATEX',
    'PROTECTIVE PRODUCTS', 'PERFUMERY & PRODUCTS OF BUCCAL HYGIENE'
);

-- Kiểm tra kết quả sau bước 3
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 4. Cập nhật các sản phẩm nhựa và bao bì vào danh mục PLASTICS & MATERIALS hoặc PACKAGING MATERIALS
-- 4.1 Cập nhật vào PLASTICS & MATERIALS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'PLASTICS & MATERIALS')
WHERE c.category_id IS NULL
AND c.name IN (
    'LLDPE', 'MÀN LDPE', 'PLASTIC', 'PLASTIC PELLET', 'POLIETILENO', 'POLIETINO',
    'PP COIL', 'PVC', 'PLEXLINK 125 GN', 'PLEXTECH'
);

-- Kiểm tra kết quả sau bước 4.1
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 4.2 Cập nhật vào PACKAGING MATERIALS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'PACKAGING MATERIALS')
WHERE c.category_id IS NULL
AND c.name IN (
    'PACKING', 'PACKING ROLL', 'PE BAGS', 'PELICULA DE POLIETILENO BOBINAS', 'PP BAG'
);

-- Kiểm tra kết quả sau bước 4.2
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 5. Cập nhật các sản phẩm nội thất vào danh mục FURNITURE & HOME DECOR
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'FURNITURE & HOME DECOR')
WHERE c.category_id IS NULL
AND c.name IN (
    'METALIC FUNITURE', 'MOBILIARIOS VARIOS', 'MUEBLES SANITARIOS', 'WOODEN, IRON FUNITURE',
    'Mirror and ornament', 'NATURAL RATTAN WITH PITH & RIBBON', 'OILCLOTH FOR DINING TABLE',
    'CURTAIN'
);

-- Kiểm tra kết quả sau bước 5
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 6. Cập nhật các sản phẩm thực phẩm vào danh mục phù hợp
-- 6.1 Cập nhật vào NUTS, SEEDS & LEGUMES
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'NUTS, SEEDS & LEGUMES')
WHERE c.category_id IS NULL
AND c.name IN (
    'Cashew nuts', 'DRIED RAW CASHEW NUTS IN SHELL'
);

-- Kiểm tra kết quả sau bước 6.1
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 6.2 Cập nhật vào SEAFOOD & FISH PRODUCTS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'SEAFOOD & FISH PRODUCTS')
WHERE c.category_id IS NULL
AND c.name IN (
    'Dried Fish Bellies'
);

-- Kiểm tra kết quả sau bước 6.2
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 6.3 Cập nhật vào FRESH PRODUCE
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'FRESH PRODUCE')
WHERE c.category_id IS NULL
AND c.name IN (
    'Grapes'
);

-- Kiểm tra kết quả sau bước 6.3
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 6.4 Cập nhật vào PROCESSED FOODS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'PROCESSED FOODS')
WHERE c.category_id IS NULL
AND c.name IN (
    'PAPAS FRITAS MR. POTATO Y SNACKS DOUBLE DECKER'
);

-- Kiểm tra kết quả sau bước 6.4
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 7. Cập nhật các sản phẩm ngô vào danh mục CORN & CORN PRODUCTS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'CORN & CORN PRODUCTS')
WHERE c.category_id IS NULL
AND c.name IN (
    'Arg Corn', 'Arg.Corn'
);

-- Kiểm tra kết quả sau bước 7
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 8. Cập nhật các sản phẩm lúa mì vào danh mục WHEAT & WHEAT PRODUCTS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'WHEAT & WHEAT PRODUCTS')
WHERE c.category_id IS NULL
AND c.name IN (
    'WBP', 'Wheat Bran pellets', 'WHEAT BRAN PELLETS IN BAG IN CONTAINER', 
    'Wheat Bran pellets in bulk'
);

-- Kiểm tra kết quả sau bước 8
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 9. Cập nhật các sản phẩm vật liệu xây dựng vào danh mục BUILDING MATERIALS & HARDWARE
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'BUILDING MATERIALS & HARDWARE')
WHERE c.category_id IS NULL
AND c.name IN (
    'MDF', 'PIPE', 'PVC DOOR', 'STEEL PIPE'
);

-- Kiểm tra kết quả sau bước 9
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 10. Cập nhật các sản phẩm vật liệu công nghiệp vào danh mục INDUSTRIAL MATERIALS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'INDUSTRIAL MATERIALS')
WHERE c.category_id IS NULL
AND c.name IN (
    'PANEL', 'Seamless Stell', 'fabric', 'Leather'
);

-- Kiểm tra kết quả sau bước 10
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 11. Cập nhật các sản phẩm thiết bị điện vào danh mục ELECTRICAL SUPPLIES & LIGHTING
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'ELECTRICAL SUPPLIES & LIGHTING')
WHERE c.category_id IS NULL
AND c.name IN (
    'LUMINARIAS TECNICAS', 'luminas tecnicas'
);

-- Kiểm tra kết quả sau bước 11
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 12. Cập nhật các sản phẩm thiết bị gia dụng vào danh mục HOME APPLIANCES & ELECTRONICS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'HOME APPLIANCES & ELECTRONICS')
WHERE c.category_id IS NULL
AND c.name IN (
    'MICROWARES'
);

-- Kiểm tra kết quả sau bước 12
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 13. Cập nhật các sản phẩm hóa chất vào danh mục INDUSTRIAL CHEMICALS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'INDUSTRIAL CHEMICALS')
WHERE c.category_id IS NULL
AND c.name IN (
    'PHOTO CHEMISTRY', 'photographic Solutions', 'PEGAMENTO HOT MELT DE CONTRUCCION/ FIJACION'
);

-- Kiểm tra kết quả sau bước 13
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 14. Cập nhật các sản phẩm dầu vào danh mục OILS & FATS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'OILS & FATS')
WHERE c.category_id IS NULL
AND c.name IN (
    'Oil', 'Oil SN 500', 'OLEIN'
);

-- Kiểm tra kết quả sau bước 14
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 15. Cập nhật các sản phẩm khác vào danh mục phù hợp
-- 15.1 Cập nhật vào SHIPPING SERVICES
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'SHIPPING SERVICES')
WHERE c.category_id IS NULL
AND c.name IN (
    'CONTAINER 20''', 'Refrigerated cargo'
);

-- Kiểm tra kết quả sau bước 15.1
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 15.2 Cập nhật vào OTHER AGRICULTURAL PRODUCTS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'OTHER AGRICULTURAL PRODUCTS')
WHERE c.category_id IS NULL
AND c.name IN (
    'bran rice & cassava'
);

-- Kiểm tra kết quả sau bước 15.2
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 15.3 Cập nhật vào PERSONAL CARE & COSMETICS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'PERSONAL CARE & COSMETICS')
WHERE c.category_id IS NULL
AND c.name IN (
    'POWDER DETERGENT'
);

-- Kiểm tra kết quả sau bước 15.3
SELECT COUNT(*) AS remaining_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- 16. Cập nhật hàng hóa không xác định vào danh mục OTHER AGRICULTURAL PRODUCTS
UPDATE public.commodities_new c
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'OTHER AGRICULTURAL PRODUCTS')
WHERE c.category_id IS NULL
AND c.name IN (
    'Unknown Commodity'
);

-- Kiểm tra kết quả cuối cùng
SELECT COUNT(*) AS final_uncategorized FROM public.commodities_new WHERE category_id IS NULL;

-- Liệt kê các hàng hóa vẫn chưa được gán danh mục (nếu còn)
SELECT id, name, description FROM public.commodities_new WHERE category_id IS NULL ORDER BY name;
