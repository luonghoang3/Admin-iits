import React, { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon
} from "@heroicons/react/24/outline"

// Import custom combobox component
import { Combobox as HeadlessuiCombobox } from "@/components/ui/combobox"

// ShadCN components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

// Types
import { OrderFormData } from '@/types/orders'
import { Client, Contact } from '@/types/clients.d'

interface ClientInformationSectionProps {
  formData: OrderFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleValueChange: (name: string, value: any) => void;
  handleClientChange: (clientId: string) => Promise<void>;

  // Client states and handlers
  clients: Client[];
  contacts: Contact[];
  loading: boolean;
  getFilteredClients: () => Client[];
  hasMoreClients: boolean;
  isLoadingMoreClients: boolean;
  loadMoreClients: () => void;
  handleClientSearch: (query: string) => void;

  // Dialog handlers
  openAddClientDialog: () => void;
  openEditClientDialog: (clientId: string) => void;
  openDeleteClientConfirm: () => void;
  openAddContactDialog: () => void;
  openEditContactDialog: (contactId: string) => void;
  openDeleteContactConfirm: () => void;
}

const ClientInformationSection: React.FC<ClientInformationSectionProps> = ({
  formData,
  handleChange,
  handleValueChange,
  handleClientChange,
  clients,
  contacts,
  loading,
  getFilteredClients,
  hasMoreClients,
  isLoadingMoreClients,
  loadMoreClients,
  handleClientSearch,
  openAddClientDialog,
  openEditClientDialog,
  openDeleteClientConfirm,
  openAddContactDialog,
  openEditContactDialog,
  openDeleteContactConfirm
}) => {
  // Ensure values are never undefined
  const client_id = formData.client_id || '';
  const contact_id = formData.contact_id || '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UsersIcon className="h-5 w-5 mr-2 text-gray-500" />
          Client Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="client_id">Client</Label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <HeadlessuiCombobox
                  items={clients.map(client => ({
                    label: client.trade_name || client.name, // Ưu tiên trade_name (tiếng Anh) nếu có
                    description: client.email || '',
                    value: client.id
                  }))}
                  value={client_id}
                  onChange={(value: string) => {
                    handleValueChange('client_id', value)
                    handleClientChange(value)
                  }}
                  placeholder="Select client..."
                  onSearch={handleClientSearch}
                  loading={loading}
                  emptyContent={
                    <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                      {loading ? "Loading clients..." : "No clients found"}
                    </div>
                  }
                  loadingContent={
                    <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                      Loading...
                    </div>
                  }
                  showSelected
                  onLoadMore={loadMoreClients}
                  hasMore={hasMoreClients}
                  isLoadingMore={isLoadingMoreClients}
                  selectedItemData={
                    client_id ? {
                      value: client_id,
                      label: clients.find(c => c.id === client_id)?.trade_name || clients.find(c => c.id === client_id)?.name || '',
                      description: clients.find(c => c.id === client_id)?.email || ''
                    } : null
                  }
                />
              </div>

              <div>
                <Menu as="div" className="relative">
                  <Menu.Button className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground">
                    <span className="sr-only">Open options</span>
                    <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={openAddClientDialog}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex w-full items-center px-4 py-2 text-sm`}
                            >
                              <PlusIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                              Add New Client
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => client_id && openEditClientDialog(client_id)}
                              disabled={!client_id}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex w-full items-center px-4 py-2 text-sm ${
                                !client_id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <PencilIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                              Edit Client
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => client_id && openDeleteClientConfirm()}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex w-full items-center px-4 py-2 text-sm ${
                                !client_id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                              Delete Client
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_id">Contact Person</Label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Select
                  value={contact_id}
                  onValueChange={(value) => handleValueChange('contact_id', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={contacts.length === 0 ? "No contacts available" : "Select a contact"} />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Menu as="div" className="relative">
                  <Menu.Button className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground">
                    <span className="sr-only">Open options</span>
                    <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={openAddContactDialog}
                              disabled={!client_id}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex w-full items-center px-4 py-2 text-sm ${
                                !client_id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <PlusIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                              Add New Contact
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => contact_id && openEditContactDialog(contact_id)}
                              disabled={!contact_id}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex w-full items-center px-4 py-2 text-sm ${
                                !contact_id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <PencilIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                              Edit Contact
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => contact_id && openDeleteContactConfirm()}
                              disabled={!contact_id}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex w-full items-center px-4 py-2 text-sm ${
                                !contact_id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                              Delete Contact
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ClientInformationSection