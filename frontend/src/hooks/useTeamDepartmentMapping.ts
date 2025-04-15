import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Team } from '@/types/orders'

export interface DepartmentTeamMapping {
  department: string;
  team_id: string;
  team?: Team;
}

export function useTeamDepartmentMapping() {
  const [mappings, setMappings] = useState<DepartmentTeamMapping[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const supabase = createClient()

        // Tải dữ liệu từ bảng ánh xạ department_team_mapping
        const { data: mappingData, error: mappingError } = await supabase
          .from('department_team_mapping')
          .select('*')

        if (mappingError) {
          throw new Error(`Không thể tải dữ liệu ánh xạ: ${mappingError.message}`)
        }

        // Tải dữ liệu từ bảng teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')

        if (teamsError) {
          throw new Error(`Không thể tải dữ liệu teams: ${teamsError.message}`)
        }

        // Kết hợp dữ liệu
        const mappingsWithTeams = mappingData.map((mapping: DepartmentTeamMapping) => {
          const team = teamsData.find((t: Team) => t.id === mapping.team_id)
          return {
            ...mapping,
            team
          }
        })

        setMappings(mappingsWithTeams)
        setTeams(teamsData)
      } catch (err: any) {
        console.error('Lỗi khi tải dữ liệu ánh xạ department-team:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Hàm lấy team dựa trên department
  const getTeamByDepartment = (department: string): Team | undefined => {
    const mapping = mappings.find(m => m.department === department)
    return mapping?.team
  }

  // Hàm lấy department dựa trên team_id
  const getDepartmentByTeamId = (teamId: string): string | undefined => {
    const mapping = mappings.find(m => m.team_id === teamId)
    return mapping?.department
  }

  return {
    mappings,
    teams,
    loading,
    error,
    getTeamByDepartment,
    getDepartmentByTeamId
  }
}
