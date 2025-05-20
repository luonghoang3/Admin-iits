'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Database, RefreshCw, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useCache } from '@/contexts/CacheContext'
import { invalidateHookCache, clearAllCache } from '@/utils/cache-utils'
import logger from '@/lib/logger'

interface CacheManagerDropdownProps {
  onClearStats?: () => void
  onClearOrders?: () => void
  onClearClients?: () => void
}

export default function CacheManagerDropdown({
  onClearStats,
  onClearOrders,
  onClearClients
}: CacheManagerDropdownProps) {
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
        title: "Đã làm mới dữ liệu",
        description: `Dữ liệu ${getHookDisplayName(hookName)} đã được làm mới.`,
        variant: "default"
      })
      
      logger.info(`Đã xóa cache của ${hookName}`)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể làm mới dữ liệu. Vui lòng thử lại.",
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
        title: "Đã làm mới tất cả dữ liệu",
        description: "Tất cả dữ liệu đã được làm mới thành công.",
        variant: "default"
      })
      
      logger.info("Đã xóa tất cả cache")
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể làm mới dữ liệu. Vui lòng thử lại.",
        variant: "destructive"
      })
      
      logger.error("Lỗi khi xóa tất cả cache:", error)
    } finally {
      setIsClearing(false)
    }
  }

  // Lấy tên hiển thị cho hook
  const getHookDisplayName = (hookName: string): string => {
    switch (hookName) {
      case 'useDashboardStats':
        return 'thống kê'
      case 'useOrdersList':
        return 'danh sách đơn hàng'
      case 'useTopClients':
        return 'khách hàng hàng đầu'
      default:
        return hookName
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={isClearing}>
          <Database className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Quản lý dữ liệu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Làm mới dữ liệu</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => clearHookCache('useDashboardStats', onClearStats)}
          disabled={isClearing}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          <span>Làm mới thống kê</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => clearHookCache('useOrdersList', onClearOrders)}
          disabled={isClearing}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          <span>Làm mới danh sách đơn hàng</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => clearHookCache('useTopClients', onClearClients)}
          disabled={isClearing}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          <span>Làm mới khách hàng hàng đầu</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={clearAllCaches}
          disabled={isClearing}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Làm mới tất cả dữ liệu</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
