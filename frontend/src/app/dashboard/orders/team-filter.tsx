"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"

interface TeamFilterProps {
  selectedTeam: string | null
  setSelectedTeam: (value: string | null) => void
}

export function TeamFilter({ selectedTeam, setSelectedTeam }: TeamFilterProps) {
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)

  // Tải danh sách teams
  useEffect(() => {
    async function loadTeams() {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .order('name')

      if (!error && data) {
        setTeams(data)
      }
      setLoading(false)
    }

    loadTeams()
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-xs font-medium whitespace-nowrap mr-1">Team:</span>
      <div className="flex flex-wrap gap-1">
        <Button
          variant={selectedTeam === null ? "default" : "outline"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setSelectedTeam(null)}
        >
          Tất cả
        </Button>

        {teams.map((team) => (
          <Button
            key={team.id}
            variant={selectedTeam === team.id ? "default" : "outline"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setSelectedTeam(team.id === selectedTeam ? null : team.id)}
          >
            {team.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
