'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { SidebarMenuItem } from './SidebarMenuItem';
import { SidebarGroup } from './SidebarGroup';
// @ts-ignore
import PanelLeftClose from 'lucide-react/dist/esm/icons/panel-left-close';
// @ts-ignore
import PanelLeft from 'lucide-react/dist/esm/icons/panel-left';
import { Button } from '@/components/ui/button';

// Import từng icon riêng lẻ
// @ts-ignore
import Home from 'lucide-react/dist/esm/icons/home';
// @ts-ignore
import Users2 from 'lucide-react/dist/esm/icons/users-2';
// @ts-ignore
import Users from 'lucide-react/dist/esm/icons/users';
// @ts-ignore
import Building2 from 'lucide-react/dist/esm/icons/building-2';
// @ts-ignore
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
// @ts-ignore
import Ruler from 'lucide-react/dist/esm/icons/ruler';
// @ts-ignore
import Package2 from 'lucide-react/dist/esm/icons/package-2';
// @ts-ignore
import Layers from 'lucide-react/dist/esm/icons/layers';
// @ts-ignore
import Contact from 'lucide-react/dist/esm/icons/contact';
// @ts-ignore
import UserCog from 'lucide-react/dist/esm/icons/user-cog';
// @ts-ignore
import BoxesIcon from 'lucide-react/dist/esm/icons/boxes';
// @ts-ignore
import FileText from 'lucide-react/dist/esm/icons/file-text';

const Sidebar = () => {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();

  return (
    <div
      className={cn(
        "h-full border-r transition-all duration-300",
        isOpen ? "w-64 bg-card" : "w-16 bg-gray-900"
      )}
    >
      <div className={cn(
        "flex h-16 shrink-0 items-center justify-center px-2 border-b relative",
        !isOpen && "border-gray-800"
      )}>
        {isOpen && (
          <h1 className="text-lg font-semibold text-card-foreground transition-opacity duration-300">
            Admin IITS
          </h1>
        )}
        <Button
          variant={isOpen ? "ghost" : "default"}
          size="icon"
          onClick={toggle}
          className={cn(
            "h-8 w-8 rounded-full transition-all duration-300 absolute shadow-sm hover:shadow",
            isOpen ? "right-2" : "left-1/2 -translate-x-1/2 bg-white text-gray-900"
          )}
          title={isOpen ? "Thu gọn sidebar" : "Mở rộng sidebar"}
        >
          {isOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
        </Button>
      </div>
      <nav className={cn(
        "space-y-3 py-3 overflow-y-auto",
        isOpen ? "px-3" : "px-2 flex flex-col items-center"
      )}
        style={{ maxHeight: "calc(100vh - 64px)" }}>

        <SidebarMenuItem
          href="/dashboard"
          icon={<Home />}
          label="Dashboard"
          isActive={pathname === '/dashboard'}
        />

        <SidebarGroup title="Quản lý người dùng" icon={<UserCog />}>
          <SidebarMenuItem
            href="/dashboard/users"
            icon={<Users2 />}
            label="Quản lý người dùng"
            isActive={pathname.includes('/dashboard/users')}
          />

          <SidebarMenuItem
            href="/dashboard/teams"
            icon={<Users />}
            label="Quản lý nhóm"
            isActive={pathname.includes('/dashboard/teams')}
          />
        </SidebarGroup>

        <SidebarGroup title="Quản lý khách hàng" icon={<Building2 />}>
          <SidebarMenuItem
            href="/dashboard/clients"
            icon={<Building2 />}
            label="Quản lý khách hàng"
            isActive={pathname.includes('/dashboard/clients')}
          />

          <SidebarMenuItem
            href="/dashboard/contacts"
            icon={<Contact />}
            label="Quản lý liên hệ"
            isActive={pathname.includes('/dashboard/contacts')}
          />
        </SidebarGroup>

        <SidebarMenuItem
          href="/dashboard/orders"
          icon={<ClipboardList />}
          label="Quản lý đơn hàng"
          isActive={pathname.includes('/dashboard/orders') && !pathname.includes('/dashboard/orders/invoices')}
        />

        <SidebarMenuItem
          href="/dashboard/invoices"
          icon={<FileText />}
          label="Quản lý hóa đơn"
          isActive={pathname.includes('/dashboard/invoices')}
        />

        <SidebarGroup title="Quản lý hàng giám định" icon={<BoxesIcon />}>
          <SidebarMenuItem
            href="/dashboard/categories"
            icon={<Layers />}
            label="Quản lý danh mục"
            isActive={pathname.includes('/dashboard/categories')}
          />

          <SidebarMenuItem
            href="/dashboard/commodities"
            icon={<Package2 />}
            label="Quản lý hàng hóa (Mới)"
            isActive={pathname.includes('/dashboard/commodities')}
          />

          <SidebarMenuItem
            href="/dashboard/units"
            icon={<Ruler />}
            label="Quản lý đơn vị tính"
            isActive={pathname.includes('/dashboard/units')}
          />
        </SidebarGroup>
      </nav>
    </div>
  );
};

export default Sidebar;