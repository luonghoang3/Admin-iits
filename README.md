# Admin-iits - Tài liệu dự án

## Mục lục

- [1. Tổng quan dự án](#1-tổng-quan-dự-án)
- [2. Bắt đầu](#2-bắt-đầu)
  - [2.1. Yêu cầu hệ thống](#21-yêu-cầu-hệ-thống)
  - [2.2. Cài đặt](#22-cài-đặt)
  - [2.3. Cấu hình](#23-cấu-hình)
- [3. Kiến trúc dự án](#3-kiến-trúc-dự-án)
  - [3.1. Frontend](#31-frontend)
  - [3.2. Backend (Supabase)](#32-backend-supabase)
  - [3.3. Luồng dữ liệu](#33-luồng-dữ-liệu)
- [4. Cấu trúc mã nguồn](#4-cấu-trúc-mã-nguồn)
  - [4.1. Frontend](#41-frontend)
  - [4.2. Database](#42-database)
- [5. Tính năng chính](#5-tính-năng-chính)
  - [5.1. Quản lý người dùng và Teams](#51-quản-lý-người-dùng-và-teams)
  - [5.2. Quản lý khách hàng](#52-quản-lý-khách-hàng)
  - [5.3. Quản lý đơn hàng](#53-quản-lý-đơn-hàng)
  - [5.4. Quản lý hàng hóa](#54-quản-lý-hàng-hóa)
  - [5.5. Quản lý đơn vị](#55-quản-lý-đơn-vị)
  - [5.6. Quản lý đối tác vận chuyển](#56-quản-lý-đối-tác-vận-chuyển)
- [6. Schema cơ sở dữ liệu](#6-schema-cơ-sở-dữ-liệu)
- [7. Xác thực và phân quyền](#7-xác-thực-và-phân-quyền)
- [8. API Documentation](#8-api-documentation)
- [9. Hệ thống UI/UX](#9-hệ-thống-uiux)
- [10. Quy trình phát triển](#10-quy-trình-phát-triển)
- [11. Kiểm thử](#11-kiểm-thử)
- [12. Triển khai](#12-triển-khai)
- [13. Vấn đề thường gặp và cách khắc phục](#13-vấn-đề-thường-gặp-và-cách-khắc-phục)
- [14. Hướng phát triển tương lai](#14-hướng-phát-triển-tương-lai)

## 1. Tổng quan dự án

**Admin-iits** là một hệ thống quản trị doanh nghiệp được xây dựng để quản lý đơn hàng, khách hàng, hàng hóa và các quy trình kinh doanh khác. Hệ thống được phát triển với kiến trúc hiện đại, sử dụng Next.js cho frontend và Supabase làm backend.

**Mục tiêu chính:**
- Quản lý đơn hàng toàn diện (trong nước và quốc tế)
- Quản lý thông tin khách hàng và liên hệ
- Quản lý hàng hóa, đơn vị tính
- Quản lý nhà vận chuyển và bên mua
- Hỗ trợ nhiều bộ phận khác nhau (hàng hải, nông nghiệp, hàng tiêu dùng)
- Phân quyền dựa trên vai trò và nhóm làm việc

**Công nghệ sử dụng:**
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Functions)
- **Components**: ShadCN UI (dựa trên Radix UI)
- **Form Management**: React Hook Form + Zod
- **Data Display**: TanStack Table (React Table)

## 2. Bắt đầu

### 2.1. Yêu cầu hệ thống

- Node.js 18.0+
- npm hoặc pnpm
- Supabase CLI (để phát triển local)
- Git

### 2.2. Cài đặt

1. Clone repository:
   ```bash
   git clone [repository-url]
   cd admin-iits
   ```

2. Cài đặt dependencies:
   ```bash
   cd frontend
   npm install
   # hoặc
   pnpm install
   ```

3. Thiết lập Supabase local (tùy chọn):
   ```bash
   supabase start
   ```

4. Chạy dự án ở chế độ development:
   ```bash
   npm run dev
   # hoặc
   pnpm dev
   ```

### 2.3. Cấu hình

1. Tạo file `.env.local` trong thư mục `frontend` với nội dung:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

2. Cấu hình các biến môi trường khác trong Supabase Dashboard:
   - Authentication settings
   - Storage policies
   - Database connection strings

## 3. Kiến trúc dự án

### 3.1. Frontend

Dự án sử dụng mô hình App Router của Next.js 15 với các thư mục chính:

- `/app`: Chứa routing và pages
- `/components`: UI components và business components
- `/lib`: Utilities và helpers
- `/utils`: Các hàm tiện ích
- `/types`: TypeScript type definitions
- `/hooks`: Custom React hooks

Kiến trúc frontend được tổ chức theo mô hình feature-first, kết hợp với một hệ thống UI components tái sử dụng.

### 3.2. Backend (Supabase)

Dự án sử dụng Supabase làm backend, bao gồm:

- **Cơ sở dữ liệu PostgreSQL**: Lưu trữ tất cả dữ liệu ứng dụng
- **Authentication**: Xác thực người dùng
- **Storage**: Lưu trữ files và hình ảnh
- **Row Level Security (RLS)**: Áp dụng các chính sách bảo mật cấp hàng
- **Database Functions**: Các hàm PostgreSQL xử lý logic phức tạp

### 3.3. Luồng dữ liệu

1. **Client Request**: Frontend gửi request đến Supabase API
2. **Authentication**: Supabase xác thực JWT token
3. **RLS Policies**: Áp dụng các policies dựa trên người dùng đã xác thực
4. **Database Operation**: Thực hiện các thao tác CRUD
5. **Response**: Dữ liệu được trả về Frontend
6. **State Management**: React state được cập nhật
7. **UI Rendering**: UI được render lại với dữ liệu mới

## 4. Cấu trúc mã nguồn

### 4.1. Frontend

## 5. Tính năng chính

### 5.1. Quản lý người dùng và Teams

Hệ thống cho phép quản lý người dùng và tổ chức theo nhóm (teams):

- **Tài khoản người dùng**: Đăng ký, đăng nhập, phục hồi mật khẩu
- **Phân quyền**: Admin, User thường
- **Teams**: Tạo và quản lý các nhóm làm việc
- **Gán người dùng vào teams**: Quản lý thành viên trong team

### 5.2. Quản lý khách hàng

Quản lý toàn diện thông tin khách hàng và người liên hệ:

- **Danh sách khách hàng**: Xem, tìm kiếm, lọc khách hàng
- **Thông tin chi tiết**: Tên, địa chỉ, email, số điện thoại, mã số thuế
- **Người liên hệ**: Quản lý nhiều người liên hệ cho mỗi khách hàng
- **Lịch sử đơn hàng**: Xem các đơn hàng liên quan đến khách hàng

### 5.3. Quản lý đơn hàng

Tính năng quản lý đơn hàng toàn diện, hỗ trợ nhiều loại đơn hàng khác nhau:

- **Danh sách đơn hàng**: Xem, tìm kiếm, lọc đơn hàng theo nhiều tiêu chí
- **Loại đơn hàng**: Quốc tế (international) và nội địa (local)
- **Bộ phận**: Hàng hải (marine), nông nghiệp (agri), hàng tiêu dùng (consumer_goods)
- **Trạng thái đơn hàng**: Draft, Confirmed, Completed, Cancelled
- **Chi tiết đơn hàng**:
  - Thông tin khách hàng và người liên hệ
  - Thông tin vận chuyển (vessel, bill of lading)
  - Danh sách hàng hóa với số lượng và đơn vị tính
  - Nhà vận chuyển và bên mua
- **Auto-generate mã đơn hàng**: Tự động tạo mã đơn theo format `[Loại][Phòng ban][Năm]-[Số thứ tự]`
  - Hiển thị số thứ tự dự kiến dựa trên số thứ tự cao nhất hiện có
  - Tự động tăng số thứ tự khi tạo đơn hàng mới
- **Luồng xử lý đơn hàng**: Quản lý các bước từ draft đến completed

#### 5.3.1. Form Đơn hàng

Form đơn hàng được chia thành nhiều phần:

1. **Thông tin khách hàng**:
   - Chọn khách hàng
   - Chọn người liên hệ
   - Tạo mới hoặc chỉnh sửa thông tin khách hàng và liên hệ
   - Tự động chọn người liên hệ gần nhất khi chọn khách hàng
   - Tự động gán khách hàng mới sau khi tạo

2. **Chi tiết đơn hàng**:
   - Loại đơn hàng (international/local)
   - Bộ phận (marine/agriculture/consumer goods)
   - Ngày đặt hàng
   - Trạng thái đơn hàng
   - Mã tham chiếu của khách hàng
   - Hiển thị mã đơn hàng dự kiến với số thứ tự tiếp theo

3. **Thông tin vận chuyển**:
   - Vessel/Carrier
   - Bill of lading
   - Ngày bill of lading
   - Nhà vận chuyển
   - Bên mua

4. **Danh sách hàng hóa**:
   - Thêm/sửa/xóa hàng hóa
   - Chọn hàng hóa từ danh mục
   - Số lượng và đơn vị tính
   - Mô tả chi tiết hàng hóa
   - Cập nhật đồng bộ khi chỉnh sửa đơn hàng

### 5.4. Quản lý hàng hóa

Quản lý danh mục hàng hóa:

- **Danh sách hàng hóa**: Xem, tìm kiếm, lọc hàng hóa
- **Thông tin chi tiết**: Tên, mô tả, đơn vị tính
- **Phân loại**: Phân loại hàng hóa theo danh mục
- **Phân quyền**: Quản lý hàng hóa theo teams

### 5.5. Quản lý đơn vị

Quản lý các đơn vị tính:

- **Danh sách đơn vị**: Xem, tìm kiếm, lọc đơn vị
- **Thông tin chi tiết**: Tên, viết tắt, mô tả

### 5.6. Quản lý đối tác vận chuyển

Quản lý thông tin nhà vận chuyển và bên mua:

- **Shippers**: Quản lý thông tin nhà vận chuyển
- **Buyers**: Quản lý thông tin bên mua
- **Liên kết với đơn hàng**: Gán nhà vận chuyển/bên mua vào đơn hàng

## 6. Schema cơ sở dữ liệu

### 6.1. Bảng `teams`
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 6.2. Bảng `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 6.3. Bảng `clients`
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  email TEXT,
  phone TEXT,
  tax_id TEXT,
  team_ids UUID[] DEFAULT '{}'::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 6.4. Bảng `contacts`
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 6.5. Bảng `orders`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('international', 'local')),
  department TEXT NOT NULL CHECK (department IN ('marine', 'agri', 'consumer_goods')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'completed', 'cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  client_ref_code TEXT,
  notes TEXT,
  shipper_id UUID REFERENCES shippers(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL,
  vessel_carrier TEXT,
  bill_of_lading TEXT,
  bill_of_lading_date DATE,
  inspection_date_started DATE,
  inspection_date_completed DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 6.6. Bảng `order_items`
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  commodity_id UUID NOT NULL REFERENCES commodities(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  commodity_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 6.7. Bảng `shippers`
```sql
CREATE TABLE shippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  team_ids UUID[] DEFAULT '{}'::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 6.8. Bảng `buyers`
```sql
CREATE TABLE buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  team_ids UUID[] DEFAULT '{}'::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 6.9. Bảng `commodities`
```sql
CREATE TABLE commodities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT commodities_name_key UNIQUE (name)
);
```

### 6.10. Bảng `commodities_teams`
```sql
CREATE TABLE commodities_teams (
  commodity_id UUID REFERENCES commodities(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (commodity_id, team_id)
);
```

### 6.11. Bảng `units`
```sql
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abbreviation TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT units_name_key UNIQUE (name)
);
```

## 7. Xác thực và phân quyền

### 7.1. Xác thực người dùng

Dự án sử dụng hệ thống xác thực của Supabase:

- **Email/Password Authentication**: Xác thực bằng email và mật khẩu
- **Magic Link**: Xác thực không cần mật khẩu (tùy chọn)
- **OAuth Providers**: Hỗ trợ đăng nhập qua Google, GitHub, v.v. (tùy chọn)

### 7.2. Phân quyền

Hệ thống phân quyền dựa trên vai trò (role) và nhóm (team):

- **Admin**: Quyền quản trị toàn hệ thống
- **User**: Quyền người dùng thông thường
- **Team-based**: Một số dữ liệu được giới hạn theo team

### 7.3. Row Level Security (RLS)

Supabase sử dụng RLS để bảo mật dữ liệu ở cấp độ hàng. Các policy chính:

```sql
-- Ví dụ policy cho bảng orders
CREATE POLICY "Everyone can read orders" ON orders
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create orders" ON orders
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Ví dụ policy cho commodities
CREATE POLICY "Admin can view all commodities" ON commodities
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin' AND is_active = true
  )
);
```

## 8. API Documentation

### 8.1. Supabase Client

Dự án sử dụng Supabase JavaScript Client để tương tác với backend:

```typescript
// Khởi tạo Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 8.2. Các API endpoint chính

#### 8.2.1. Client Management API

```typescript
// Lấy danh sách khách hàng với phân trang
export async function fetchClients({
  page = 1,
  limit = 10,
  searchQuery = '',
}) {
  const startRow = (page - 1) * limit
  const endRow = startRow + limit - 1

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
  }

  const { data, error, count } = await query
    .range(startRow, endRow)
    .order('name')

  return { clients: data || [], total: count || 0, error }
}
```

#### 8.2.2. Order Management API

```typescript
// Lấy danh sách đơn hàng
export async function fetchOrders() {
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      *,
      clients:client_id (name)
    `)
    .order('created_at', { ascending: false })

  // Format response with client names
  const formattedOrders = orders.map(order => ({
    ...order,
    client_name: order.clients?.name
  }))

  return { orders: formattedOrders, error: null }
}

// Lấy chi tiết một đơn hàng
export async function fetchOrder(orderId: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      clients:client_id (id, name, phone, email)
    `)
    .eq('id', orderId)
    .single()

  return { order, error }
}
```

#### 8.2.3. Order Items API

```typescript
// Lấy các order items của một order
export const fetchOrderItems = async (orderId: string) => {
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      id,
      order_id,
      commodity_id,
      commodities (
        id,
        name,
        description
      ),
      quantity,
      unit_id,
      units (
        id,
        name
      ),
      commodity_description
    `)
    .eq('order_id', orderId);

  return { orderItems: data || [], error }
}
```

## 9. Hệ thống UI/UX

### 9.1. Design System

Dự án sử dụng ShadCN UI, một thư viện components dựa trên TailwindCSS và Radix UI:

- **Typography**: Hệ thống typography nhất quán
- **Colors**: Bảng màu được định nghĩa trong tailwind.config.js
- **Components**: Button, Input, Select, Dialog, etc.
- **Data Display**: Table, Cards, Lists

### 9.2. Responsive Design

Giao diện được thiết kế để hoạt động trên nhiều kích thước màn hình:

- **Desktop**: Giao diện đầy đủ
- **Tablet**: Layout tối ưu cho màn hình trung bình
- **Mobile**: Giao diện thu gọn cho thiết bị di động

### 9.3. Dashboard Layout

```tsx
// Ví dụ Dashboard Layout
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Navbar />
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
```

## 10. Quy trình phát triển

### 10.1. Workflow Git

1. **Branches**:
   - `main`: Production code
   - `develop`: Development code
   - `feature/*`: Feature branches
   - `bugfix/*`: Bug fix branches

2. **Quy trình commit**:
   - Sử dụng conventional commits (chore, feat, fix, docs, etc.)
   - Mô tả rõ nội dung thay đổi

3. **Pull Requests**:
   - Tạo PR vào develop
   - Code review
   - Merge sau khi được approve

### 10.2. Code Style

Dự án sử dụng các công cụ để đảm bảo chất lượng code:

- **ESLint**: Kiểm tra lỗi syntax và coding style
- **Prettier**: Format code
- **TypeScript**: Type checking

## 11. Kiểm thử

### 11.1. Unit Testing

Sử dụng Jest làm testing framework:

```typescript
// Ví dụ unit test
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button component', () => {
  it('renders correctly', () => {
    render(<Button>Test Button</Button>)
    expect(screen.getByText('Test Button')).toBeInTheDocument()
  })
})
```

### 11.2. Integration Testing

Kiểm tra tích hợp giữa các components và API:

```typescript
// Ví dụ integration test
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientForm } from '@/components/forms/ClientForm'

describe('ClientForm', () => {
  it('submits the form with correct data', async () => {
    const mockSubmit = jest.fn()
    render(<ClientForm onSubmit={mockSubmit} />)

    await userEvent.type(screen.getByLabelText('Name'), 'Test Client')
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
    await userEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'Test Client',
        email: 'test@example.com'
      })
    })
  })
})
```

## 12. Triển khai

### 12.1. Development

```bash
npm run dev
```

### 12.2. Build

```bash
npm run build
```

### 12.3. Production

```bash
npm run start
```

### 12.4. Deployment Platforms

- **Vercel**: Được khuyến nghị cho Next.js
- **Netlify**: Thay thế tốt
- **Self-hosted**: Docker deployment

## 13. Vấn đề thường gặp và cách khắc phục

### 13.1. Authentication Issues

**Vấn đề**: Người dùng không thể đăng nhập.

**Giải pháp**:
1. Kiểm tra Supabase Auth settings
2. Xác nhận NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY
3. Kiểm tra JWT expiration time

### 13.2. Database Access Issues

**Vấn đề**: Không thể truy cập dữ liệu.

**Giải pháp**:
1. Kiểm tra RLS policies
2. Xác nhận user có đúng role và permissions
3. Kiểm tra team_ids nếu data phân quyền theo team

### 13.3. Form Validation Errors

**Vấn đề**: Validation không hoạt động đúng.

**Giải pháp**:
1. Kiểm tra Zod schema
2. Cập nhật React Hook Form validation logic
3. Kiểm tra console errors

## 14. Hướng phát triển tương lai

### 14.1. Tính năng mới

- **Báo cáo và thống kê**: Dashboard với biểu đồ và số liệu
- **Tích hợp thanh toán**: Quản lý hóa đơn và thanh toán
- **Mobile App**: Phiên bản di động cho ứng dụng
- **Notification System**: Thông báo real-time

### 14.2. Cải tiến kỹ thuật

- **Performance Optimization**: Cải thiện hiệu năng
- **Server-side Caching**: Caching ở backend
- **Internationalization**: Hỗ trợ đa ngôn ngữ
- **Enhanced Security**: Tăng cường bảo mật
- **GraphQL API**: Chuyển đổi sang GraphQL (nếu cần)

---

Tài liệu này được thiết kế để cung cấp cái nhìn tổng quan về dự án Admin-iits và hướng dẫn chi tiết cho các nhà phát triển mới và hiện tại. Nếu có bất kỳ thắc mắc hoặc đề xuất cải tiến nào, vui lòng liên hệ với team quản lý dự án.