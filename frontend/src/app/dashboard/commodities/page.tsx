'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package2, Search, Layers, Users, Filter, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchCommodities, fetchCategories, buildCategoryTree, fetchTeams } from '@/services/commodityService'
import { Commodity, Category, CategoryWithChildren, Team } from '@/types/commodities'
import { Skeleton } from '@/components/ui/skeleton'
import logger from '@/lib/logger'

export default function CommoditiesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [filteredCommodities, setFilteredCommodities] = useState<Commodity[]>([])
  const [categoryTree, setCategoryTree] = useState<CategoryWithChildren[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)

  // Lấy dữ liệu ban đầu
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Lấy danh sách hàng hóa
        const { commodities: commoditiesData } = await fetchCommodities()
        setCommodities(commoditiesData)
        setFilteredCommodities(commoditiesData)

        // Lấy danh sách danh mục và xây dựng cây phân cấp
        const { categories } = await fetchCategories()
        const tree = buildCategoryTree(categories as Category[])
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

  // Lọc hàng hóa khi thay đổi tìm kiếm, danh mục hoặc đội nhóm
  useEffect(() => {
    let filtered = [...commodities]

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
    }

    // Lọc theo danh mục
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category_id === selectedCategory)
    }

    // Lọc theo đội nhóm
    if (selectedTeam) {
      filtered = filtered.filter(item =>
        item.teams?.some((team: any) => team.id === selectedTeam)
      )
    }

    setFilteredCommodities(filtered)
  }, [searchQuery, selectedCategory, selectedTeam, commodities])

  // Hiển thị danh mục dạng cây
  const renderCategoryTree = (categories: CategoryWithChildren[], level = 0) => {
    return categories.map(category => (
      <div key={category.id}>
        <div
          className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${selectedCategory === category.id ? 'bg-blue-100 font-medium' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => setSelectedCategory(category.id)}
        >
          {category.name} ({countCommoditiesInCategory(category.id)})
        </div>
        {category.children.length > 0 && renderCategoryTree(category.children, level + 1)}
      </div>
    ))
  }

  // Đếm số hàng hóa trong danh mục
  const countCommoditiesInCategory = (categoryId: string) => {
    return commodities.filter(item => item.category_id === categoryId).length
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package2 className="h-6 w-6" />
          Quản lý hàng hóa
        </h1>
        <Button onClick={() => router.push('/dashboard/commodities/new')}>
          <Plus className="h-4 w-4 mr-2" /> Thêm hàng hóa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Thanh tìm kiếm */}
        <div className="md:col-span-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm hàng hóa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Bộ lọc bên trái */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Bộ lọc
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="categories">
                <TabsList className="w-full">
                  <TabsTrigger value="categories" className="flex-1">
                    <Layers className="h-4 w-4 mr-2" /> Danh mục
                  </TabsTrigger>
                  <TabsTrigger value="teams" className="flex-1">
                    <Users className="h-4 w-4 mr-2" /> Đội nhóm
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="categories" className="pt-4">
                  {loading ? (
                    <div className="space-y-2">
                      {Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-6 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                      <div
                        className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${selectedCategory === null ? 'bg-blue-100 font-medium' : ''}`}
                        onClick={() => setSelectedCategory(null)}
                      >
                        Tất cả ({commodities.length})
                      </div>
                      {renderCategoryTree(categoryTree)}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="teams" className="pt-4">
                  {loading ? (
                    <div className="space-y-2">
                      {Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-6 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                      <div
                        className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${selectedTeam === null ? 'bg-blue-100 font-medium' : ''}`}
                        onClick={() => setSelectedTeam(null)}
                      >
                        Tất cả ({commodities.length})
                      </div>
                      {teams.map(team => (
                        <div
                          key={team.id}
                          className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${selectedTeam === team.id ? 'bg-blue-100 font-medium' : ''}`}
                          onClick={() => setSelectedTeam(team.id)}
                        >
                          {team.name} ({commodities.filter(item => item.teams?.some((t: any) => t.id === team.id)).length})
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Danh sách hàng hóa */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package2 className="h-4 w-4" />
                  Danh sách hàng hóa
                </div>
                <div className="text-sm font-normal text-gray-500">
                  Hiển thị {filteredCommodities.length} / {commodities.length} hàng hóa
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredCommodities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Không tìm thấy hàng hóa nào
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCommodities.map(commodity => (
                    <Card key={commodity.id} className="overflow-hidden hover:border-blue-300 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/commodities/${commodity.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex-1">
                            <h3 className="font-medium">{commodity.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">{commodity.description || 'Không có mô tả'}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {commodity.category && (
                              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {commodity.category.name}
                              </div>
                            )}
                            {commodity.teams?.map((team: any) => (
                              <div key={team.id} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {team.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
