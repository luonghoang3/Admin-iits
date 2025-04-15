-- Tắt RLS trên các bảng để import dữ liệu
ALTER TABLE shippers DISABLE ROW LEVEL SECURITY;
ALTER TABLE buyers DISABLE ROW LEVEL SECURITY;
ALTER TABLE units DISABLE ROW LEVEL SECURITY;
ALTER TABLE commodities DISABLE ROW LEVEL SECURITY;

-- Thêm cột team_id vào bảng commodities nếu chưa có
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'commodities'
        AND column_name = 'team_id'
    ) THEN
        ALTER TABLE commodities ADD COLUMN team_id UUID REFERENCES teams(id);
        CREATE INDEX IF NOT EXISTS idx_commodities_team_id ON commodities(team_id);
    END IF;
END $$;
