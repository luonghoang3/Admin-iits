'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { use } from 'react'

// ShadCN components
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"

// Icons
// @ts-ignore
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left'
// @ts-ignore
import Plus from 'lucide-react/dist/esm/icons/plus'
// @ts-ignore
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal'
// @ts-ignore
import ArrowRightLeft from 'lucide-react/dist/esm/icons/arrow-right-left'
import logger from '@/lib/logger'

interface Commodity {
  id: string
  name: string
  description: string | null
  category_id: string | null
  created_at: string
  updated_at: string | null
}

interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string | null
}

export default function CategoryDetailPage({ params }: { params: { id: string } }) {
  // Access params directly
  const categoryId = params.id
  
  const router = useRouter()
  const [category, setCategory] = useState<Category | null>(null)
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal dialog states
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [targetCategoryId, setTargetCategoryId] = useState<string>('')
  
  // For multi-selection
  const [selectedCommodities, setSelectedCommodities] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  
  // Search functionality
  const [searchTerm, setSearchTerm] = useState('')
  
  // Load category details and commodities
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // Lấy thông tin danh mục
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', categoryId)
          .single()
        
        if (categoryError) throw categoryError
        setCategory(categoryData)
        
        // Lấy danh sách hàng hóa thuộc danh mục này
        const { data: commoditiesData, error: commoditiesError } = await supabase
          .from('commodities')
          .select('*')
          .eq('category_id', categoryId)
          .order('name')
        
        if (commoditiesError) throw commoditiesError
        setCommodities(commoditiesData || [])
        
        // Lấy danh sách tất cả các danh mục (trừ danh mục hiện tại)
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .neq('id', categoryId)
          .order('name')
        
        if (categoriesError) throw categoriesError
        setCategories(categoriesData || [])
        
      } catch (err: any) {
        logger.error('Error loading data:', err)
        setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [categoryId])
  
  // Handle selecting all commodities
  useEffect(() => {
    if (selectAll) {
      setSelectedCommodities(commodities.map(c => c.id))
    } else {
      setSelectedCommodities([])
    }
  }, [selectAll, commodities])
  
  // Toggle individual commodity selection
  const toggleCommoditySelection = (commodityId: string) => {
    setSelectedCommodities(prev => {
      if (prev.includes(commodityId)) {
        return prev.filter(id => id !== commodityId)
      } else {
        return [...prev, commodityId]
      }
    })
  }
  
  // Filter commodities by search term
  const filteredCommodities = commodities.filter(commodity => 
    commodity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (commodity.description && commodity.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  
  // Move selected commodities to a different category
  const handleMoveCommodities = async () => {
    if (!targetCategoryId || selectedCommodities.length === 0) {
      return
    }
    
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Update each selected commodity with the new category_id
      for (const commodityId of selectedCommodities) {
        const { error } = await supabase
          .from('commodities')
          .update({ 
            category_id: targetCategoryId,
            updated_at: new Date().toISOString() 
          })
          .eq('id', commodityId)
        
        if (error) throw error
      }
      
      // Refresh the commodities list
      const { data: updatedCommodities, error: commoditiesError } = await supabase
        .from('commodities')
        .select('*')
        .eq('category_id', categoryId)
        .order('name')
      
      if (commoditiesError) throw commoditiesError
      setCommodities(updatedCommodities || [])
      
      // Reset selection
      setSelectedCommodities([])
      setSelectAll(false)
      setShowMoveDialog(false)
      
    } catch (err: any) {
      logger.error('Error moving commodities:', err)
      setError(err.message || 'Đã xảy ra lỗi khi di chuyển hàng hóa')
    } finally {
      setLoading(false)
    }
  }
  
  // Delete a commodity
  const handleDeleteCommodity = async (commodityId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hàng hóa này?')) {
      return
    }
    
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Xóa commodity
      const { error } = await supabase
        .from('commodities')
        .delete()
        .eq('id', commodityId)
      
      if (error) throw error
      
      // Cập nhật danh sách
      setCommodities(prev => prev.filter(c => c.id !== commodityId))
      
    } catch (err: any) {
      logger.error('Error deleting commodity:', err)
      setError(err.message || 'Đã xảy ra lỗi khi xóa hàng hóa')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading && !category) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-pulse text-lg">Đang tải...</div>
      </div>
    )
  }
  
  if (!category) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            Không tìm thấy danh mục. Vui lòng thử lại hoặc quay lại trang danh sách.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/dashboard/categories">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Link>
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/categories">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Danh sách danh mục
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{category.name}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/dashboard/commodities/add?category=${categoryId}`}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm hàng hóa
            </Link>
          </Button>
          
          {selectedCommodities.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setShowMoveDialog(true)}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Di chuyển ({selectedCommodities.length})
            </Button>
          )}
        </div>
      </div>
      
      {category.description && (
        <div className="mb-6 text-muted-foreground">
          {category.description}
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-4">
        <Input 
          placeholder="Tìm kiếm hàng hóa..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox 
                  checked={selectAll} 
                  onCheckedChange={(checked) => setSelectAll(checked === true)}
                />
              </TableHead>
              <TableHead>Tên hàng hóa</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-[100px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCommodities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  {searchTerm 
                    ? 'Không tìm thấy hàng hóa phù hợp' 
                    : 'Danh mục này chưa có hàng hóa nào'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCommodities.map((commodity) => (
                <TableRow key={commodity.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedCommodities.includes(commodity.id)}
                      onCheckedChange={() => toggleCommoditySelection(commodity.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{commodity.name}</TableCell>
                  <TableCell className="max-w-[400px] truncate">
                    {commodity.description || 
                      <span className="text-muted-foreground italic">Chưa có mô tả</span>}
                  </TableCell>
                  <TableCell>
                    {new Date(commodity.created_at).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/commodities/edit/${commodity.id}`}>
                            Chỉnh sửa
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteCommodity(commodity.id)}
                        >
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Di chuyển hàng hóa đến danh mục khác */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Di chuyển hàng hóa</DialogTitle>
            <DialogDescription>
              Di chuyển {selectedCommodities.length} hàng hóa đã chọn sang danh mục khác
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="target-category" className="block mb-2">Chọn danh mục đích</Label>
            <Select 
              value={targetCategoryId} 
              onValueChange={setTargetCategoryId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowMoveDialog(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleMoveCommodities} 
              disabled={!targetCategoryId || loading}
            >
              {loading ? 'Đang xử lý...' : 'Di chuyển'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 