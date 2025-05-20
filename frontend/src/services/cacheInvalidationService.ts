/**
 * Service để quản lý việc invalidate cache
 */

import { 
  invalidateCache, 
  invalidateHookCache, 
  createCacheKey 
} from '@/utils/cache-utils';
import logger from '@/lib/logger';
import { createClient } from '@/utils/supabase/client';

// Singleton Supabase client
const supabaseClient = createClient();

// Các hook names cần invalidate
const HOOK_NAMES = {
  DASHBOARD_STATS: 'useDashboardStats',
  ORDERS_LIST: 'useOrdersList',
  TOP_CLIENTS: 'useTopClients',
  AVAILABLE_YEARS: 'useAvailableYears',
};

// Các table names trong Supabase
const TABLE_NAMES = {
  ORDERS: 'orders',
  INVOICES: 'invoices',
  CLIENTS: 'clients',
  INVOICE_DETAILS: 'invoice_details',
};

/**
 * Invalidate cache khi có thay đổi đơn hàng
 * @param orderId ID của đơn hàng (optional)
 */
export function invalidateOrderCache(orderId?: string) {
  try {
    // Invalidate useDashboardStats hook
    invalidateHookCache(HOOK_NAMES.DASHBOARD_STATS);
    
    // Invalidate useOrdersList hook
    invalidateHookCache(HOOK_NAMES.ORDERS_LIST);
    
    // Invalidate useAvailableYears hook (vì có thể thêm năm mới)
    invalidateHookCache(HOOK_NAMES.AVAILABLE_YEARS);
    
    // Log thông tin
    logger.info(`Đã invalidate cache liên quan đến đơn hàng${orderId ? ` (ID: ${orderId})` : ''}`);
    
    // Broadcast event để các clients khác cũng invalidate cache
    broadcastInvalidation('order', orderId);
  } catch (error) {
    logger.error('Lỗi khi invalidate order cache:', error);
  }
}

/**
 * Invalidate cache khi có thay đổi hóa đơn
 * @param invoiceId ID của hóa đơn (optional)
 */
export function invalidateInvoiceCache(invoiceId?: string) {
  try {
    // Invalidate useDashboardStats hook
    invalidateHookCache(HOOK_NAMES.DASHBOARD_STATS);
    
    // Invalidate useTopClients hook (vì doanh thu thay đổi)
    invalidateHookCache(HOOK_NAMES.TOP_CLIENTS);
    
    // Log thông tin
    logger.info(`Đã invalidate cache liên quan đến hóa đơn${invoiceId ? ` (ID: ${invoiceId})` : ''}`);
    
    // Broadcast event để các clients khác cũng invalidate cache
    broadcastInvalidation('invoice', invoiceId);
  } catch (error) {
    logger.error('Lỗi khi invalidate invoice cache:', error);
  }
}

/**
 * Invalidate cache khi có thay đổi khách hàng
 * @param clientId ID của khách hàng (optional)
 */
export function invalidateClientCache(clientId?: string) {
  try {
    // Invalidate useDashboardStats hook
    invalidateHookCache(HOOK_NAMES.DASHBOARD_STATS);
    
    // Invalidate useTopClients hook
    invalidateHookCache(HOOK_NAMES.TOP_CLIENTS);
    
    // Log thông tin
    logger.info(`Đã invalidate cache liên quan đến khách hàng${clientId ? ` (ID: ${clientId})` : ''}`);
    
    // Broadcast event để các clients khác cũng invalidate cache
    broadcastInvalidation('client', clientId);
  } catch (error) {
    logger.error('Lỗi khi invalidate client cache:', error);
  }
}

/**
 * Invalidate tất cả cache
 */
export function invalidateAllCache() {
  try {
    // Invalidate tất cả hooks
    Object.values(HOOK_NAMES).forEach(hookName => {
      invalidateHookCache(hookName);
    });
    
    // Log thông tin
    logger.info('Đã invalidate tất cả cache');
    
    // Broadcast event để các clients khác cũng invalidate cache
    broadcastInvalidation('all');
  } catch (error) {
    logger.error('Lỗi khi invalidate tất cả cache:', error);
  }
}

/**
 * Broadcast event invalidation để các clients khác cũng invalidate cache
 * @param type Loại dữ liệu thay đổi
 * @param id ID của dữ liệu (optional)
 */
function broadcastInvalidation(type: 'order' | 'invoice' | 'client' | 'all', id?: string) {
  try {
    // Sử dụng Supabase Realtime để broadcast event
    supabaseClient
      .channel('cache-invalidation')
      .send({
        type: 'broadcast',
        event: 'cache-invalidation',
        payload: { type, id, timestamp: Date.now() }
      });
  } catch (error) {
    logger.error('Lỗi khi broadcast invalidation event:', error);
  }
}

/**
 * Setup listeners cho các sự kiện thay đổi dữ liệu từ Supabase
 */
export function setupCacheInvalidationListeners() {
  try {
    // Lắng nghe sự kiện thay đổi đơn hàng
    supabaseClient
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: TABLE_NAMES.ORDERS
      }, (payload) => {
        logger.info('Nhận được sự kiện thay đổi đơn hàng:', payload);
        invalidateOrderCache(payload.new?.id || payload.old?.id);
      })
      .subscribe();
    
    // Lắng nghe sự kiện thay đổi hóa đơn
    supabaseClient
      .channel('invoices-changes')
      .on('postgres_changes', {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: TABLE_NAMES.INVOICES
      }, (payload) => {
        logger.info('Nhận được sự kiện thay đổi hóa đơn:', payload);
        invalidateInvoiceCache(payload.new?.id || payload.old?.id);
      })
      .subscribe();
    
    // Lắng nghe sự kiện thay đổi chi tiết hóa đơn
    supabaseClient
      .channel('invoice-details-changes')
      .on('postgres_changes', {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: TABLE_NAMES.INVOICE_DETAILS
      }, (payload) => {
        logger.info('Nhận được sự kiện thay đổi chi tiết hóa đơn:', payload);
        // Lấy invoice_id từ payload
        const invoiceId = payload.new?.invoice_id || payload.old?.invoice_id;
        if (invoiceId) {
          invalidateInvoiceCache(invoiceId);
        }
      })
      .subscribe();
    
    // Lắng nghe sự kiện thay đổi khách hàng
    supabaseClient
      .channel('clients-changes')
      .on('postgres_changes', {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: TABLE_NAMES.CLIENTS
      }, (payload) => {
        logger.info('Nhận được sự kiện thay đổi khách hàng:', payload);
        invalidateClientCache(payload.new?.id || payload.old?.id);
      })
      .subscribe();
    
    // Lắng nghe sự kiện broadcast invalidation
    supabaseClient
      .channel('cache-invalidation')
      .on('broadcast', { event: 'cache-invalidation' }, (payload) => {
        logger.info('Nhận được sự kiện broadcast invalidation:', payload);
        
        // Xử lý theo loại dữ liệu
        switch (payload.payload.type) {
          case 'order':
            invalidateOrderCache(payload.payload.id);
            break;
          case 'invoice':
            invalidateInvoiceCache(payload.payload.id);
            break;
          case 'client':
            invalidateClientCache(payload.payload.id);
            break;
          case 'all':
            invalidateAllCache();
            break;
        }
      })
      .subscribe();
    
    logger.info('Đã setup cache invalidation listeners');
  } catch (error) {
    logger.error('Lỗi khi setup cache invalidation listeners:', error);
  }
}
