# Admin IITS - Hệ thống Quản lý Người dùng và Teams

Hệ thống quản lý người dùng và teams được xây dựng bằng Next.js 14, Supabase và Tailwind CSS.

## Tính năng chính

- **Quản lý người dùng**:
  - Xem danh sách người dùng
  - Thêm người dùng mới
  - Chỉnh sửa thông tin người dùng
  - Xóa người dùng
  - Gán người dùng vào nhiều team

- **Quản lý teams**:
  - Xem danh sách teams
  - Tạo team mới
  - Chỉnh sửa thông tin team
  - Xóa team
  - Hiển thị thành viên trong team

- **Xác thực và phân quyền**:
  - Đăng nhập/Đăng xuất
  - Phân quyền người dùng (admin/user)
  - Bảo vệ các route yêu cầu xác thực

## Công nghệ sử dụng

- **Frontend**:
  - Next.js 14 (App Router)
  - React
  - Tailwind CSS
  - Shadcn UI
  - TypeScript

- **Backend**:
  - Supabase (Database & Authentication)
  - PostgreSQL

## Cài đặt và Chạy

1. Clone repository:
```bash
git clone https://github.com/luonghoang3/Admin-iits.git
cd Admin-iits
```

2. Cài đặt dependencies:
```bash
cd frontend
npm install
```

3. Cấu hình môi trường:
- Tạo file `.env.local` trong thư mục `frontend`
- Thêm các biến môi trường:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Chạy ứng dụng:
```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## Cấu trúc Database

### Bảng `profiles`
- `id`: UUID (primary key)
- `username`: string
- `full_name`: string
- `role`: string (admin/user)
- `is_active`: boolean
- `avatar_url`: string
- `team_ids`: UUID[] (array of team IDs)
- `created_at`: timestamp
- `updated_at`: timestamp

### Bảng `teams`
- `id`: UUID (primary key)
- `name`: string
- `description`: string
- `created_at`: timestamp
- `updated_at`: timestamp

## API Endpoints

### Users
- `GET /api/users`: Lấy danh sách người dùng
- `POST /api/users`: Tạo người dùng mới
- `PUT /api/users/:id`: Cập nhật thông tin người dùng
- `DELETE /api/users/:id`: Xóa người dùng

### Teams
- `GET /api/teams`: Lấy danh sách teams
- `POST /api/teams`: Tạo team mới
- `PUT /api/teams/:id`: Cập nhật thông tin team
- `DELETE /api/teams/:id`: Xóa team

## Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng tạo issue hoặc pull request để cải thiện dự án.

## License

[MIT License](LICENSE)