# Giải quyết lỗi Hydration trong Next.js

Tài liệu này cung cấp hướng dẫn để giải quyết các lỗi hydration phổ biến trong ứng dụng Next.js.

## Lỗi hydration là gì?

Lỗi hydration xảy ra khi có sự khác biệt giữa HTML được render trên server và HTML được render trên client. React sẽ hiển thị cảnh báo và không thể "hydrate" (kết hợp) hai phiên bản này.

Thông báo lỗi thường có dạng:
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

hoặc

```
Error: A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

## Nguyên nhân phổ biến

1. **Sử dụng các giá trị ngẫu nhiên hoặc thời gian**: `Math.random()`, `Date.now()`, `new Date()` sẽ tạo ra các giá trị khác nhau trên server và client.

2. **Kiểm tra môi trường không nhất quán**: Sử dụng `typeof window !== 'undefined'` trong quá trình render.

3. **Plugin hoặc extension của trình duyệt**: Có thể có extension đang can thiệp vào HTML.

4. **Thư viện bên thứ ba**: Một số thư viện có thể thêm thuộc tính vào DOM.

5. **Vấn đề với font hoặc style**: Các font tùy chỉnh có thể gây ra vấn đề hydration.

## Giải pháp

### 1. Sử dụng `suppressHydrationWarning`

Thêm `suppressHydrationWarning` vào các phần tử có thể gây ra lỗi hydration:

```jsx
<div suppressHydrationWarning>{new Date().toLocaleTimeString()}</div>
```

Hoặc trong layout.tsx:

```jsx
<html lang="en" suppressHydrationWarning>
  <body suppressHydrationWarning>
    {children}
  </body>
</html>
```

### 2. Sử dụng `useEffect` để render nội dung chỉ ở client

```jsx
const [time, setTime] = useState('');

useEffect(() => {
  setTime(new Date().toLocaleTimeString());
}, []);
```

### 3. Sử dụng component `ClientOnly`

Wrap các component sử dụng browser APIs trong component `ClientOnly`:

```jsx
import ClientOnly from '@/components/ClientOnly';

function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      <ClientOnly>
        <ComponentThatUsesBrowserAPIs />
      </ClientOnly>
    </div>
  );
}
```

### 4. Cấu hình font đúng cách

Khi sử dụng next/font, hãy thêm `adjustFontFallback: false` để tránh lỗi hydration:

```js
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
});
```

### 5. Debug lỗi hydration

Sử dụng công cụ `useHydrationDebug` để theo dõi sự khác biệt giữa server và client render:

```jsx
import { useHydrationDebug } from '@/utils/hydration-debug';

function MyComponent() {
  useHydrationDebug('MyComponent');
  // ...
}
```

## Các trường hợp đặc biệt

### 1. Lỗi với thuộc tính `__processed_*`

Nếu bạn gặp lỗi liên quan đến thuộc tính `__processed_*` trên thẻ `body`, đây thường là vấn đề với font hoặc style. Giải pháp:

- Thêm `suppressHydrationWarning` vào thẻ `body`
- Cấu hình font với `adjustFontFallback: false`
- Sử dụng `next/dynamic` với `ssr: false` cho các component có vấn đề

### 2. Lỗi với thư viện bên thứ ba

Nếu lỗi đến từ thư viện bên thứ ba, hãy sử dụng dynamic import với `ssr: false`:

```jsx
import dynamic from 'next/dynamic';

const ThirdPartyComponent = dynamic(
  () => import('@/components/ThirdPartyComponent'),
  { ssr: false }
);
```

## Tài liệu tham khảo

- [Next.js Documentation: Hydration](https://nextjs.org/docs/messages/react-hydration-error)
- [React Documentation: Hydration](https://react.dev/reference/react-dom/hydrate)
- [Troubleshooting Hydration](https://nextjs.org/docs/messages/react-hydration-error)
