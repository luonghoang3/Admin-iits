'use client';

import { ReactNode, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SimpleTooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function SimpleTooltip({
  children,
  content,
  side = 'right',
  className
}: SimpleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative inline-flex w-full">
      <div
        ref={triggerRef}
        className="w-full"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            'fixed z-[9999] px-3 py-2 text-sm font-medium bg-white text-gray-900 rounded-md shadow-lg whitespace-nowrap',
            'pointer-events-none border border-gray-200',
            'animate-in fade-in-50 zoom-in-95 data-[side=right]:slide-in-from-left-2',
            className
          )}
          style={{
            left: side === 'right' ? 'calc(var(--tooltip-x) + 15px)' :
                  side === 'left' ? 'calc(var(--tooltip-x) - 15px - 100%)' :
                  'calc(var(--tooltip-x) - 50%)',
            top: side === 'bottom' ? 'calc(var(--tooltip-y) + 15px)' :
                 side === 'top' ? 'calc(var(--tooltip-y) - 15px - 100%)' :
                 'calc(var(--tooltip-y) - 50%)',
          }}
          ref={(el) => {
            if (el && triggerRef.current && typeof window !== 'undefined') {
              const rect = triggerRef.current.getBoundingClientRect();
              if (rect) {
                if (side === 'right') {
                  el.style.setProperty('--tooltip-x', `${rect.right}px`);
                  el.style.setProperty('--tooltip-y', `${rect.top + rect.height/2}px`);
                } else if (side === 'left') {
                  el.style.setProperty('--tooltip-x', `${rect.left}px`);
                  el.style.setProperty('--tooltip-y', `${rect.top + rect.height/2}px`);
                } else if (side === 'top') {
                  el.style.setProperty('--tooltip-x', `${rect.left + rect.width/2}px`);
                  el.style.setProperty('--tooltip-y', `${rect.top}px`);
                } else { // bottom
                  el.style.setProperty('--tooltip-x', `${rect.left + rect.width/2}px`);
                  el.style.setProperty('--tooltip-y', `${rect.bottom}px`);
                }
              }
            }
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
