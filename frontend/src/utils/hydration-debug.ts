/**
 * Utility để debug các vấn đề hydration trong Next.js
 * 
 * Sử dụng:
 * 1. Import vào component có vấn đề hydration
 * 2. Thêm useHydrationDebug() vào component
 * 3. Kiểm tra console để xem sự khác biệt giữa server và client render
 */

import { useEffect, useState } from 'react';

export function useHydrationDebug(componentName = 'Component') {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    console.log(`[HydrationDebug] ${componentName} hydrated on client`);
  }, [componentName]);

  if (!isHydrated) {
    console.log(`[HydrationDebug] ${componentName} rendered on server`);
  }

  return isHydrated;
}

/**
 * HOC để wrap component cần debug hydration
 */
export function withHydrationDebug<P extends object>(
  Component: React.ComponentType<P>,
  debugName?: string
) {
  return function WrappedComponent(props: P) {
    useHydrationDebug(debugName || Component.displayName || Component.name);
    return <Component {...props} />;
  };
}

/**
 * Kiểm tra xem code đang chạy ở client hay server
 * An toàn để sử dụng trong cả server và client components
 */
export function isClient() {
  return typeof window !== 'undefined';
}

/**
 * Tạo một ID duy nhất cho mỗi request, giúp theo dõi sự khác biệt
 * giữa server và client render
 */
export function getRequestId() {
  if (isClient()) {
    // Sử dụng ID từ localStorage nếu đã có
    if (!window.__HYDRATION_REQUEST_ID__) {
      window.__HYDRATION_REQUEST_ID__ = Math.random().toString(36).substring(2, 15);
    }
    return window.__HYDRATION_REQUEST_ID__;
  }
  
  // Trên server, tạo một ID mới cho mỗi request
  return Math.random().toString(36).substring(2, 15);
}

// Thêm type cho window object
declare global {
  interface Window {
    __HYDRATION_REQUEST_ID__?: string;
  }
}
