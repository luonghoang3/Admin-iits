'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient, createClientRecord, fetchTeams } from '@/utils/supabase/client'

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

export default function AddClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    tax_id: ''
  })
  
  // Load available teams
  useEffect(() => {
    async function loadTeams() {
      try {
        const { teams: teamsData, error: teamsError } = await fetchTeams()
        
        if (teamsError) {
          console.error('Error loading teams:', teamsError)
        } else if (teamsData) {
          setTeams(teamsData)
        }
      } catch (err) {
        console.error('Failed to load teams:', err)
      }
    }
    
    loadTeams()
  }, [])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Function to toggle team selection
  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prevTeams => {
      // If team is already selected, remove it
      if (prevTeams.includes(teamId)) {
        return prevTeams.filter(id => id !== teamId);
      } 
      // If team is not selected, add it
      else {
        return [...prevTeams, teamId];
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Check if name is provided
      if (!formData.name.trim()) {
        throw new Error('Company name is required')
      }
      
      // Create client
      const { client, error: createError } = await createClientRecord({
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        tax_id: formData.tax_id.trim() || undefined,
        team_ids: selectedTeams.length > 0 ? selectedTeams : undefined
      })
      
      if (createError) throw new Error(createError)
      
      if (client) {
        // Redirect to the client page
        router.push('/dashboard/clients')
      } else {
        throw new Error('Failed to create client')
      }
    } catch (err: any) {
      console.error('Error creating client:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Client</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700 mb-1">
                Tax ID
              </label>
              <input
                type="text"
                id="tax_id"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign Teams
              </label>
              <div className="mt-1 p-2 border border-gray-300 rounded-md min-h-12">
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedTeams.length > 0 ? (
                    selectedTeams.map(teamId => {
                      const team = teams.find(t => t.id === teamId);
                      if (!team) return null;
                      
                      return (
                        <span 
                          key={teamId}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-800"
                          style={{ backgroundColor: getTeamColor(teamId) }}
                        >
                          {team.name}
                          <button
                            type="button"
                            onClick={() => toggleTeam(teamId)}
                            className="ml-1.5 text-gray-600 hover:text-gray-900 focus:outline-none"
                          >
                            &times;
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-500 text-sm">No teams assigned</span>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Select teams:</p>
                  <div className="flex flex-wrap gap-2">
                    {teams.map(team => (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => toggleTeam(team.id)}
                        disabled={selectedTeams.includes(team.id)}
                        className={`px-2 py-1 text-xs rounded focus:outline-none ${
                          selectedTeams.includes(team.id)
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {team.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard/clients')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 