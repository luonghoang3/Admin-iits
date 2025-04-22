'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  createClient,
  fetchClient,
  createContact,
  updateContact,
  deleteContact,
  fetchTeams
} from '@/utils/supabase/client'
import logger from '@/lib/logger'

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
  created_at: string
  updated_at: string
  team_ids?: string[]
  contacts: Contact[]
}

interface Team {
  id: string
  name: string
  description: string | null
}

// Add the getTeamColor function
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

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()

  // Truy cập params trực tiếp thay vì sử dụng React.use()
  const clientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  // Modal state for adding/editing contacts
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [contactForm, setContactForm] = useState({
    full_name: '',
    position: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    async function loadClientDetails() {
      try {
        const { client: clientData, error: clientError } = await fetchClient(clientId)

        if (clientError) {
          throw new Error(clientError)
        }

        if (clientData) {
          setClient(clientData)
          setContacts(clientData.contacts || [])

          // Fetch teams data to display team names
          if (clientData.team_ids && clientData.team_ids.length > 0) {
            const { teams: teamsData, error: teamsError } = await fetchTeams()

            if (teamsError) {
              logger.error('Error loading teams:', teamsError)
            } else if (teamsData) {
              setTeams(teamsData)
            }
          }
        } else {
          throw new Error('Client not found')
        }
      } catch (err: any) {
        logger.error('Error loading client details:', err)
        setError(err.message || 'Failed to load client details')
      } finally {
        setLoading(false)
      }
    }

    if (clientId) {
      loadClientDetails()
    }
  }, [clientId])

  // Reset contact form
  const resetContactForm = () => {
    setContactForm({
      full_name: '',
      position: '',
      phone: '',
      email: ''
    })
    setEditingContact(null)
  }

  // Open modal to add a new contact
  const handleAddContact = () => {
    resetContactForm()
    setShowModal(true)
  }

  // Open modal to edit an existing contact
  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setContactForm({
      full_name: contact.full_name || '',
      position: contact.position || '',
      phone: contact.phone || '',
      email: contact.email || ''
    })
    setShowModal(true)
  }

  // Handle saving a contact (create or update)
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!contactForm.full_name.trim()) {
        alert('Contact name is required')
        return
      }

      if (editingContact) {
        // Update existing contact
        const { contact: updatedContact, error } = await updateContact(editingContact.id, {
          full_name: contactForm.full_name.trim(),
          position: contactForm.position.trim() || undefined,
          phone: contactForm.phone.trim() || undefined,
          email: contactForm.email.trim() || undefined
        })

        if (error) throw new Error(error)

        if (updatedContact) {
          // Update the contacts list
          setContacts(contacts.map(c =>
            c.id === updatedContact.id ? updatedContact : c
          ))
        }
      } else {
        // Create a new contact
        const { contact: newContact, error } = await createContact({
          client_id: clientId,
          full_name: contactForm.full_name.trim(),
          position: contactForm.position.trim() || undefined,
          phone: contactForm.phone.trim() || undefined,
          email: contactForm.email.trim() || undefined
        })

        if (error) throw new Error(error)

        if (newContact) {
          // Add to the contacts list
          setContacts([...contacts, newContact])
        }
      }

      // Close the modal
      setShowModal(false)
      resetContactForm()
    } catch (err: any) {
      logger.error('Error saving contact:', err)
      alert(`Error saving contact: ${err.message}`)
    }
  }

  // Handle contact deletion
  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return
    }

    try {
      const { success, error } = await deleteContact(contactId)

      if (error) throw new Error(error)

      if (success) {
        // Remove from the contacts list
        setContacts(contacts.filter(c => c.id !== contactId))
      }
    } catch (err: any) {
      logger.error('Error deleting contact:', err)
      alert(`Error deleting contact: ${err.message}`)
    }
  }

  // Handle input changes in the contact form
  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Function to render team badges
  const renderTeamBadges = () => {
    if (!client || !client.team_ids || client.team_ids.length === 0) {
      return <span className="text-gray-500">Not assigned to any team</span>;
    }

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {client.team_ids.map(teamId => {
          const team = teams.find(t => t.id === teamId);
          if (!team) return null;

          return (
            <span
              key={teamId}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-800"
              style={{ backgroundColor: getTeamColor(teamId) }}
            >
              {team.name}
            </span>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
          <p className="text-gray-500">Loading client details...</p>
        </div>
      </div>
    )
  }

  if (error && !client) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/dashboard/clients')}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Clients
          </button>
        </div>
      </div>
    )
  }

  if (!client) return null

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Client Details</h1>
        <div className="flex space-x-4">
          <Link
            href="/dashboard/clients"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Back to List
          </Link>
          <Link
            href={`/dashboard/clients/edit/${client.id}`}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit Client
          </Link>
        </div>
      </div>

      {/* Client Details */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-2xl mr-6">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{client.name}</h2>
              {client.address && <p className="text-gray-600 mt-1">{client.address}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                Contact Information
              </h3>
              <p className="text-gray-800"><strong>Email:</strong> {client.email || '-'}</p>
              <p className="text-gray-800"><strong>Phone:</strong> {client.phone || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                Business Details
              </h3>
              <p className="text-gray-800"><strong>Tax ID:</strong> {client.tax_id || '-'}</p>
              <div className="mt-2">
                <p className="text-gray-800"><strong>Teams:</strong></p>
                {renderTeamBadges()}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                Additional Information
              </h3>
              <p className="text-gray-800">
                <strong>Created:</strong> {new Date(client.created_at).toLocaleDateString()}
              </p>
              <p className="text-gray-800">
                <strong>Last Updated:</strong> {new Date(client.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium">Contacts</h3>
          <button
            onClick={handleAddContact}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Add Contact
          </button>
        </div>

        <div className="p-6">
          {contacts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No contacts added yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map(contact => (
                <div key={contact.id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{contact.full_name}</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {contact.position && <p className="text-gray-600 text-sm">{contact.position}</p>}
                  {contact.email && <p className="text-gray-600 text-sm mt-2">{contact.email}</p>}
                  {contact.phone && <p className="text-gray-600 text-sm">{contact.phone}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </h3>
            </div>

            <form onSubmit={handleSaveContact}>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={contactForm.full_name}
                    onChange={handleContactFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={contactForm.position}
                    onChange={handleContactFormChange}
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
                    value={contactForm.email}
                    onChange={handleContactFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleContactFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}