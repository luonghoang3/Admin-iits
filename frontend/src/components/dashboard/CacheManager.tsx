'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, RefreshCw, Database } from "lucide-react"
import { clearAllCache, invalidateHookCache } from '@/utils/cache-utils'
import { useToast } from "@/components/ui/use-toast"
import logger from '@/lib/logger'
import { useCache } from '@/contexts/CacheContext'

interface CacheManagerProps {
  onClearStats?: () => void
  onClearOrders?: () => void
  onClearClients?: () => void
}

export default function CacheManager({
  onClearStats,
  onClearOrders,
  onClearClients
}: CacheManagerProps) {
  const { toast } = useToast()
  const [isClearing, setIsClearing] = useState(false)
  const { invalidateAllCache } = useCache()

  // Xóa cache của một hook cụ thể
  const clearHookCache = (hookName: string, callback?: () => void) => {
    setIsClearing(true)
    try {
      invalidateHookCache(hookName)

      // Gọi callback nếu có
      if (callback) {
        callback()
      }

      toast({
        title: "Đã xóa cache",
        description: `Cache của ${hookName} đã được xóa thành công.`,
        variant: "default"
      })

      logger.info(`Đã xóa cache của ${hookName}`)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa cache. Vui lòng thử lại.",
        variant: "destructive"
      })

      logger.error(`Lỗi khi xóa cache của ${hookName}:`, error)
    } finally {
      setIsClearing(false)
    }
  }

  // Xóa tất cả cache
  const clearAllCaches = () => {
    setIsClearing(true)
    try {
      // Sử dụng cả utility function và context function
      clearAllCache() // Xóa cache trong localStorage
      invalidateAllCache() // Broadcast event để các clients khác cũng invalidate cache

      // Gọi tất cả callbacks
      if (onClearStats) onClearStats()
      if (onClearOrders) onClearOrders()
      if (onClearClients) onClearClients()

      toast({
        title: "Đã xóa tất cả cache",
        description: "Tất cả cache đã được xóa thành công.",
        variant: "default"
      })

      logger.info("Đã xóa tất cả cache")
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa cache. Vui lòng thử lại.",
        variant: "destructive"
      })

      logger.error("Lỗi khi xóa tất cả cache:", error)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Quản lý Cache
        </CardTitle>
        <CardDescription>
          Xóa cache để tải dữ liệu mới nhất từ server
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="individual">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Xóa từng phần</TabsTrigger>
            <TabsTrigger value="all">Xóa tất cả</TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => clearHookCache('useDashboardStats', onClearStats)}
                disabled={isClearing}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Xóa cache thống kê
              </Button>

              <Button
                variant="outline"
                className="justify-start"
                onClick={() => clearHookCache('useOrdersList', onClearOrders)}
                disabled={isClearing}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Xóa cache danh sách đơn hàng
              </Button>

              <Button
                variant="outline"
                className="justify-start"
                onClick={() => clearHookCache('useTopClients', onClearClients)}
                disabled={isClearing}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Xóa cache khách hàng hàng đầu
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="all" className="pt-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Xóa tất cả cache sẽ tải lại toàn bộ dữ liệu từ server. Điều này có thể mất một chút thời gian.
              </p>

              <Button
                variant="destructive"
                onClick={clearAllCaches}
                disabled={isClearing}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa tất cả cache
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Cache giúp tăng tốc độ tải trang nhưng có thể không hiển thị dữ liệu mới nhất.
      </CardFooter>
    </Card>
  )
}
