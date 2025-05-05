import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { HeadlessuiCombobox } from "@/components/ui/combobox-wrapper"
import { createClient, fetchClientsForCombobox } from '@/utils/supabase/client'
import { Contact } from '@/types/clients'
import { InvoiceFormData } from '@/types/invoices'


interface ClientInformationSectionProps {
  formData: InvoiceFormData
  handleValueChange: (field: string, value: any) => void
}

export default function ClientInformationSection({
  formData,
  handleValueChange
}: ClientInformationSectionProps) {
  const [clients, setClients] = useState<any[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [hasMoreClients, setHasMoreClients] = useState(true)
  const [isLoadingMoreClients, setIsLoadingMoreClients] = useState(false)
  const [clientPage, setClientPage] = useState(1)

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
                .select('id, name')
                .eq('id', formData.client_id)
                .single()

              if (clientError) throw clientError

              if (clientData) {
                // Thêm client đã chọn vào đầu danh sách
                const selectedClient = {
                  value: clientData.id,
                  label: clientData.name
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
            .select('id, name')
            .eq('id', formData.client_id)
            .single()

          if (clientError) throw clientError

          if (clientData) {
            // Thêm client đã chọn vào danh sách
            const selectedClient = {
              value: clientData.id,
              label: clientData.name
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
      } catch (error) {
        console.error('Error fetching contacts:', error)
      } finally {
        setLoadingContacts(false)
      }
    }

    fetchContacts()
  }, [formData.client_id])

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    console.log('Invoice: Client selected:', clientId)
    handleValueChange('client_id', clientId)
    // Reset contact and order when client changes
    handleValueChange('contact_id', null)
    handleValueChange('order_id', null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin khách hàng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="client_id">Khách hàng</Label>
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
          <Label htmlFor="contact_id">Người liên hệ</Label>
          <HeadlessuiCombobox
            options={contacts.map(contact => ({
              label: contact.full_name + (contact.position ? ` (${contact.position})` : ''),
              value: contact.id
            }))}
            value={formData.contact_id || ''}
            onChange={(value) => handleValueChange('contact_id', value)}
            placeholder="Chọn người liên hệ"
            isLoading={loadingContacts}
            emptyMessage="Không có người liên hệ"
            disabled={!formData.client_id}
          />
        </div>
      </CardContent>
    </Card>
  )
}
