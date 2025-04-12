-- Script to analyze shipper data and identify records that need standardization

-- 1. Show all shippers
SELECT id, name, address, phone, email FROM public.shippers ORDER BY name;

-- 2. Identify potential duplicates based on similar names
WITH normalized_names AS (
  SELECT 
    id,
    name,
    -- Normalize name by removing extra spaces, converting to uppercase, and standardizing punctuation
    TRIM(REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          UPPER(name),
          '\s+', ' ', 'g'
        ), 
        '\.$', ''
      ),
      '\s*\([^)]*\)\s*$', ''
    )) AS normalized_name,
    address,
    phone,
    email
  FROM public.shippers
)
SELECT 
  n1.id AS id1,
  n1.name AS name1,
  n2.id AS id2,
  n2.name AS name2,
  n1.normalized_name
FROM normalized_names n1
JOIN normalized_names n2 ON 
  n1.normalized_name = n2.normalized_name AND
  n1.id < n2.id
ORDER BY n1.normalized_name;

-- 3. Identify names that need standardization (but aren't necessarily duplicates)
SELECT 
  id,
  name,
  CASE
    -- Handle S.A.S format (ensure consistent periods)
    WHEN UPPER(name) LIKE '%S.A.S%' OR UPPER(name) LIKE '%SAS%' THEN
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(name, '(?i)S\.?A\.?S\.?', 'S.A.S'),
          '\s+', ' ', 'g'
        ),
        '\.$', ''
      )
    
    -- Handle S.A format
    WHEN UPPER(name) LIKE '%S.A%' OR UPPER(name) LIKE '%SA%' THEN
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(name, '(?i)S\.?A\.?$', 'S.A'),
          '\s+', ' ', 'g'
        ),
        '\.$', ''
      )
    
    -- Handle JSC format
    WHEN UPPER(name) LIKE '%JSC%' THEN
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(name, '(?i)J\.?S\.?C\.?', 'JSC'),
          '\s+', ' ', 'g'
        ),
        '\.$', ''
      )
    
    -- Handle LTD format
    WHEN UPPER(name) LIKE '%LTD%' THEN
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(name, '(?i)L\.?T\.?D\.?', 'LTD'),
          '\s+', ' ', 'g'
        ),
        '\.$', ''
      )
    
    -- Handle LLC format
    WHEN UPPER(name) LIKE '%LLC%' THEN
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(name, '(?i)L\.?L\.?C\.?', 'LLC'),
          '\s+', ' ', 'g'
        ),
        '\.$', ''
      )
    
    -- Handle CORP format
    WHEN UPPER(name) LIKE '%CORP%' THEN
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(name, '(?i)CORP\.?', 'CORP'),
          '\s+', ' ', 'g'
        ),
        '\.$', ''
      )
    
    -- Default case: just normalize spacing and remove trailing periods
    ELSE
      REGEXP_REPLACE(
        REGEXP_REPLACE(name, '\s+', ' ', 'g'),
        '\.$', ''
      )
  END AS standardized_name
FROM public.shippers
WHERE name != 
  CASE
    -- Handle S.A.S format (ensure consistent periods)
    WHEN UPPER(name) LIKE '%S.A.S%' OR UPPER(name) LIKE '%SAS%' THEN
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(name, '(?i)S\.?A\.?S\.?', 'S.A.S'),
          '\s+', ' ', 'g'
        ),
        '\.$', ''
      )
    
    -- Handle S.A format
    WHEN UPPER(name) LIKE '%S.A%' OR UPPER(name) LIKE '%SA%' THEN
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(name, '(?i)S\.?A\.?$', 'S.A'),
          '\s+', ' ', 'g'
        ),
        '\.$', ''
      )
    
    -- Handle JSC format
    WHEN UPPER(name) LIKE '%JSC%' THEN
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(name, '(?i)J\.?S\.?C\.?', 'JSC'),
          '\s+', ' ', 'g'
        ),
        '\.$', ''
      )
    
    -- Handle LTD format
    WHEN UPPER(name) LIKE '%LTD%' THEN
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(name, '(?i)L\.?T\.?D\.?', 'LTD'),
          '\s+', ' ', 'g'
        ),
        '\.$', ''
      )
    
    -- Handle LLC format
    WHEN UPPER(name) LIKE '%LLC%' THEN
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(name, '(?i)L\.?L\.?C\.?', 'LLC'),
          '\s+', ' ', 'g'
        ),
        '\.$', ''
      )
    
    -- Handle CORP format
    WHEN UPPER(name) LIKE '%CORP%' THEN
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(name, '(?i)CORP\.?', 'CORP'),
          '\s+', ' ', 'g'
        ),
        '\.$', ''
      )
    
    -- Default case: just normalize spacing and remove trailing periods
    ELSE
      REGEXP_REPLACE(
        REGEXP_REPLACE(name, '\s+', ' ', 'g'),
        '\.$', ''
      )
  END
ORDER BY name;

-- 4. Count shippers with various company suffixes
SELECT 
  'S.A.S' AS suffix, COUNT(*) AS count FROM public.shippers WHERE UPPER(name) LIKE '%S.A.S%' OR UPPER(name) LIKE '%SAS%'
UNION ALL
SELECT 
  'S.A' AS suffix, COUNT(*) AS count FROM public.shippers WHERE UPPER(name) LIKE '%S.A%' AND UPPER(name) NOT LIKE '%S.A.S%'
UNION ALL
SELECT 
  'JSC' AS suffix, COUNT(*) AS count FROM public.shippers WHERE UPPER(name) LIKE '%JSC%'
UNION ALL
SELECT 
  'LTD' AS suffix, COUNT(*) AS count FROM public.shippers WHERE UPPER(name) LIKE '%LTD%'
UNION ALL
SELECT 
  'LLC' AS suffix, COUNT(*) AS count FROM public.shippers WHERE UPPER(name) LIKE '%LLC%'
UNION ALL
SELECT 
  'CORP' AS suffix, COUNT(*) AS count FROM public.shippers WHERE UPPER(name) LIKE '%CORP%'
UNION ALL
SELECT 
  'INC' AS suffix, COUNT(*) AS count FROM public.shippers WHERE UPPER(name) LIKE '%INC%'
UNION ALL
SELECT 
  'CO' AS suffix, COUNT(*) AS count FROM public.shippers WHERE UPPER(name) LIKE '%CO.%' OR UPPER(name) LIKE '% CO %' OR UPPER(name) LIKE '% CO$'
ORDER BY count DESC;

-- 5. Count shippers with country information in parentheses
SELECT 
  COUNT(*) AS count_with_country
FROM public.shippers
WHERE name ~ '\([^)]+\)$';
