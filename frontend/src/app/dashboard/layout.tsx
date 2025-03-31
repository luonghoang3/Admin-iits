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
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </AuthCheck>
  )
} 