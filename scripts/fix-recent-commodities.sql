-- Script để điều chỉnh các hàng hóa không chuẩn được tạo trong ngày hôm nay
-- Dựa trên ngày tạo và tên/mô tả không phù hợp với danh mục

-- 1. Điều chỉnh APPLE MACBOOK từ PAPER & STATIONERY sang HOME APPLIANCES & ELECTRONICS
UPDATE public.commodities_new
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'HOME APPLIANCES & ELECTRONICS')
WHERE name = 'APPLE MACBOOK'
AND DATE(created_at) = CURRENT_DATE;

-- 2. Điều chỉnh RICE với mô tả "RICE BRAN EXTRACTION" từ RICE & RICE PRODUCTS sang ANIMAL FEED & NUTRITION
UPDATE public.commodities_new
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'ANIMAL FEED & NUTRITION')
WHERE name = 'RICE'
AND description = 'RICE BRAN EXTRACTION'
AND DATE(created_at) = CURRENT_DATE;

-- 3. Kiểm tra các hàng hóa có tên "Unknown Commodity" và điều chỉnh nếu cần
-- Hiện tại đã được gán vào OTHER AGRICULTURAL PRODUCTS, có thể giữ nguyên

-- 4. Kiểm tra kết quả sau khi điều chỉnh
SELECT 
    c.id, 
    c.name, 
    c.description, 
    cat.name as category_name,
    c.created_at
FROM 
    public.commodities_new c
JOIN 
    public.categories_new cat ON c.category_id = cat.id
WHERE 
    c.name IN ('APPLE MACBOOK', 'RICE')
    AND DATE(c.created_at) = CURRENT_DATE
ORDER BY 
    c.name;
