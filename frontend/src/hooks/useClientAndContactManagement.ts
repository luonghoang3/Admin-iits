import { useState, useEffect, useMemo } from 'react'
import {
  createClientRecord,
  updateClient,
  deleteClient,
  createContact,
  updateContact,
  deleteContact,
  fetchClients,
  fetchClient
} from '@/utils/supabase/client'

interface Client {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
}

interface Contact {
  id: string
  client_id: string
  full_name: string
  position?: string | null
  phone?: string | null
  email?: string | null
  created_at?: string
  updated_at?: string
}

interface ClientFormData {
  id: string
  name: string
  email: string
  phone: string
  address: string
}

interface ContactFormData {
  id: string
  full_name: string
  position: string
  phone: string
  email: string
}

interface UseClientAndContactManagementProps {
  onClientUpdated?: (client: Client) => void
  onContactUpdated?: (contact: Contact) => void
  initialClientId?: string
}

export function useClientAndContactManagement({
  onClientUpdated,
  onContactUpdated,
  initialClientId
}: UseClientAndContactManagementProps = {}) {
  // Client states
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientQuery, setClientQuery] = useState("")
  const [clientPage, setClientPage] = useState(1)
  const [hasMoreClients, setHasMoreClients] = useState(true)
  const [isLoadingMoreClients, setIsLoadingMoreClients] = useState(false)

  // Function to set selected client and load its contacts
  const selectClient = async (client: Client | null) => {
    setSelectedClient(client);

    // Clear contacts when no client is selected
    if (!client) {
      setContacts([]);
      return;
    }

    try {
      // Import the fetchContactsByClientId function
      const { fetchContactsByClientId } = await import('@/utils/supabase/client');

      // Fetch contacts for the selected client
      const { contacts: clientContacts, error } = await fetchContactsByClientId(client.id);

      if (error) {
        console.error('Error fetching contacts:', error);
        setContacts([]);
      } else {
        const contactsList = clientContacts || [];
        setContacts(contactsList);

        // Auto-select the most recent contact if available
        if (contactsList.length > 0) {
          // The contacts are already sorted by created_at desc, so the first one is the most recent
          const mostRecentContact = contactsList[0];

          // Update the form data with the selected contact
          if (onContactUpdated) {
            onContactUpdated(mostRecentContact);
          }
        }
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    }
  }

  // UI states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Client dialog states
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [clientDialogMode, setClientDialogMode] = useState<'add' | 'edit'>('add')
  const [clientForm, setClientForm] = useState<ClientFormData>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [clientError, setClientError] = useState<string | null>(null)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  // Contact states
  const [contacts, setContacts] = useState<Contact[]>([])

  // Contact dialog states
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [contactDialogMode, setContactDialogMode] = useState<'add' | 'edit'>('add')
  const [contactForm, setContactForm] = useState<ContactFormData>({
    id: '',
    full_name: '',
    position: '',
    phone: '',
    email: ''
  })
  const [contactError, setContactError] = useState<string | null>(null)
  const [isConfirmDeleteContactOpen, setIsConfirmDeleteContactOpen] = useState(false)

  // Load reference data
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        setLoading(true);

        const { clients: clientsData, error: clientsError } = await fetchClients(1, 15)

        if (!isMounted) return;

        if (clientsError || !clientsData || clientsData.length === 0) {
          // No clients in database or error, set test clients
          const testClients = [
            { id: 'test-1', name: 'Test Client 1', email: 'test1@example.com', phone: '123-456-7890', address: '123 Test St', contacts: [] },
            { id: 'test-2', name: 'Test Client 2', email: 'test2@example.com', phone: '123-456-7891', address: '456 Test Ave', contacts: [] },
            { id: 'test-3', name: 'Test Client 3', email: 'test3@example.com', phone: '123-456-7892', address: '789 Test Blvd', contacts: [] }
          ]
          if (isMounted) {
            setClients(testClients);
            setClientQuery('');
            setLoading(false);
          }
        } else {
          if (isMounted) {
            setClients(clientsData);

            // If initialClientId is provided, select that client
            if (initialClientId) {
              const selectedClient = clientsData.find(c => c.id === initialClientId);
              if (selectedClient) {
                selectClient(selectedClient);
              }
            }
            setLoading(false);
          }
        }
      } catch (error) {
        if (!isMounted) return;

        // In case of exception, set test data
        const testClients = [
          { id: 'test-1', name: 'Test Client 1', email: 'test1@example.com', phone: '123-456-7890', address: '123 Test St', contacts: [] },
          { id: 'test-2', name: 'Test Client 2', email: 'test2@example.com', phone: '123-456-7891', address: '456 Test Ave', contacts: [] },
          { id: 'test-3', name: 'Test Client 3', email: 'test3@example.com', phone: '123-456-7892', address: '789 Test Blvd', contacts: [] }
        ]
        if (isMounted) {
          setClients(testClients);
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [initialClientId]);

  // Client handlers
  const openAddClientDialog = () => {
    setClientForm({
      id: '',
      name: '',
      email: '',
      phone: '',
      address: ''
    })
    setClientDialogMode('add')
    setClientError(null)
    setClientDialogOpen(true)
  }

  const openEditClientDialog = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId)

    if (client) {
      setClientForm({
        id: client.id,
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || ''
      })

      setClientDialogMode('edit')
      setClientError(null)
      setClientDialogOpen(true)
    } else {
      setClientError('Client not found')
    }
  }

  const openDeleteClientConfirm = () => {
    setIsConfirmDeleteOpen(true)
  }

  const handleClientFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setClientForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveClient = async () => {
    try {
      setClientError(null)

      // Validate form
      if (!clientForm.name) {
        setClientError('Client name is required')
        return
      }

      if (clientDialogMode === 'add') {
        // Create new client
        const { client, error } = await createClientRecord({
          name: clientForm.name,
          email: clientForm.email || undefined,
          phone: clientForm.phone || undefined,
          address: clientForm.address || undefined
        })

        if (error) {
          throw new Error(error)
        }

        if (client) {
          // Add client to list and select it
          setClients(prev => [client, ...prev])

          // Select the client to load its contacts
          selectClient(client)

          if (onClientUpdated) {
            onClientUpdated(client)
          }
        }
      } else {
        // Update existing client
        const { client, error } = await updateClient(
          clientForm.id,
          {
            name: clientForm.name,
            email: clientForm.email || undefined,
            phone: clientForm.phone || undefined,
            address: clientForm.address || undefined
          }
        )

        if (error) {
          throw new Error(error)
        }

        if (client) {
          // Update client in list
          setClients(prev => prev.map(c => c.id === client.id ? client : c))

          // If this is the currently selected client, update it and reload contacts
          if (selectedClient && selectedClient.id === client.id) {
            selectClient(client);
          }

          if (onClientUpdated) {
            onClientUpdated(client)
          }
        }
      }

      // Close dialog
      setClientDialogOpen(false)
    } catch (err: any) {
      console.error('Error saving client:', err)
      setClientError(err.message || 'Failed to save client')
    }
  }

  const handleDeleteClient = async () => {
    if (!clientForm.id) return

    try {
      const { success, error } = await deleteClient(clientForm.id)

      if (error) {
        throw new Error(error)
      }

      if (success) {
        // Remove client from list
        setClients(prev => prev.filter(c => c.id !== clientForm.id))

        if (onClientUpdated) {
          // Signal that the client was deleted
          onClientUpdated({ id: '', name: '' })
        }
      }

      setIsConfirmDeleteOpen(false)
      setClientDialogOpen(false)
    } catch (err: any) {
      console.error('Error deleting client:', err)
      setClientError(err.message || 'Failed to delete client')
    }
  }

  // Contact handlers
  const openAddContactDialog = () => {
    if (!initialClientId) {
      setContactError('Please select a client first')
      return
    }

    setContactForm({
      id: '',
      full_name: '',
      position: '',
      phone: '',
      email: ''
    })

    setContactDialogMode('add')
    setContactError(null)
    setContactDialogOpen(true)
  }

  const openEditContactDialog = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId)

    if (contact) {
      setContactForm({
        id: contact.id,
        full_name: contact.full_name,
        position: contact.position || '',
        phone: contact.phone || '',
        email: contact.email || ''
      })

      setContactDialogMode('edit')
      setContactError(null)
      setContactDialogOpen(true)
    } else {
      setContactError('Contact not found')
    }
  }

  const openDeleteContactConfirm = () => {
    setIsConfirmDeleteContactOpen(true)
  }

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContactForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveContact = async () => {
    if (!initialClientId) {
      setContactError('No client selected')
      return
    }

    try {
      setContactError(null)

      // Validate form
      if (!contactForm.full_name) {
        setContactError('Contact name is required')
        return
      }

      if (contactDialogMode === 'add') {
        // Create new contact
        const { contact, error } = await createContact({
          client_id: initialClientId,
          full_name: contactForm.full_name,
          position: contactForm.position || undefined,
          phone: contactForm.phone || undefined,
          email: contactForm.email || undefined
        })

        if (error) {
          throw new Error(error)
        }

        if (contact) {
          // Add contact to list
          setContacts(prev => [contact, ...prev])

          if (onContactUpdated) {
            onContactUpdated(contact)
          }
        }
      } else {
        // Update existing contact
        const { contact, error } = await updateContact(
          contactForm.id,
          {
            full_name: contactForm.full_name,
            position: contactForm.position || undefined,
            phone: contactForm.phone || undefined,
            email: contactForm.email || undefined
          }
        )

        if (error) {
          throw new Error(error)
        }

        if (contact) {
          // Update contact in list
          setContacts(prev => prev.map(c => c.id === contact.id ? contact : c))

          if (onContactUpdated) {
            onContactUpdated(contact)
          }
        }
      }

      // Close dialog
      setContactDialogOpen(false)
    } catch (err: any) {
      console.error('Error saving contact:', err)
      setContactError(err.message || 'Failed to save contact')
    }
  }

  const handleDeleteContact = async () => {
    if (!contactForm.id) return

    try {
      const { success, error } = await deleteContact(contactForm.id)

      if (error) {
        throw new Error(error)
      }

      if (success) {
        // Remove contact from list
        setContacts(prev => prev.filter(c => c.id !== contactForm.id))

        if (onContactUpdated) {
          // Signal that the contact was deleted
          onContactUpdated({ id: '', client_id: '', full_name: '' })
        }
      }

      setIsConfirmDeleteContactOpen(false)
      setContactDialogOpen(false)
    } catch (err: any) {
      console.error('Error deleting contact:', err)
      setContactError(err.message || 'Failed to delete contact')
    }
  }

  // Load more clients for pagination
  const handleLoadMoreClients = async () => {
    if (!hasMoreClients || isLoadingMoreClients) return

    let isMounted = true;

    try {
      setIsLoadingMoreClients(true)
      const nextPage = clientPage + 1

      const { clients: moreClients, error } = await fetchClients(nextPage, 15, clientQuery)

      if (!isMounted) return;

      if (error) {
        throw new Error(error)
      }

      if (moreClients && moreClients.length > 0) {
        setClients(prev => [...prev, ...moreClients])
        setClientPage(nextPage)
        setHasMoreClients(moreClients.length === 15)
      } else {
        setHasMoreClients(false)
      }
    } catch (err) {
      if (isMounted) {
        console.error('Error loading more clients:', err)
      }
    } finally {
      if (isMounted) {
        setIsLoadingMoreClients(false)
      }
    }
  }

  // Search clients
  const handleClientSearch = async (query: string) => {
    setClientQuery(query)
    if (query.length > 1) {
      let isMounted = true;

      try {
        const { clients: searchResults, error } = await fetchClients(1, 15, query)

        if (!isMounted) return;

        if (!error && searchResults) {
          setClients(searchResults)
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error searching clients:', error)
        }
      }
    }
  }

  // Get filtered clients based on search query
  const getFilteredClients = () => {
    return clientQuery === ''
      ? clients
      : clients.filter(client =>
          client.name
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(clientQuery.toLowerCase().replace(/\s+/g, ''))
        )
  }

  return {
    // Client states
    clients,
    setClients,
    selectedClient,
    setSelectedClient,
    selectClient,
    clientQuery,
    clientPage,
    hasMoreClients,
    isLoadingMoreClients,
    loading,
    error,

    // Client dialog states
    clientDialogOpen,
    setClientDialogOpen,
    clientDialogMode,
    clientForm,
    clientError,
    isConfirmDeleteOpen,
    setIsConfirmDeleteOpen,

    // Contact states
    contacts,
    setContacts,

    // Contact dialog states
    contactDialogOpen,
    setContactDialogOpen,
    contactDialogMode,
    contactForm,
    contactError,
    isConfirmDeleteContactOpen,
    setIsConfirmDeleteContactOpen,

    // Client handlers
    openAddClientDialog,
    openEditClientDialog,
    openDeleteClientConfirm,
    handleClientFormChange,
    handleSaveClient,
    handleDeleteClient,

    // Contact handlers
    openAddContactDialog,
    openEditContactDialog,
    openDeleteContactConfirm,
    handleContactFormChange,
    handleSaveContact,
    handleDeleteContact,

    // Pagination handlers
    handleLoadMoreClients,
    handleClientSearch,
    getFilteredClients
  }
}