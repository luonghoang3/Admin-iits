import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { HeadlessuiCombobox } from "@/components/ui/combobox-wrapper"
import { createClient, fetchClientsForCombobox, fetchClient, fetchContactsByClientId } from '@/utils/supabase/client'
import { Contact } from '@/types/clients'
import { InvoiceFormData } from '@/types/invoices'
import { PlusCircle, Edit, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from "@/components/ui/use-toast"
import ClientDialog from './ClientDialog'
import ContactDialog from './ContactDialog'


interface ClientInformationSectionProps {
  formData: InvoiceFormData
  handleValueChange: (field: string, value: any) => void
}

export default function ClientInformationSection({
  formData,
  handleValueChange
}: ClientInformationSectionProps) {
  const { toast } = useToast()
  const [clients, setClients] = useState<any[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [hasMoreClients, setHasMoreClients] = useState(true)
  const [isLoadingMoreClients, setIsLoadingMoreClients] = useState(false)
  const [clientPage, setClientPage] = useState(1)

  // Client dialog state
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [clientDialogMode, setClientDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedClientData, setSelectedClientData] = useState<any>(null)

  // Contact dialog state
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [contactDialogMode, setContactDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedContactData, setSelectedContactData] = useState<Contact | null>(null)

  // Load clients with search and pagination
  useEffect(() => {
    const fetchClients = async () => {
      setLoadingClients(true)
      try {
        console.log('Invoice: Fetching clients with search:', clientSearch, 'page:', 1)

        // Xử lý trường hợp clientSearch có ký tự đặc biệt
        const safeSearchQuery = clientSearch.replace(/[\\%_]/g, '\\$&')

        const { clients, hasMore, error } = await fetchClientsForCombobox({
          page: 1,
          limit: 15,
          searchQuery: safeSearchQuery
        })

        if (error) throw error

        // Nếu có client_id đã chọn, đảm bảo nó có trong danh sách
        if (formData.client_id) {
          // Kiểm tra xem client đã chọn có trong danh sách kết quả không
          const selectedClientExists = clients?.some(client => client.value === formData.client_id)

          if (!selectedClientExists) {
            // Nếu không có, tải thông tin client đã chọn
            try {
              console.log('Invoice: Selected client not in results, fetching it separately:', formData.client_id)
              const supabase = createClient()
              const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('id, name, trade_name')
                .eq('id', formData.client_id)
                .single()

              if (clientError) throw clientError

              if (clientData) {
                // Thêm client đã chọn vào đầu danh sách
                const selectedClient = {
                  value: clientData.id,
                  label: clientData.trade_name ? `${clientData.name} (${clientData.trade_name})` : clientData.name
                }

                console.log('Invoice: Adding selected client to results:', selectedClient)
                setClients([selectedClient, ...(clients || [])])
              }
            } catch (clientError) {
              console.error('Error fetching selected client:', clientError)
              setClients(clients || [])
            }
          } else {
            setClients(clients || [])
          }
        } else {
          setClients(clients || [])
        }

        setHasMoreClients(hasMore)
        setClientPage(1)
        console.log('Invoice: Fetched', clients?.length, 'clients, hasMore:', hasMore)
      } catch (error) {
        console.error('Error fetching clients:', error)
        // Đặt clients thành mảng rỗng nếu có lỗi
        setClients([])
        setHasMoreClients(false)
      } finally {
        setLoadingClients(false)
      }
    }

    fetchClients()
  }, [clientSearch, formData.client_id])

  // Tải thông tin khách hàng đã chọn khi component mount
  useEffect(() => {
    // Chỉ tải khi có client_id và clients rỗng (lần đầu tiên mount)
    if (formData.client_id && clients.length === 0) {
      const fetchSelectedClient = async () => {
        try {
          console.log('Invoice: Initial load of selected client:', formData.client_id)
          const supabase = createClient()
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('id, name, trade_name')
            .eq('id', formData.client_id)
            .single()

          if (clientError) throw clientError

          if (clientData) {
            // Thêm client đã chọn vào danh sách
            const selectedClient = {
              value: clientData.id,
              label: clientData.trade_name ? `${clientData.name} (${clientData.trade_name})` : clientData.name
            }

            console.log('Invoice: Setting initial selected client:', selectedClient)
            setClients([selectedClient])
          }
        } catch (error) {
          console.error('Error fetching initial selected client:', error)
        }
      }

      fetchSelectedClient()
    }
  }, []) // Chỉ chạy một lần khi component mount

  // Function to load more clients
  const handleLoadMoreClients = async () => {
    if (loadingClients || isLoadingMoreClients || !hasMoreClients) return

    const nextPage = clientPage + 1
    console.log('Invoice: Loading more clients, page:', nextPage)

    try {
      setIsLoadingMoreClients(true)

      // Xử lý trường hợp clientSearch có ký tự đặc biệt
      const safeSearchQuery = clientSearch.replace(/[\\%_]/g, '\\$&')

      const { clients: moreClients, hasMore, error } = await fetchClientsForCombobox({
        page: nextPage,
        limit: 15,
        searchQuery: safeSearchQuery
      })

      if (error) throw error

      if (moreClients && moreClients.length > 0) {
        setClients(prev => {
          // Combine and remove duplicates
          const combined = [...prev, ...moreClients]
          return Array.from(new Map(combined.map(item => [item.value, item])).values())
        })
        setClientPage(nextPage)
        console.log('Invoice: Added', moreClients.length, 'more clients, hasMore:', hasMore)
      }

      setHasMoreClients(hasMore)
    } catch (error) {
      console.error('Error loading more clients:', error)
      // Đảm bảo rằng hasMore được đặt thành false nếu có lỗi
      setHasMoreClients(false)
    } finally {
      setIsLoadingMoreClients(false)
    }
  }

  // Load contacts when client changes
  useEffect(() => {
    if (!formData.client_id) {
      setContacts([])
      return
    }

    const fetchContacts = async () => {
      setLoadingContacts(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('client_id', formData.client_id)

        if (error) throw error
        setContacts(data || [])

        // Nếu chưa có contact_id được chọn và có danh sách contacts, tự động chọn contact đầu tiên
        if (!formData.contact_id && data && data.length > 0) {
          console.log('Auto-selecting first contact on load:', data[0].id)
          handleValueChange('contact_id', data[0].id)
        }
      } catch (error) {
        console.error('Error fetching contacts:', error)
      } finally {
        setLoadingContacts(false)
      }
    }

    fetchContacts()
  }, [formData.client_id, formData.contact_id])

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    console.log('Invoice: Client selected:', clientId)
    handleValueChange('client_id', clientId)

    // Tự động chọn người liên hệ đầu tiên của khách hàng (nếu có)
    const fetchFirstContact = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('contacts')
          .select('id')
          .eq('client_id', clientId)
          .order('created_at', { ascending: true })
          .limit(1)
          .single()

        if (error) {
          console.log('No contacts found for this client or error:', error)
          handleValueChange('contact_id', null)
          return
        }

        if (data) {
          console.log('Auto-selecting first contact:', data.id)
          handleValueChange('contact_id', data.id)
        } else {
          handleValueChange('contact_id', null)
        }
      } catch (error) {
        console.error('Error fetching first contact:', error)
        handleValueChange('contact_id', null)
      }
    }

    fetchFirstContact()

    // Note: We no longer reset order_id to preserve order information
  }

  // Handle opening client dialog for creating a new client
  const handleAddClient = () => {
    setClientDialogMode('create')
    setSelectedClientData(null)
    setClientDialogOpen(true)
  }

  // Handle opening client dialog for editing a client
  const handleEditClient = async () => {
    if (!formData.client_id) return

    try {
      setLoadingClients(true)
      const { client, error } = await fetchClient(formData.client_id)

      if (error) {
        console.error('Error fetching client details:', error)
        return
      }

      if (client) {
        setSelectedClientData(client)
        setClientDialogMode('edit')
        setClientDialogOpen(true)
      }
    } catch (error) {
      console.error('Error fetching client for edit:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  // Handle client dialog success (create/update/delete)
  const handleClientDialogSuccess = async (clientId: string, action: 'create' | 'update' | 'delete') => {
    // Reset search and page to refresh the client list
    setClientSearch('')
    setClientPage(1)

    // Reload clients list
    await fetchClientsData()

    if (action === 'create') {
      // Select the newly created client
      handleValueChange('client_id', clientId)
    } else if (action === 'delete' && formData.client_id === clientId) {
      // Clear selection if the current client was deleted
      handleValueChange('client_id', null)
      handleValueChange('contact_id', null)
    }
  }

  // Function to fetch clients data (for reuse)
  const fetchClientsData = async () => {
    try {
      setLoadingClients(true)
      const { clients: fetchedClients, hasMore, error } = await fetchClientsForCombobox({
        page: 1,
        limit: 15,
        searchQuery: clientSearch
      })

      if (error) {
        console.error('Error fetching clients:', error)
        return
      }

      setClients(fetchedClients || [])
      setHasMoreClients(!!hasMore)
      setClientPage(1)
    } catch (error) {
      console.error('Error in fetchClientsData:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  // Function to fetch contacts data (for reuse)
  const fetchContactsData = async () => {
    if (!formData.client_id) {
      setContacts([])
      return
    }

    try {
      setLoadingContacts(true)
      const { contacts: fetchedContacts, error } = await fetchContactsByClientId(formData.client_id)

      if (error) {
        console.error('Error fetching contacts:', error)
        return
      }

      setContacts(fetchedContacts || [])

      // Không tự động chọn contact đầu tiên khi reload danh sách
      // Chỉ chọn contact đầu tiên khi tạo mới hoặc xóa contact hiện tại
    } catch (error) {
      console.error('Error in fetchContactsData:', error)
    } finally {
      setLoadingContacts(false)
    }
  }

  // Handle opening contact dialog for creating a new contact
  const handleAddContact = () => {
    if (!formData.client_id) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn khách hàng trước khi thêm người liên hệ",
        variant: "destructive"
      })
      return
    }

    setContactDialogMode('create')
    setSelectedContactData(null)
    setContactDialogOpen(true)
  }

  // Handle opening contact dialog for editing a contact
  const handleEditContact = () => {
    if (!formData.contact_id) return

    const contact = contacts.find(c => c.id === formData.contact_id)
    if (contact) {
      setSelectedContactData(contact)
      setContactDialogMode('edit')
      setContactDialogOpen(true)
    }
  }

  // Handle contact dialog success (create/update/delete)
  const handleContactDialogSuccess = async (contactId: string, action: 'create' | 'update' | 'delete') => {
    // Reload contacts list
    await fetchContactsData()

    if (action === 'create') {
      // Select the newly created contact
      handleValueChange('contact_id', contactId)
    } else if (action === 'delete' && formData.contact_id === contactId) {
      // Clear selection if the current contact was deleted
      handleValueChange('contact_id', null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin khách hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="client_id">Bill To</Label>
              <div className="flex space-x-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleAddClient}
                  title="Thêm khách hàng mới"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
                {formData.client_id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleEditClient}
                    title="Chỉnh sửa khách hàng"
                    disabled={loadingClients}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <HeadlessuiCombobox
              options={clients.map(client => ({
                label: client.label,
                value: client.value
              }))}
              value={formData.client_id || ''}
              onChange={handleClientChange}
              onInputChange={setClientSearch}
              placeholder="Tìm kiếm khách hàng..."
              isLoading={loadingClients}
              emptyMessage={loadingClients ? "Đang tải khách hàng..." : "Không tìm thấy khách hàng"}
              hasMore={hasMoreClients}
              onLoadMore={handleLoadMoreClients}
              isLoadingMore={isLoadingMoreClients}
              // Thêm selectedItemData để hiển thị giá trị đã chọn ngay cả khi không có trong danh sách
              selectedItemData={
                formData.client_id ? {
                  value: formData.client_id,
                  label: clients.find(c => c.value === formData.client_id)?.label || 'Đang tải...',
                  description: '' // Thêm description để phù hợp với kiểu ComboboxItem
                } : null
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="contact_id">Người liên hệ</Label>
              {formData.client_id && (
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleAddContact}
                    title="Thêm người liên hệ mới"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  {formData.contact_id && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleEditContact}
                      title="Chỉnh sửa người liên hệ"
                      disabled={loadingContacts}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <HeadlessuiCombobox
              options={contacts.map(contact => ({
                label: contact.full_name + (contact.position ? ` (${contact.position})` : ''),
                value: contact.id
              }))}
              value={formData.contact_id || ''}
              onChange={(value) => handleValueChange('contact_id', value)}
              placeholder="Chọn người liên hệ"
              isLoading={loadingContacts}
              emptyMessage={loadingContacts ? "Đang tải người liên hệ..." : "Không có người liên hệ"}
              disabled={!formData.client_id}
            />
          </div>
        </CardContent>
      </Card>

      {/* Client Dialog */}
      <ClientDialog
        isOpen={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        onSuccess={handleClientDialogSuccess}
        clientId={formData.client_id || undefined}
        clientData={selectedClientData}
        mode={clientDialogMode}
      />

      {/* Contact Dialog */}
      {formData.client_id && (
        <ContactDialog
          isOpen={contactDialogOpen}
          onClose={() => setContactDialogOpen(false)}
          onSuccess={handleContactDialogSuccess}
          clientId={formData.client_id}
          contactId={formData.contact_id || undefined}
          contactData={selectedContactData || undefined}
          mode={contactDialogMode}
        />
      )}
    </>
  )
}
