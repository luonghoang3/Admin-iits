'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { DataTable } from './data-table'
import { columns, Commodity } from './columns'

export default function CommoditiesPage() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      try {
        // Kiểm tra xác thực
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          setError(authError.message)
          setLoading(false)
          return
        }
        
        if (!user) {
          window.location.href = '/login'
          return
        }
        
        // Kiểm tra quyền admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', user.id)
          .single()
          
        if (!profile?.is_active) {
          window.location.href = '/login?error=inactive'
          return
        }
        
        if (profile?.role !== 'admin') {
          window.location.href = '/dashboard'
          return
        }
        
        // Lấy dữ liệu commodities
        const { data: commoditiesData, error: commoditiesError } = await supabase
          .from('commodities')
          .select('*, category:category_id(*)')
          .order('name')
        
        if (commoditiesError) {
          setError(`Không thể tải hàng hóa: ${commoditiesError.message}`)
          setLoading(false)
          return
        }
        
        // Lấy thông tin teams cho mỗi commodity
        const commoditiesWithTeams = []
        
        for (const commodity of commoditiesData || []) {
          // Lấy các team được liên kết với commodity
          const { data: teamLinks, error: teamLinksError } = await supabase
            .from('commodities_teams')
            .select('team_id')
            .eq('commodity_id', commodity.id)
          
          if (teamLinksError) {
            console.error('Error loading team links:', teamLinksError)
            continue
          }
          
          // Lấy thông tin chi tiết của các team
          const teamIds = teamLinks?.map(link => link.team_id) || []
          let teams: { id: string; name: string }[] = []
          
          if (teamIds.length > 0) {
            const { data: teamsData, error: teamsError } = await supabase
              .from('teams')
              .select('id, name')
              .in('id', teamIds)
            
            if (teamsError) {
              console.error('Error loading teams:', teamsError)
            } else {
              teams = teamsData || []
            }
          }
          
          commoditiesWithTeams.push({
            ...commodity,
            teams
          })
        }
        
        setCommodities(commoditiesWithTeams)
        setLoading(false)
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message || 'Đã xảy ra lỗi')
        setLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  async function handleDeleteCommodity(commodityId: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa hàng hóa này?')) {
      return
    }
    
    try {
      setLoading(true)
      
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('commodities')
        .delete()
        .eq('id', commodityId)
      
      if (deleteError) throw new Error(deleteError.message)
      
      // Cập nhật danh sách hàng hóa
      setCommodities(commodities.filter(commodity => commodity.id !== commodityId))
      alert('Xóa hàng hóa thành công')
    } catch (err: any) {
      console.error('Error deleting commodity:', err)
      alert(`Lỗi khi xóa hàng hóa: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý hàng hóa</h1>
        <Link
          href="/dashboard/commodities/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Thêm hàng hóa mới
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="bg-white overflow-hidden shadow-md rounded-lg p-6">
          <DataTable 
            columns={columns} 
            data={commodities} 
            onDeleteCommodity={handleDeleteCommodity}
          />
        </div>
      )}
    </div>
  )
} 