'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { BasicTooltip } from '@/components/ui/basic-tooltip';
import { ReactNode } from 'react';

interface SidebarMenuItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
}

export function SidebarMenuItem({ href, icon, label, isActive }: SidebarMenuItemProps) {
  const { isOpen } = useSidebar();

  const menuButton = (
    <Button
      asChild
      variant={isActive ? 'default' : 'ghost'}
      className={cn(
        "w-full transition-all duration-200",
        isOpen ? "justify-start text-sm" : "justify-center hover:bg-gray-800"
      )}
    >
      <Link href={href} className="flex items-center">
        <span className={cn(
          "h-5 w-5 transition-all duration-200",
          isOpen ? "mr-3" : "",
          !isOpen && (isActive ? "bg-primary text-primary-foreground p-1 rounded-md" : "text-white p-1 hover:text-primary-foreground")
        )}>
          {icon}
        </span>
        {isOpen && label}
      </Link>
    </Button>
  );

  if (!isOpen) {
    return (
      <BasicTooltip
        content={<span className="font-medium">{label}</span>}
        side="right"
      >
        {menuButton}
      </BasicTooltip>
    );
  }

  return menuButton;
}
