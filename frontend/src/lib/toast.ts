/**
 * Đối tượng thông báo đơn giản thay thế cho thư viện toast
 */
export const toast = {
  /**
   * Hiển thị một thông báo
   */
  toast: (options: {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => {
    console.log(`Toast: ${options.title} - ${options.description} [${options.variant || 'default'}]`);
    // Trong thực tế, cần hiển thị toast UI - thay thế bằng console.log cho đơn giản
  }
}; 