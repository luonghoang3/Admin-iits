/**
 * Logger utility to control console output based on environment
 *
 * In development: All logs are shown
 * In production: Only errors are shown, other logs are suppressed
 *
 * Special case: Performance logs are always shown when they start with [Performance]
 */

// Ghi đè các phương thức console để tắt tất cả các log
// Lưu ý: Chỉ nên sử dụng trong môi trường production
if (typeof window !== 'undefined') {
  // Giữ lại tham chiếu đến các phương thức gốc
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;
  const originalConsoleWarn = console.warn;

  // Ghi đè các phương thức
  console.log = function(...args) {
    // Cho phép log hiệu năng
    if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('[Performance]')) {
      originalConsoleLog.apply(console, args);
    }
  };

  console.info = function(...args) {
    // Cho phép log hiệu năng
    if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('[Performance]')) {
      originalConsoleInfo.apply(console, args);
    }
  };

  console.debug = function(...args) {
    // Cho phép log hiệu năng
    if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('[Performance]')) {
      originalConsoleDebug.apply(console, args);
    }
  };

  console.warn = function(...args) {
    // Cho phép log hiệu năng
    if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('[Performance]')) {
      originalConsoleWarn.apply(console, args);
    }
  };
}

// Check if we're in development environment
// Tạm thời tắt tất cả các log trong môi trường development
// const isDevelopment = process.env.NODE_ENV === 'development';
const isDevelopment = false; // Tắt tất cả các log trừ error

// Logger object with controlled console methods
const logger = {
  // Always show errors in any environment
  error: (...args: any[]) => {
    console.error(...args);
  },

  // Only show warnings in development or if explicitly enabled
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  // Only show info logs in development
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  // Only show regular logs in development
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // Only show debug logs in development
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  // Group logs (development only)
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  // End group (development only)
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  // Table output (development only)
  table: (data: any, columns?: string[]) => {
    if (isDevelopment) {
      console.table(data, columns);
    }
  }
};

export default logger;
