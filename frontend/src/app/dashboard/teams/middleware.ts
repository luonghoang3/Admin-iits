import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {}, // không cần set cookie trong middleware này
        remove() {}, // không cần remove cookie trong middleware này
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Nếu không có session, chuyển hướng đến trang đăng nhập
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Kiểm tra nếu người dùng có quyền admin
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', session.user.id)
      .single()

    // Nếu tài khoản bị khóa, đăng xuất và chuyển hướng
    if (profile && !profile.is_active) {
      return NextResponse.redirect(new URL('/login?error=account_inactive', request.url))
    }
    
    // Nếu không phải admin, chuyển hướng về dashboard
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra quyền:', error)
    // Vẫn cho phép truy cập, trang sẽ hiển thị lỗi
  }

  return response
}

export const config = {
  matcher: ['/dashboard/teams/:path*'],
} 