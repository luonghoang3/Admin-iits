import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const cookieStore = cookies()
  
  const supabase = await createClient()
  
  await supabase.auth.signOut()
  
  return NextResponse.redirect(`${requestUrl.origin}/login`, {
    status: 302,
  })
} 