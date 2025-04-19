'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface BasicTooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function BasicTooltip({
  children,
  content,
  side = 'right'
}: BasicTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex w-full">
      <div
        className="w-full"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            'absolute z-[9999] px-3 py-2 text-sm font-medium bg-white text-gray-900 rounded-md shadow-lg whitespace-nowrap',
            'pointer-events-none border border-gray-200',
            {
              'left-full top-1/2 -translate-y-1/2 ml-2': side === 'right',
              'right-full top-1/2 -translate-y-1/2 mr-2': side === 'left',
              'bottom-full left-1/2 -translate-x-1/2 mb-2': side === 'top',
              'top-full left-1/2 -translate-x-1/2 mt-2': side === 'bottom',
            }
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
