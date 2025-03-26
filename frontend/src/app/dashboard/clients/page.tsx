'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, fetchClients, deleteClient, fetchTeams } from '@/utils/supabase/client'

interface Contact {
  id: string
  client_id: string
  full_name: string
  position: string | null
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

interface Client {
  id: string
  name: string
  address: string | null
  email: string | null
  phone: string | null
  tax_id: string | null
  team_ids?: string[]
  created_at: string
  updated_at: string
  contacts: Contact[]
}

interface Team {
  id: string
  name: string
  description: string | null
}

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
  
  useEffect(() => {
    async function loadData() {
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
        
        // Fetch clients data
        const { clients: clientData, error: clientsError } = await fetchClients()
        
        if (clientsError) {
          setError(`Could not load clients: ${clientsError}`)
        } else {
          setClients(clientData)
        }
        
        // Fetch teams data to display team names
        const { teams: teamsData, error: teamsError } = await fetchTeams()
        
        if (teamsError) {
          console.error('Error loading teams:', teamsError)
        } else if (teamsData) {
          setTeams(teamsData)
        }
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])
  
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
        <div className="bg-white overflow-hidden shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teams
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacts
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No clients found.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {client.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {client.address || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {client.email || '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatPhone(client.phone)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.tax_id || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {renderClientTeams(client.team_ids)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        {client.contacts && client.contacts.length > 0 ? (
                          client.contacts.map((contact, index) => (
                            <div key={contact.id} className="text-sm">
                              <span className="font-medium">{contact.full_name}</span>
                              {contact.position && <span className="text-gray-500"> ({contact.position})</span>}
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No contacts</span>
                        )}
                        {client.contacts && client.contacts.length > 2 && (
                          <Link 
                            href={`/dashboard/clients/${client.id}`}
                            className="text-sm text-blue-500 hover:text-blue-700"
                          >
                            View all contacts
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/clients/edit/${client.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 