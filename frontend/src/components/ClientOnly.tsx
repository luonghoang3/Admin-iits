'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component này chỉ render children ở phía client, không render ở server
 * Giúp tránh các vấn đề hydration khi component sử dụng browser APIs
 * 
 * Sử dụng:
 * <ClientOnly>
 *   <ComponentThatUsesWindowOrOtherBrowserAPIs />
 * </ClientOnly>
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
