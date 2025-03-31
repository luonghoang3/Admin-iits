'use client'

import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'

export default function AuthCheck({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    let isMounted = true;
    
    async function checkAuth() {
      try {
        const supabase = createClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          throw authError;
        }
        
        if (!isMounted) return;
        
        if (!session) {
          redirect('/login')
        } else {
          setIsLoading(false)
        }
      } catch (err: any) {
        console.error('Lỗi xác thực:', err)
        if (isMounted) {
          setError(err.message || 'Có lỗi xảy ra khi kiểm tra xác thực.')
          setIsLoading(false)
        }
      }
    }
    
    checkAuth()
    
    return () => {
      isMounted = false;
    };
  }, [])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <ReloadIcon className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang kiểm tra xác thực...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Lỗi kết nối</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="text-muted-foreground mb-4">Vui lòng kiểm tra kết nối mạng và cấu hình Supabase của bạn.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  return <>{children}</>
} 