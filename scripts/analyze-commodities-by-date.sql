-- Script để phân tích hàng hóa dựa trên ngày tạo

-- 1. Đếm số lượng hàng hóa theo ngày tạo
SELECT 
    DATE(created_at) as creation_date, 
    COUNT(*) as commodity_count
FROM 
    public.commodities_new
GROUP BY 
    DATE(created_at)
ORDER BY 
    creation_date DESC;

-- 2. Đếm số lượng hàng hóa theo ngày tạo và danh mục
SELECT 
    DATE(c.created_at) as creation_date, 
    cat.name as category_name,
    COUNT(*) as commodity_count
FROM 
    public.commodities_new c
JOIN 
    public.categories_new cat ON c.category_id = cat.id
GROUP BY 
    DATE(c.created_at), cat.name
ORDER BY 
    creation_date DESC, commodity_count DESC;

-- 3. Kiểm tra các hàng hóa được tạo trong ngày hôm nay có tên hoặc mô tả không phù hợp với danh mục
-- Ví dụ: Hàng hóa có tên chứa "RICE" nhưng không thuộc danh mục "RICE & RICE PRODUCTS"
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
    DATE(c.created_at) = CURRENT_DATE
    AND (
        (c.name LIKE '%RICE%' AND cat.name != 'RICE & RICE PRODUCTS')
        OR (c.name LIKE '%PAPER%' AND cat.name != 'PAPER & STATIONERY')
        OR (c.name LIKE '%ELECTRIC%' AND cat.name != 'ELECTRICAL SUPPLIES & LIGHTING')
        OR (c.name LIKE '%SOAP%' AND cat.name != 'PERSONAL CARE & COSMETICS')
        OR (c.name LIKE '%COMPUTER%' AND cat.name != 'HOME APPLIANCES & ELECTRONICS')
    )
ORDER BY 
    c.name;

-- 4. Kiểm tra các hàng hóa được tạo trong ngày hôm nay có mô tả không phù hợp với danh mục
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
    DATE(c.created_at) = CURRENT_DATE
    AND c.description IS NOT NULL
    AND (
        (c.description LIKE '%RICE BRAN%' AND cat.name != 'ANIMAL FEED & NUTRITION')
        OR (c.description LIKE '%ALUMINUM%' AND cat.name != 'INDUSTRIAL MATERIALS')
        OR (c.description LIKE '%STEEL%' AND cat.name != 'INDUSTRIAL MATERIALS')
        OR (c.description LIKE '%SOAP%' AND cat.name != 'PERSONAL CARE & COSMETICS')
    )
ORDER BY 
    c.name;

-- 5. Tạo một quy trình để kiểm tra và gán danh mục cho hàng hóa mới dựa trên tên và mô tả
CREATE OR REPLACE FUNCTION check_and_categorize_commodity()
RETURNS TRIGGER AS $$
BEGIN
    -- Nếu hàng hóa không có danh mục, gán danh mục dựa trên tên và mô tả
    IF NEW.category_id IS NULL THEN
        -- Gán danh mục dựa trên tên
        IF NEW.name LIKE '%RICE%' THEN
            -- Kiểm tra mô tả để phân biệt giữa gạo và cám gạo
            IF NEW.description LIKE '%BRAN%' THEN
                NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'ANIMAL FEED & NUTRITION');
            ELSE
                NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'RICE & RICE PRODUCTS');
            END IF;
        ELSIF NEW.name LIKE '%PAPER%' OR NEW.name LIKE '%STATIONERY%' THEN
            NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'PAPER & STATIONERY');
        ELSIF NEW.name LIKE '%ELECTRIC%' OR NEW.name LIKE '%LIGHT%' THEN
            NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'ELECTRICAL SUPPLIES & LIGHTING');
        ELSIF NEW.name LIKE '%SOAP%' OR NEW.name LIKE '%DETERGENT%' THEN
            NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'PERSONAL CARE & COSMETICS');
        ELSIF NEW.name LIKE '%COMPUTER%' OR NEW.name LIKE '%LAPTOP%' OR NEW.name LIKE '%MACBOOK%' THEN
            NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'HOME APPLIANCES & ELECTRONICS');
        ELSIF NEW.name LIKE '%CORN%' THEN
            NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'CORN & CORN PRODUCTS');
        ELSIF NEW.name LIKE '%WHEAT%' OR NEW.name LIKE '%WBP%' THEN
            NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'WHEAT & WHEAT PRODUCTS');
        ELSIF NEW.name LIKE '%OIL%' OR NEW.name LIKE '%OLEIN%' THEN
            NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'OILS & FATS');
        ELSIF NEW.name LIKE '%FURNITURE%' OR NEW.name LIKE '%CHAIR%' THEN
            NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'FURNITURE & HOME DECOR');
        ELSIF NEW.name LIKE '%PLASTIC%' OR NEW.name LIKE '%PVC%' THEN
            NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'PLASTICS & MATERIALS');
        ELSIF NEW.name LIKE '%STEEL%' OR NEW.name LIKE '%ALUMINUM%' THEN
            NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'INDUSTRIAL MATERIALS');
        ELSIF NEW.name LIKE '%CHEMICAL%' THEN
            NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'INDUSTRIAL CHEMICALS');
        ELSIF NEW.name LIKE '%FISH%' OR NEW.name LIKE '%SEAFOOD%' OR NEW.name LIKE '%TUNA%' THEN
            NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'SEAFOOD & FISH PRODUCTS');
        ELSIF NEW.name LIKE '%MEDICINE%' OR NEW.name LIKE '%MEDICAL%' THEN
            NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'MEDICAL & HEALTHCARE PRODUCTS');
        ELSE
            -- Nếu không thể xác định danh mục dựa trên tên, gán vào danh mục mặc định
            NEW.category_id := (SELECT id FROM public.categories_new WHERE name = 'OTHER AGRICULTURAL PRODUCTS');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger để tự động gán danh mục cho hàng hóa mới
CREATE OR REPLACE TRIGGER categorize_commodity_trigger
BEFORE INSERT ON public.commodities_new
FOR EACH ROW
EXECUTE FUNCTION check_and_categorize_commodity();
