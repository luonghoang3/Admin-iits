import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="h-full min-h-screen bg-gray-800">
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-lg font-semibold text-white">Admin IITS</h1>
      </div>
      <nav className="space-y-1 px-3 py-3">
        <Link 
          href="/dashboard" 
          className={`${pathname === '/dashboard' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} flex items-center px-2 py-2 text-sm font-medium rounded-md group`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`${pathname === '/dashboard' ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'} mr-3 flex-shrink-0 h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </Link>
        
        <Link 
          href="/dashboard/users" 
          className={`${pathname.includes('/dashboard/users') ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} flex items-center px-2 py-2 text-sm font-medium rounded-md group`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`${pathname.includes('/dashboard/users') ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'} mr-3 flex-shrink-0 h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Quản lý người dùng
        </Link>
        
        <Link 
          href="/dashboard/teams" 
          className={`${pathname.includes('/dashboard/teams') ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} flex items-center px-2 py-2 text-sm font-medium rounded-md group`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`${pathname.includes('/dashboard/teams') ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'} mr-3 flex-shrink-0 h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Quản lý nhóm
        </Link>
        
        <Link 
          href="/dashboard/clients" 
          className={`${pathname.includes('/dashboard/clients') ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} flex items-center px-2 py-2 text-sm font-medium rounded-md group`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`${pathname.includes('/dashboard/clients') ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'} mr-3 flex-shrink-0 h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Quản lý khách hàng
        </Link>
        
        <Link 
          href="/dashboard/orders" 
          className={`${pathname.includes('/dashboard/orders') ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} flex items-center px-2 py-2 text-sm font-medium rounded-md group`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`${pathname.includes('/dashboard/orders') ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'} mr-3 flex-shrink-0 h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Quản lý đơn hàng
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar; 