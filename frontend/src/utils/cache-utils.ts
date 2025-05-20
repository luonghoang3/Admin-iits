/**
 * Utility functions for managing cache in hooks
 */

import logger from '@/lib/logger';

// Thời gian sống mặc định của cache (15 phút)
const DEFAULT_CACHE_TTL = 15 * 60 * 1000;

// Prefix cho cache keys để tránh xung đột
const CACHE_PREFIX = 'admin-iits-cache';

/**
 * Tạo cache key từ các tham số
 * @param hookName Tên của hook
 * @param params Các tham số để tạo key
 * @returns Cache key
 */
export function createCacheKey(hookName: string, params: Record<string, any>): string {
  const paramString = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}:${value}`)
    .join('-');
  
  return `${CACHE_PREFIX}-${hookName}-${paramString}`;
}

/**
 * Interface cho cache entry
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Lưu dữ liệu vào memory cache
 * @param key Cache key
 * @param data Dữ liệu cần lưu
 * @param ttl Thời gian sống (ms)
 * @param memoryCache Object lưu trữ cache
 */
export function setMemoryCache<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_CACHE_TTL,
  memoryCache: Record<string, CacheEntry<T>>
): Record<string, CacheEntry<T>> {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl
  };
  
  return {
    ...memoryCache,
    [key]: entry
  };
}

/**
 * Lấy dữ liệu từ memory cache
 * @param key Cache key
 * @param memoryCache Object lưu trữ cache
 * @returns Dữ liệu từ cache hoặc null nếu không tìm thấy hoặc hết hạn
 */
export function getMemoryCache<T>(
  key: string,
  memoryCache: Record<string, CacheEntry<T>>
): T | null {
  const entry = memoryCache[key];
  
  if (!entry) {
    return null;
  }
  
  // Kiểm tra xem cache có hết hạn không
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    // Cache đã hết hạn
    logger.info(`Cache expired for key: ${key}`);
    return null;
  }
  
  logger.info(`Cache hit for key: ${key}`);
  return entry.data;
}

/**
 * Lưu cache vào localStorage
 * @param key Cache key
 * @param data Dữ liệu cần lưu
 * @param ttl Thời gian sống (ms)
 */
export function setPersistentCache<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_CACHE_TTL
): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    localStorage.setItem(key, JSON.stringify(entry));
    logger.info(`Saved to persistent cache: ${key}`);
  } catch (error) {
    logger.error(`Error saving to persistent cache: ${error}`);
  }
}

/**
 * Lấy dữ liệu từ localStorage
 * @param key Cache key
 * @returns Dữ liệu từ cache hoặc null nếu không tìm thấy hoặc hết hạn
 */
export function getPersistentCache<T>(key: string): T | null {
  try {
    const entryString = localStorage.getItem(key);
    
    if (!entryString) {
      return null;
    }
    
    const entry: CacheEntry<T> = JSON.parse(entryString);
    
    // Kiểm tra xem cache có hết hạn không
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Cache đã hết hạn, xóa khỏi localStorage
      localStorage.removeItem(key);
      logger.info(`Persistent cache expired for key: ${key}`);
      return null;
    }
    
    logger.info(`Persistent cache hit for key: ${key}`);
    return entry.data;
  } catch (error) {
    logger.error(`Error reading from persistent cache: ${error}`);
    return null;
  }
}

/**
 * Xóa một cache entry cụ thể
 * @param key Cache key
 */
export function invalidateCache(key: string): void {
  try {
    localStorage.removeItem(key);
    logger.info(`Invalidated cache for key: ${key}`);
  } catch (error) {
    logger.error(`Error invalidating cache: ${error}`);
  }
}

/**
 * Xóa tất cả cache entries của một hook
 * @param hookName Tên của hook
 */
export function invalidateHookCache(hookName: string): void {
  try {
    const prefix = `${CACHE_PREFIX}-${hookName}`;
    
    // Lấy tất cả keys trong localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        localStorage.removeItem(key);
        logger.info(`Invalidated cache for key: ${key}`);
      }
    }
  } catch (error) {
    logger.error(`Error invalidating hook cache: ${error}`);
  }
}

/**
 * Xóa tất cả cache entries
 */
export function clearAllCache(): void {
  try {
    // Lấy tất cả keys trong localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
    logger.info('Cleared all cache');
  } catch (error) {
    logger.error(`Error clearing all cache: ${error}`);
  }
}
