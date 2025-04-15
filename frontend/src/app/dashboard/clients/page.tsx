'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, fetchClients, deleteClient, fetchTeams } from '@/utils/supabase/client'
import { DataTable } from './data-table'
import { columns, Client, Team } from './columns'

// Function to generate a consistent color for each team based on id
function getTeamColor(id: string): string {
  // Create hash from id
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  // List of safe pastel colors
  const colors = [
    '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf',
    '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff',
    '#fffffc', '#d8f3dc', '#b7e4c7', '#95d5b2'
  ];

  // Get color based on hash
  return colors[Math.abs(hash) % colors.length];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Không cần state searchQuery vì tìm kiếm được xử lý trong DataTable
  const pageSize = 1000 // Lấy tất cả clients

  // Function to load clients data
  const loadClientsData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch all clients data
      const { clients: clientData, error: clientsError } = await fetchClients(1, pageSize, '')

      if (clientsError) {
        setError(`Could not load clients: ${clientsError}`)
        return []
      } else {
        // Process client data to include team names
        const processedClients = clientData.map(client => {
          // Filter out null values and only keep strings
          const teamNames = client.team_ids?.map((teamId: string) => {
            const team = teams.find(t => t.id === teamId);
            return team ? team.name : "";
          }).filter((name: string) => name !== "") || [];

          return {
            ...client,
            team_names: teamNames
          } as Client;
        });

        return processedClients
      }
    } catch (err: any) {
      console.error('Error loading clients:', err)
      setError(err.message || 'An error occurred loading clients')
      return []
    } finally {
      setLoading(false)
    }
  }, [teams, pageSize]);

  useEffect(() => {
    async function loadInitialData() {
      const supabase = createClient()

      try {
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          setError(authError.message)
          setLoading(false)
          return
        }

        if (!user) {
          redirect('/login')
          return
        }

        // Fetch teams data first to ensure we have team data available
        const { teams: teamsData, error: teamsError } = await fetchTeams()

        if (teamsError) {
          console.error('Error loading teams:', teamsError)
        } else if (teamsData) {
          setTeams(teamsData)
        }

        // Load all clients
        const clientsData = await loadClientsData()
        setClients(clientsData)
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Lắng nghe sự thay đổi của teams và cập nhật lại danh sách clients với team_names
  useEffect(() => {
    if (clients.length > 0 && teams.length > 0) {
      const processedClients = clients.map(client => {
        const teamNames = client.team_ids?.map((teamId: string) => {
          const team = teams.find(t => t.id === teamId);
          return team ? team.name : "";
        }).filter((name: string) => name !== "") || [];

        return {
          ...client,
          team_names: teamNames
        } as Client;
      });

      setClients(processedClients);
    }
  }, [teams]);





  async function handleDeleteClient(clientId: string) {
    if (!confirm('Are you sure you want to delete this client?')) {
      return
    }

    try {
      setLoading(true)

      const { success, error: deleteError } = await deleteClient(clientId)

      if (deleteError) throw new Error(deleteError)

      if (success) {
        // Update the clients list
        setClients(clients.filter(client => client.id !== clientId))
        alert('Client deleted successfully')
      }
    } catch (err: any) {
      console.error('Error deleting client:', err)
      alert(`Error deleting client: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Format phone number for display
  const formatPhone = (phone: string | null) => {
    if (!phone) return '-'
    return phone
  }

  // Display client teams as badges
  const renderClientTeams = (teamIds?: string[]) => {
    if (!teamIds || teamIds.length === 0) {
      return <span className="text-gray-500 text-sm">No teams</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {teamIds.map(teamId => {
          const team = teams.find(t => t.id === teamId);
          if (!team) return null;

          return (
            <span
              key={teamId}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-gray-800"
              style={{ backgroundColor: getTeamColor(teamId) }}
            >
              {team.name}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Client Management</h1>
        <Link
          href="/dashboard/clients/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Client
        </Link>
      </div>



      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
          <p className="text-gray-500">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white overflow-hidden shadow-md rounded-lg p-6">
          <DataTable
            columns={columns}
            data={clients}
            teams={teams}
            onDeleteClient={handleDeleteClient}
          />


        </div>
      )}
    </div>
  )
}