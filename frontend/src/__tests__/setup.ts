import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase client cho testing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Mock các hàm authentication
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              role: 'admin'
            }
          }
        }
      })
    }
  }))
}));

export { supabase }; 