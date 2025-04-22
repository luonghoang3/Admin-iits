-- Cài đặt extension unaccent nếu chưa có
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Tạo function để loại bỏ dấu
CREATE OR REPLACE FUNCTION remove_accents(text)
RETURNS text AS $$
  SELECT unaccent($1);
$$ LANGUAGE SQL IMMUTABLE;

-- Thêm cột name_without_accent vào bảng clients nếu chưa có
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clients' 
    AND column_name = 'name_without_accent'
  ) THEN
    ALTER TABLE clients ADD COLUMN name_without_accent text;
  END IF;
END
$$;

-- Cập nhật dữ liệu hiện có
UPDATE clients SET name_without_accent = remove_accents(name);

-- Tạo trigger function
CREATE OR REPLACE FUNCTION update_name_without_accent()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name_without_accent := remove_accents(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger nếu chưa có
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_name_without_accent'
  ) THEN
    CREATE TRIGGER trigger_update_name_without_accent
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_name_without_accent();
  END IF;
END
$$;

-- Tạo index cho cột name_without_accent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'clients' 
    AND indexname = 'idx_clients_name_without_accent'
  ) THEN
    CREATE INDEX idx_clients_name_without_accent ON clients USING btree (name_without_accent);
  END IF;
END
$$;

-- Kiểm tra kết quả
SELECT id, name, name_without_accent FROM clients WHERE name LIKE '%Công ty%' LIMIT 10;
