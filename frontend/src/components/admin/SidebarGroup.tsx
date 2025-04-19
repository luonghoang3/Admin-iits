'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { BasicTooltip } from '@/components/ui/basic-tooltip';
import { Button } from '@/components/ui/button';

// @ts-ignore
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
// @ts-ignore
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';

interface SidebarGroupProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function SidebarGroup({ title, icon, children, defaultOpen = true }: SidebarGroupProps) {
  const { isOpen } = useSidebar();
  const [isGroupOpen, setIsGroupOpen] = useState(defaultOpen);

  const toggleGroup = () => {
    setIsGroupOpen(!isGroupOpen);
  };

  const groupButton = (
    <Button
      variant={isOpen ? "ghost" : (isGroupOpen ? "default" : "ghost")}
      className={cn(
        "w-full transition-all duration-200 mb-1",
        isOpen ? "justify-start text-sm font-medium" : "justify-center hover:bg-gray-800"
      )}
      onClick={toggleGroup}
    >
      <div className="flex items-center w-full relative">
        {!isOpen && isGroupOpen && (
          <span className="absolute w-2 h-2 bg-primary rounded-full right-0 top-0 transform translate-x-1/2 -translate-y-1/2"></span>
        )}
        <span className={cn(
          "h-5 w-5 transition-all duration-200",
          isOpen ? "mr-2" : "",
          !isOpen && (isGroupOpen ? "bg-primary text-primary-foreground p-1 rounded-md" : "bg-gray-700 text-white p-1 rounded-md hover:bg-gray-600")
        )}>
          {icon}
        </span>
        {isOpen && (
          <>
            <span className="flex-1 text-left">{title}</span>
            <span className="ml-2">
              {isGroupOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          </>
        )}
      </div>
    </Button>
  );

  return (
    <div className="mb-3">
      {isOpen ? (
        groupButton
      ) : (
        <BasicTooltip
          content={<span className="font-medium">{title}</span>}
          side="right"
        >
          {groupButton}
        </BasicTooltip>
      )}

      {isGroupOpen && (
        <div className={cn(
          "space-y-1 transition-all",
          isOpen ? "pl-2 border-l-2 border-muted ml-3" : ""
        )}>
          {children}
        </div>
      )}
    </div>
  );
}
