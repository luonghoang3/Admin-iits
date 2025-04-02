'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

// ShadCN components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// @ts-ignore - Bỏ qua lỗi TypeScript tạm thời
import Package2 from 'lucide-react/dist/esm/icons/package-2';
// @ts-ignore
import Users from 'lucide-react/dist/esm/icons/users';

interface Team {
  id: string
  name: string
  description: string | null
}

// Hàm tạo màu nhất quán cho mỗi team dựa trên id
function getTeamColor(id: string): string {
  // Tạo hash từ id
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Danh sách các màu pastel an toàn
  const colors = [
    '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', 
    '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff',
    '#fffffc', '#d8f3dc', '#b7e4c7', '#95d5b2'
  ];
  
  // Lấy màu dựa trên hash
  return colors[Math.abs(hash) % colors.length];
}

export default function EditCommodityPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  
  // Load commodity details and teams
  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        
        // Lấy thông tin commodity
        const { data: commodity, error: commodityError } = await supabase
          .from('commodities')
          .select('*')
          .eq('id', params.id)
          .single()
        
        if (commodityError) throw commodityError
        
        if (commodity) {
          setFormData({
            name: commodity.name,
            description: commodity.description || ''
          })
        } else {
          throw new Error('Không tìm thấy hàng hóa')
        }
        
        // Lấy các team được liên kết với commodity
        const { data: teamLinks, error: teamLinksError } = await supabase
          .from('commodities_teams')
          .select('team_id')
          .eq('commodity_id', params.id)
        
        if (teamLinksError) throw teamLinksError
        
        if (teamLinks) {
          setSelectedTeams(teamLinks.map(link => link.team_id))
        }
        
        // Lấy danh sách tất cả teams
        const { data: allTeams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('name')
        
        if (teamsError) throw teamsError
        
        setTeams(allTeams || [])
        setLoading(false)
        
      } catch (err: any) {
        console.error('Error loading data:', err)
        setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu')
        setLoading(false)
      }
    }
    
    loadData()
  }, [params.id])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Hàm để chọn/bỏ chọn team
  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prevTeams => {
      if (prevTeams.includes(teamId)) {
        return prevTeams.filter(id => id !== teamId);
      } else {
        return [...prevTeams, teamId];
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Kiểm tra tên đã được cung cấp chưa
      if (!formData.name.trim()) {
        throw new Error('Tên hàng hóa là bắt buộc')
      }
      
      const supabase = createClient()
      
      // Cập nhật thông tin commodity
      const { error: updateError } = await supabase
        .from('commodities')
        .update({ 
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
      
      if (updateError) throw updateError
      
      // Xóa tất cả các liên kết hiện tại
      const { error: deleteLinksError } = await supabase
        .from('commodities_teams')
        .delete()
        .eq('commodity_id', params.id)
      
      if (deleteLinksError) throw deleteLinksError
      
      // Tạo các liên kết mới
      if (selectedTeams.length > 0) {
        const commodityTeamsData = selectedTeams.map(teamId => ({
          commodity_id: params.id,
          team_id: teamId
        }))
        
        const { error: linkError } = await supabase
          .from('commodities_teams')
          .insert(commodityTeamsData)
        
        if (linkError) throw linkError
      }
      
      // Chuyển hướng đến trang danh sách
      router.push('/dashboard/commodities')
      router.refresh()
      
    } catch (err: any) {
      console.error('Error updating commodity:', err)
      setError(err.message || 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-pulse text-lg">Đang tải...</div>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Package2 className="h-6 w-6" />
          Chỉnh sửa hàng hóa
        </h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/commodities">Hủy</Link>
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Thông tin hàng hóa</CardTitle>
          <CardDescription>
            Chỉnh sửa thông tin hàng hóa. Các trường có dấu * là bắt buộc.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form id="commodityForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">Tên hàng hóa *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập tên hàng hóa"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base">Mô tả</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Nhập mô tả về hàng hóa (không bắt buộc)"
                  rows={3}
                />
              </div>
              
              <div className="space-y-3">
                <Label className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Teams
                </Label>
                <div className="border rounded-md p-4">
                  {teams.length === 0 ? (
                    <div className="text-gray-500 text-sm">Không có team nào</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {teams.map(team => {
                        const isSelected = selectedTeams.includes(team.id);
                        const bgColor = getTeamColor(team.id);
                        
                        return (
                          <div
                            key={team.id}
                            onClick={() => toggleTeam(team.id)}
                            style={{ 
                              backgroundColor: isSelected ? bgColor : 'transparent',
                              borderColor: bgColor
                            }}
                            className={`
                              border rounded-md p-2 cursor-pointer transition-all
                              ${isSelected ? 'shadow-md' : 'hover:border-2'}
                            `}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{team.name}</span>
                              {isSelected && (
                                <Badge variant="secondary" className="ml-2">Đã chọn</Badge>
                              )}
                            </div>
                            {team.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {team.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/commodities')}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            form="commodityForm"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Lưu thay đổi'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 