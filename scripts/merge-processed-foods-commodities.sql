-- Script to merge similar commodities in the PROCESSED FOODS category
-- Created based on analysis of existing data

-- Start a transaction to ensure all operations are atomic
BEGIN;

-- 1. Soups and Noodles Group
-- 1.1 Update any references to "INSTANT SOUP, SAUCES, CONDIMENTS" to point to "INSTANT SOUPS"
UPDATE public.order_items
SET commodity_id = '414ff08e-2ce3-426c-bf7f-8bb8dc37cee1' -- INSTANT SOUPS
WHERE commodity_id = '30bffdfa-064e-42b5-b34a-c5de3a4752d3'; -- INSTANT SOUP, SAUCES, CONDIMENTS

-- 1.2 Update any references to "SOUP VIFON BRAND" to point to "INSTANT SOUPS"
UPDATE public.order_items
SET commodity_id = '414ff08e-2ce3-426c-bf7f-8bb8dc37cee1' -- INSTANT SOUPS
WHERE commodity_id = '82d9bd35-05d3-44a0-8e3a-af70677f8b04'; -- SOUP VIFON BRAND

-- 1.3 Delete the merged commodities
DELETE FROM public.commodities_teams_new
WHERE commodity_id IN (
  '30bffdfa-064e-42b5-b34a-c5de3a4752d3', -- INSTANT SOUP, SAUCES, CONDIMENTS
  '82d9bd35-05d3-44a0-8e3a-af70677f8b04'  -- SOUP VIFON BRAND
);

DELETE FROM public.commodities_new
WHERE id IN (
  '30bffdfa-064e-42b5-b34a-c5de3a4752d3', -- INSTANT SOUP, SAUCES, CONDIMENTS
  '82d9bd35-05d3-44a0-8e3a-af70677f8b04'  -- SOUP VIFON BRAND
);

-- 2. Sauces Group
-- 2.1 Update any references to "SOY SAUCE" to point to "KETCHUP & SAUCES"
UPDATE public.order_items
SET commodity_id = 'a8298973-2619-4004-8e49-50f33d7de211' -- KETCHUP & SAUCES
WHERE commodity_id = '9d64b57a-d558-425e-bb96-3b56bba48501'; -- SOY SAUCE

-- 2.2 Update any references to "SWEET CHILLI SAUCE 200G & 900G" to point to "KETCHUP & SAUCES"
UPDATE public.order_items
SET commodity_id = 'a8298973-2619-4004-8e49-50f33d7de211' -- KETCHUP & SAUCES
WHERE commodity_id = '7176cbf9-3b50-49ae-909c-73d6328bc28a'; -- SWEET CHILLI SAUCE 200G & 900G

-- 2.3 Delete the merged commodities
DELETE FROM public.commodities_teams_new
WHERE commodity_id IN (
  '9d64b57a-d558-425e-bb96-3b56bba48501', -- SOY SAUCE
  '7176cbf9-3b50-49ae-909c-73d6328bc28a'  -- SWEET CHILLI SAUCE 200G & 900G
);

DELETE FROM public.commodities_new
WHERE id IN (
  '9d64b57a-d558-425e-bb96-3b56bba48501', -- SOY SAUCE
  '7176cbf9-3b50-49ae-909c-73d6328bc28a'  -- SWEET CHILLI SAUCE 200G & 900G
);

-- 3. Snacks and Biscuits Group
-- 3.1 Update any references to "BISCUITS (TAN TAN)" to point to "BISCUITS & CANDIES"
UPDATE public.order_items
SET commodity_id = '87fce26c-071e-466b-a06c-5ebf133ab845' -- BISCUITS & CANDIES
WHERE commodity_id = 'a235ffea-2f1f-4f19-8084-90723b1db8be'; -- BISCUITS (TAN TAN)

-- 3.2 Update any references to "PAPAS FRITAS MR. POTATO Y SNACKS DOUBLE DECKER" to point to "SNACKS & CHIPS"
UPDATE public.order_items
SET commodity_id = '651a0243-6cc7-410a-8d19-af281619bf00' -- SNACKS & CHIPS
WHERE commodity_id = 'b78c8dcf-1f2e-40c2-90c1-8f3b45eb8c96'; -- PAPAS FRITAS MR. POTATO Y SNACKS DOUBLE DECKER

-- 3.3 Update any references to "RICHY" to point to "SNACKS & CHIPS"
UPDATE public.order_items
SET commodity_id = '651a0243-6cc7-410a-8d19-af281619bf00' -- SNACKS & CHIPS
WHERE commodity_id = '47f0afb3-a3ef-419c-9c97-16659ce3eeb3'; -- RICHY

-- 3.4 Delete the merged commodities
DELETE FROM public.commodities_teams_new
WHERE commodity_id IN (
  'a235ffea-2f1f-4f19-8084-90723b1db8be', -- BISCUITS (TAN TAN)
  'b78c8dcf-1f2e-40c2-90c1-8f3b45eb8c96', -- PAPAS FRITAS MR. POTATO Y SNACKS DOUBLE DECKER
  '47f0afb3-a3ef-419c-9c97-16659ce3eeb3'  -- RICHY
);

DELETE FROM public.commodities_new
WHERE id IN (
  'a235ffea-2f1f-4f19-8084-90723b1db8be', -- BISCUITS (TAN TAN)
  'b78c8dcf-1f2e-40c2-90c1-8f3b45eb8c96', -- PAPAS FRITAS MR. POTATO Y SNACKS DOUBLE DECKER
  '47f0afb3-a3ef-419c-9c97-16659ce3eeb3'  -- RICHY
);

-- 4. Canned Foods Group
-- 4.1 Update any references to "CANNED SE IN VEGETABLE 425G" to point to "CANNED FOODS"
UPDATE public.order_items
SET commodity_id = 'b85c758f-3415-488e-a153-23016c9c05b4' -- CANNED FOODS
WHERE commodity_id = 'd075767f-efd6-4f7f-bc8c-0be87e3127b5'; -- CANNED SE IN VEGETABLE 425G

-- 4.2 Update any references to "SLICED PINEAPPLE IN OWN JUICE" to point to "CANNED FOODS"
UPDATE public.order_items
SET commodity_id = 'b85c758f-3415-488e-a153-23016c9c05b4' -- CANNED FOODS
WHERE commodity_id = '713ab208-e2c8-459d-bb09-4aaa99596179'; -- SLICED PINEAPPLE IN OWN JUICE

-- 4.3 Delete the merged commodities
DELETE FROM public.commodities_teams_new
WHERE commodity_id IN (
  'd075767f-efd6-4f7f-bc8c-0be87e3127b5', -- CANNED SE IN VEGETABLE 425G
  '713ab208-e2c8-459d-bb09-4aaa99596179'  -- SLICED PINEAPPLE IN OWN JUICE
);

DELETE FROM public.commodities_new
WHERE id IN (
  'd075767f-efd6-4f7f-bc8c-0be87e3127b5', -- CANNED SE IN VEGETABLE 425G
  '713ab208-e2c8-459d-bb09-4aaa99596179'  -- SLICED PINEAPPLE IN OWN JUICE
);

-- 5. Other Items
-- 5.1 Update any references to "CHICKEN CASE" to point to "FOODSTUFF"
UPDATE public.order_items
SET commodity_id = '4c471e41-f4c5-45e5-8207-69d6f9b15577' -- FOODSTUFF
WHERE commodity_id = '9e95bb99-3b12-4e26-ac28-65f32476f6e3'; -- CHICKEN CASE

-- 5.2 Delete the merged commodity
DELETE FROM public.commodities_teams_new
WHERE commodity_id = '9e95bb99-3b12-4e26-ac28-65f32476f6e3'; -- CHICKEN CASE

DELETE FROM public.commodities_new
WHERE id = '9e95bb99-3b12-4e26-ac28-65f32476f6e3'; -- CHICKEN CASE

-- Update descriptions of the target commodities to be more comprehensive
UPDATE public.commodities_new
SET description = 'INSTANT SOUPS, SAUCES, CONDIMENTS AND VIFON BRAND PRODUCTS'
WHERE id = '414ff08e-2ce3-426c-bf7f-8bb8dc37cee1'; -- INSTANT SOUPS

UPDATE public.commodities_new
SET description = 'KETCHUP, CHILI SAUCE, SOY SAUCE AND OTHER CONDIMENTS'
WHERE id = 'a8298973-2619-4004-8e49-50f33d7de211'; -- KETCHUP & SAUCES

UPDATE public.commodities_new
SET description = 'BISCUITS, COOKIES, CANDIES AND TAN TAN BRAND PRODUCTS'
WHERE id = '87fce26c-071e-466b-a06c-5ebf133ab845'; -- BISCUITS & CANDIES

UPDATE public.commodities_new
SET description = 'POTATO CHIPS, SNACKS, RICHY BRAND AND RELATED PRODUCTS'
WHERE id = '651a0243-6cc7-410a-8d19-af281619bf00'; -- SNACKS & CHIPS

UPDATE public.commodities_new
SET description = 'CANNED VEGETABLES, FRUITS, PINEAPPLE AND OTHER CANNED PRODUCTS'
WHERE id = 'b85c758f-3415-488e-a153-23016c9c05b4'; -- CANNED FOODS

UPDATE public.commodities_new
SET description = 'VARIOUS FOOD PRODUCTS, INGREDIENTS AND CHICKEN PRODUCTS'
WHERE id = '4c471e41-f4c5-45e5-8207-69d6f9b15577'; -- FOODSTUFF

-- Commit the transaction
COMMIT;

-- Verify the results
SELECT id, name, description, created_at
FROM public.commodities_new
WHERE category_id = (SELECT id FROM categories_new WHERE name = 'PROCESSED FOODS')
ORDER BY name;
