'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  invalidateOrderCache, 
  invalidateInvoiceCache, 
  invalidateClientCache, 
  invalidateAllCache,
  setupCacheInvalidationListeners
} from '@/services/cacheInvalidationService';
import logger from '@/lib/logger';

// Định nghĩa kiểu dữ liệu cho context
interface CacheContextType {
  // Các hàm invalidate cache
  invalidateOrderCache: (orderId?: string) => void;
  invalidateInvoiceCache: (invoiceId?: string) => void;
  invalidateClientCache: (clientId?: string) => void;
  invalidateAllCache: () => void;
  
  // Trạng thái cache
  lastInvalidated: {
    order: Date | null;
    invoice: Date | null;
    client: Date | null;
    all: Date | null;
  };
}

// Tạo context với giá trị mặc định
const CacheContext = createContext<CacheContextType>({
  invalidateOrderCache: () => {},
  invalidateInvoiceCache: () => {},
  invalidateClientCache: () => {},
  invalidateAllCache: () => {},
  lastInvalidated: {
    order: null,
    invoice: null,
    client: null,
    all: null
  }
});

// Hook để sử dụng context
export const useCache = () => useContext(CacheContext);

// Provider component
export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State để lưu thời gian invalidate gần nhất
  const [lastInvalidated, setLastInvalidated] = useState({
    order: null as Date | null,
    invoice: null as Date | null,
    client: null as Date | null,
    all: null as Date | null
  });
  
  // Setup listeners khi component mount
  useEffect(() => {
    setupCacheInvalidationListeners();
    logger.info('Cache context initialized');
    
    // Cleanup khi component unmount
    return () => {
      // Không cần cleanup vì Supabase channels sẽ tự động unsubscribe khi component unmount
    };
  }, []);
  
  // Wrapper cho các hàm invalidate để cập nhật state
  const handleInvalidateOrderCache = (orderId?: string) => {
    invalidateOrderCache(orderId);
    setLastInvalidated(prev => ({ ...prev, order: new Date() }));
  };
  
  const handleInvalidateInvoiceCache = (invoiceId?: string) => {
    invalidateInvoiceCache(invoiceId);
    setLastInvalidated(prev => ({ ...prev, invoice: new Date() }));
  };
  
  const handleInvalidateClientCache = (clientId?: string) => {
    invalidateClientCache(clientId);
    setLastInvalidated(prev => ({ ...prev, client: new Date() }));
  };
  
  const handleInvalidateAllCache = () => {
    invalidateAllCache();
    setLastInvalidated({
      order: new Date(),
      invoice: new Date(),
      client: new Date(),
      all: new Date()
    });
  };
  
  // Giá trị của context
  const value: CacheContextType = {
    invalidateOrderCache: handleInvalidateOrderCache,
    invalidateInvoiceCache: handleInvalidateInvoiceCache,
    invalidateClientCache: handleInvalidateClientCache,
    invalidateAllCache: handleInvalidateAllCache,
    lastInvalidated
  };
  
  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};
