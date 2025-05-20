-- Script để điều chỉnh thêm một số hàng hóa có thể không phù hợp

-- 1. Điều chỉnh APPROXIMATED 160MT từ PROCESSED FOODS sang OTHER AGRICULTURAL PRODUCTS
-- vì không có mô tả cụ thể và tên không rõ ràng
UPDATE public.commodities_new
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'OTHER AGRICULTURAL PRODUCTS')
WHERE name = 'APPROXIMATED 160MT'
AND DATE(created_at) = CURRENT_DATE;

-- 2. Kiểm tra kết quả sau khi điều chỉnh
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
    c.name = 'APPROXIMATED 160MT'
    AND DATE(c.created_at) = CURRENT_DATE;
