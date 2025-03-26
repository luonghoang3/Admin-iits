'use client'

import Sidebar from '@/components/admin/Sidebar'
import { ReactNode } from 'react'
import AuthCheck from '@/components/auth/AuthCheck'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthCheck>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </AuthCheck>
  )
} 