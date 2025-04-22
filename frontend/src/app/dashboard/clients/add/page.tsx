'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientRecord, fetchTeams } from '@/utils/supabase/client'

// ShadCN components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Add some icons
import { ArrowLeft, Building2, Plus, Save, Users, X } from "lucide-react"
import logger from '@/lib/logger'

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
          logger.error('Error loading teams:', teamsError)
        } else if (teamsData) {
          setTeams(teamsData)
        }
      } catch (err) {
        logger.error('Failed to load teams:', err)
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
      logger.error('Error creating client:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild className="h-8 w-8">
            <Link href="/dashboard/clients">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Add New Client
          </h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/clients">Cancel</Link>
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>
            Enter the details for the new client. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form id="clientForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base">Company Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    required
                  />
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-base">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter company address"
                    rows={3}
                  />
                </div>
              </div>
              
              <div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="company@example.com"
                  />
                </div>
              </div>
              
              <div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base">Phone Number</Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              
              <div>
                <div className="space-y-2">
                  <Label htmlFor="tax_id" className="text-base">Tax ID</Label>
                  <Input
                    type="text"
                    id="tax_id"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleChange}
                    placeholder="Tax identification number"
                  />
                </div>
              </div>
              
              <div>
                <div className="space-y-2">
                  <Label className="text-base">Assign Teams</Label>
                  <div className="border rounded-md p-3 min-h-[100px]">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedTeams.length > 0 ? (
                        selectedTeams.map(teamId => {
                          const team = teams.find(t => t.id === teamId);
                          if (!team) return null;
                          
                          return (
                            <Badge 
                              key={teamId}
                              variant="outline"
                              style={{ backgroundColor: getTeamColor(teamId) }}
                              className="flex items-center gap-1 px-2 py-1 text-sm"
                            >
                              <Users className="h-3 w-3 mr-1 opacity-70" />
                              {team.name}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleTeam(teamId)}
                                className="h-4 w-4 p-0 rounded-full ml-1 hover:bg-black/10"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-muted-foreground text-sm">No teams assigned</span>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        Select teams:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {teams.map(team => (
                          <Button
                            key={team.id}
                            type="button"
                            size="sm"
                            variant={selectedTeams.includes(team.id) ? "secondary" : "outline"}
                            onClick={() => toggleTeam(team.id)}
                            className="text-xs"
                            disabled={selectedTeams.includes(team.id)}
                          >
                            {team.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2 border-t p-4">
          <Button 
            variant="outline" 
            asChild
          >
            <Link href="/dashboard/clients">Cancel</Link>
          </Button>
          <Button 
            type="submit" 
            form="clientForm"
            disabled={loading}
            className="gap-2"
          >
            {loading ? "Saving..." : <>
              <Save className="h-4 w-4" />
              Create Client
            </>}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 