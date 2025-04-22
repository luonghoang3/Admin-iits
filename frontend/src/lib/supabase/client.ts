import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logger'

// Cấu hình kết nối với Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzQyNzQ5MjAwLAogICJleHAiOiAxOTAwNTE1NjAwCn0.2AU0_QJTz8rLiX5dPg8QCQjglsJwCOoRXKdh2cu_VSY'

// Tạo và xuất Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'admin-dashboard'
    }
  }
})

// Hàm kiểm tra kết nối tới Supabase (có thể gọi từ bất kỳ đâu)
export async function checkSupabaseConnection() {
  try {
    logger.log('Testing Supabase connection to URL:', supabaseUrl)
    logger.log('Using API key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...')
    
    // Thử gọi một API endpoint đơn giản
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    
    if (error) {
      logger.error('Supabase connection test failed:', error)
      return { success: false, error }
    }
    
    logger.log('Supabase connection test successful:', data)
    return { success: true, data }
  } catch (err) {
    logger.error('Supabase connection test exception:', err)
    return { success: false, error: err }
  }
} 