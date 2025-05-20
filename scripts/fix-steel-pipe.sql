-- Script để điều chỉnh hàng hóa "STEEL PIPE"

-- 1. Kiểm tra hàng hóa "STEEL PIPE" hiện tại
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
    c.name = 'STEEL PIPE'
    AND DATE(c.created_at) = CURRENT_DATE;

-- 2. Điều chỉnh hàng hóa "STEEL PIPE" từ BUILDING MATERIALS & HARDWARE sang INDUSTRIAL MATERIALS
UPDATE public.commodities_new
SET category_id = (SELECT id FROM public.categories_new WHERE name = 'INDUSTRIAL MATERIALS')
WHERE name = 'STEEL PIPE'
AND DATE(created_at) = CURRENT_DATE;

-- 3. Kiểm tra kết quả sau khi điều chỉnh
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
    c.name = 'STEEL PIPE'
    AND DATE(c.created_at) = CURRENT_DATE;
