'use client'

import { useEffect } from 'react'

/**
 * Component để sửa lỗi accessibility với Radix UI
 * Ghi đè phương thức setAttribute để ngăn chặn việc thêm aria-hidden vào các phần tử có focus
 */
export default function AccessibilityFix() {
  useEffect(() => {
    // Lưu trữ phương thức setAttribute gốc
    const originalSetAttribute = Element.prototype.setAttribute

    // Ghi đè phương thức setAttribute
    Element.prototype.setAttribute = function(name: string, value: string) {
      // Nếu đang cố gắng thêm aria-hidden="true" vào một phần tử
      if (name === 'aria-hidden' && value === 'true') {
        // Kiểm tra xem phần tử này hoặc con của nó có đang được focus không
        if (this.contains(document.activeElement)) {
          // Nếu có, không thêm thuộc tính aria-hidden
          console.log('Prevented aria-hidden on element containing focus')
          return
        }
      }
      
      // Nếu không phải aria-hidden hoặc không chứa focus, thực hiện như bình thường
      return originalSetAttribute.call(this, name, value)
    }

    // Cleanup function để khôi phục phương thức gốc khi component unmount
    return () => {
      Element.prototype.setAttribute = originalSetAttribute
    }
  }, [])

  return null
}
