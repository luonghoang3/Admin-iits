import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import logger from '@/lib/logger'

// Xử lý yêu cầu PUT (update)
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } },
  formData?: FormData
) {
  try {
    // Đảm bảo params đã được resolved
    const resolvedParams = await Promise.resolve(context.params);
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID không hợp lệ' },
        { status: 400 }
      );
    }

    // Lấy form data từ tham số hoặc từ request
    if (!formData) {
      formData = await request.formData();
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Tên đội không được để trống' },
        { status: 400 }
      );
    }

    // Kiểm tra authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      );
    }

    // Kiểm tra quyền admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (!profile?.is_active) {
      return NextResponse.json(
        { error: 'Tài khoản không hoạt động' },
        { status: 403 }
      );
    }

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền quản trị' },
        { status: 403 }
      );
    }

    // Cập nhật dữ liệu team
    const { data, error } = await supabase
      .from('teams')
      .update({
        name: name.trim(),
        description: description ? description.trim() : null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Lỗi cập nhật team:', error);
      return NextResponse.json(
        { error: 'Không thể cập nhật dữ liệu' },
        { status: 500 }
      );
    }

    // Cập nhật lại cache
    revalidatePath('/dashboard/teams');

    // Chuyển hướng về trang danh sách
    return NextResponse.redirect(new URL('/dashboard/teams', request.url));
  } catch (error) {
    logger.error('Lỗi xử lý yêu cầu:', error);
    return NextResponse.json(
      { error: 'Lỗi xử lý yêu cầu' },
      { status: 500 }
    );
  }
}

// Xử lý POST request với _method=PUT
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const method = formData.get('_method') as string;

    if (method === 'PUT') {
      return PUT(request, context, formData);
    }

    return NextResponse.json(
      { error: 'Phương thức không được hỗ trợ' },
      { status: 405 }
    );
  } catch (error) {
    logger.error('Lỗi xử lý POST request:', error);
    return NextResponse.json(
      { error: 'Lỗi xử lý yêu cầu' },
      { status: 500 }
    );
  }
}