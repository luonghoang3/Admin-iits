'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardClientProps {
  user: User
  userRole: string | null
}

export default function DashboardClient({ user, userRole }: DashboardClientProps) {
  const [error, setError] = useState<string | null>(null)
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Xin chào, {user?.email}</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Thống kê */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Thống kê người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">0</div>
            <p className="text-muted-foreground mt-1">Tổng số người dùng</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Hoạt động hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">0</div>
            <p className="text-muted-foreground mt-1">Người dùng hoạt động</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Báo cáo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">0</div>
            <p className="text-muted-foreground mt-1">Báo cáo mới</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hoạt động gần đây */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground text-center py-6">Chưa có hoạt động nào.</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Công việc */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Công việc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-muted-foreground text-center py-6">Chưa có công việc nào.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 