'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Package2, ArrowLeft, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { fetchCategories, fetchTeams, buildCategoryTree } from '@/services/commodityService'
import { Category, CategoryWithChildren, Team } from '@/types/commodities'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/utils/supabase/client'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import logger from '@/lib/logger'

export default function NewCommodityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryTree, setCategoryTree] = useState<CategoryWithChildren[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    team_ids: [] as string[]
  })
  const [errors, setErrors] = useState({
    name: '',
    category_id: '',
    team_ids: ''
  })
  const [openTeamSelect, setOpenTeamSelect] = useState(false)

  // Lấy dữ liệu ban đầu
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Lấy danh sách danh mục và xây dựng cây phân cấp
        const { categories: categoriesData } = await fetchCategories()
        setCategories(categoriesData)
        const tree = buildCategoryTree(categoriesData as Category[])
        setCategoryTree(tree)

        // Lấy danh sách đội nhóm
        const { teams: teamsData } = await fetchTeams()
        setTeams(teamsData)
      } catch (error) {
        logger.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Xử lý thay đổi input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Xóa lỗi khi người dùng nhập
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Xử lý thay đổi danh mục
  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category_id: value }))
    
    // Xóa lỗi khi người dùng chọn
    if (errors.category_id) {
      setErrors(prev => ({ ...prev, category_id: '' }))
    }
  }

  // Xử lý thay đổi đội nhóm
  const handleTeamChange = (value: string) => {
    const teamIds = [...formData.team_ids]
    
    if (teamIds.includes(value)) {
      // Nếu đã có, xóa đi
      const index = teamIds.indexOf(value)
      teamIds.splice(index, 1)
    } else {
      // Nếu chưa có, thêm vào
      teamIds.push(value)
    }
    
    setFormData(prev => ({ ...prev, team_ids: teamIds }))
    
    // Xóa lỗi khi người dùng chọn
    if (errors.team_ids) {
      setErrors(prev => ({ ...prev, team_ids: '' }))
    }
  }

  // Xử lý lưu hàng hóa
  const handleSave = async () => {
    // Kiểm tra dữ liệu
    const newErrors = {
      name: '',
      category_id: '',
      team_ids: ''
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên hàng hóa'
    }
    
    if (!formData.category_id) {
      newErrors.category_id = 'Vui lòng chọn danh mục'
    }
    
    if (formData.team_ids.length === 0) {
      newErrors.team_ids = 'Vui lòng chọn ít nhất một đội nhóm'
    }
    
    // Nếu có lỗi, hiển thị và dừng lại
    if (newErrors.name || newErrors.category_id || newErrors.team_ids) {
      setErrors(newErrors)
      return
    }
    
    // Lưu hàng hóa
    setSaving(true)
    try {
      const supabase = createClient()
      
      // 1. Thêm hàng hóa mới
      const { data: newCommodity, error: commodityError } = await supabase
        .from('commodities_new')
        .insert({
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id
        })
        .select()
        .single()
      
      if (commodityError) throw commodityError
      
      // 2. Thêm liên kết với đội nhóm
      const teamLinks = formData.team_ids.map(team_id => ({
        commodity_id: newCommodity.id,
        team_id
      }))
      
      const { error: teamError } = await supabase
        .from('commodities_teams_new')
        .insert(teamLinks)
      
      if (teamError) throw teamError
      
      // Chuyển hướng đến trang chi tiết hàng hóa
      router.push(`/dashboard/commodities/${newCommodity.id}`)
    } catch (error) {
      logger.error('Error saving commodity:', error)
      alert('Có lỗi xảy ra khi lưu hàng hóa. Vui lòng thử lại sau.')
    } finally {
      setSaving(false)
    }
  }

  // Hiển thị danh mục dạng cây trong select
  const renderCategoryOptions = (categories: CategoryWithChildren[], level = 0) => {
    return categories.flatMap(category => [
      <SelectItem 
        key={category.id} 
        value={category.id}
        className={level > 0 ? `pl-${level * 4 + 2}` : ''}
      >
        {level > 0 && '└─ '}{category.name}
      </SelectItem>,
      ...renderCategoryOptions(category.children, level + 1)
    ])
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
        </Button>
      </div>

      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <Package2 className="h-6 w-6" />
        Thêm hàng hóa mới
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin hàng hóa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Tên hàng hóa <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên hàng hóa"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Nhập mô tả hàng hóa"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Danh mục <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {renderCategoryOptions(categoryTree)}
                  </SelectContent>
                </Select>
                {errors.category_id && <p className="text-sm text-red-500">{errors.category_id}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="team_ids">Đội nhóm <span className="text-red-500">*</span></Label>
                <Popover open={openTeamSelect} onOpenChange={setOpenTeamSelect}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openTeamSelect}
                      className="w-full justify-between"
                    >
                      {formData.team_ids.length > 0
                        ? `Đã chọn ${formData.team_ids.length} đội nhóm`
                        : "Chọn đội nhóm"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Tìm đội nhóm..." />
                      <CommandEmpty>Không tìm thấy đội nhóm</CommandEmpty>
                      <CommandGroup>
                        {teams.map((team) => (
                          <CommandItem
                            key={team.id}
                            value={team.id}
                            onSelect={() => handleTeamChange(team.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.team_ids.includes(team.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {team.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.team_ids && <p className="text-sm text-red-500">{errors.team_ids}</p>}
                {formData.team_ids.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.team_ids.map(teamId => {
                      const team = teams.find(t => t.id === teamId)
                      return team ? (
                        <div key={team.id} className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1">
                          {team.name}
                          <button
                            type="button"
                            className="text-green-800 hover:text-green-900"
                            onClick={() => handleTeamChange(team.id)}
                          >
                            ×
                          </button>
                        </div>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/commodities')}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Lưu
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
