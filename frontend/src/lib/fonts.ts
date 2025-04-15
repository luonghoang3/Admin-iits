import { Inter } from 'next/font/google'

// Nếu bạn sử dụng font tùy chỉnh, hãy sử dụng localFont
// import localFont from 'next/font/local'

// Cấu hình font Inter từ Google Fonts
export const inter = Inter({
  subsets: ['latin', 'vietnamese'],  // Hỗ trợ tiếng Việt
  display: 'swap',                   // Hiển thị font hệ thống trước khi font tùy chỉnh được tải
  preload: true,                     // Preload font
  fallback: ['system-ui', 'sans-serif'], // Font dự phòng
  weight: ['400', '500', '600', '700'],  // Các weight cần thiết
  variable: '--font-inter',          // CSS variable để sử dụng trong tailwind
  adjustFontFallback: false,         // Tắt điều chỉnh font fallback để tránh lỗi hydration
})

// Nếu bạn sử dụng font tùy chỉnh, hãy bỏ comment đoạn code dưới đây
/*
export const myCustomFont = localFont({
  src: [
    {
      path: '../../public/fonts/my-font-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/my-font-bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
  variable: '--font-custom',
})
*/
