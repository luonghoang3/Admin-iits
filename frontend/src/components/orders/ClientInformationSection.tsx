import React, { Fragment } from 'react'
import { Combobox, Transition, Menu } from '@headlessui/react'
import {
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  EllipsisVerticalIcon
} from "@heroicons/react/24/outline"
import { ChevronUpDownIcon } from "@heroicons/react/20/solid"

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
                <Combobox
                  value={client_id}
                  onChange={(value: string) => {
                    handleValueChange('client_id', value)
                    handleClientChange(value)
                  }}
                >
                  <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-input shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-300 sm:text-sm">
                      <Combobox.Input
                        className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                        displayValue={(clientId: string) =>
                          clients.find(c => c.id === clientId)?.name || ''
                        }
                        onChange={(event) => handleClientSearch(event.target.value)}
                        placeholder="Search client..."
                      />
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </Combobox.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {loading ? (
                          <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            Loading clients...
                          </div>
                        ) : getFilteredClients().length === 0 ? (
                          <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            No clients found.
                          </div>
                        ) : (
                          <>
                            {getFilteredClients().map((client) => (
                              <Combobox.Option
                                key={client.id}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-primary text-white' : 'text-gray-900'
                                  }`
                                }
                                value={client.id}
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span
                                      className={`block truncate ${
                                        selected ? 'font-medium' : 'font-normal'
                                      }`}
                                    >
                                      {client.name}
                                    </span>
                                    {selected ? (
                                      <span
                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                          active ? 'text-white' : 'text-primary'
                                        }`}
                                      >
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Combobox.Option>
                            ))}
                            {hasMoreClients && (
                              <div
                                className="relative cursor-pointer select-none py-2 px-4 text-center text-gray-700 hover:bg-gray-100"
                                onClick={loadMoreClients}
                              >
                                {isLoadingMoreClients ? 'Loading more...' : 'Load more clients'}
                              </div>
                            )}
                          </>
                        )}
                      </Combobox.Options>
                    </Transition>
                  </div>
                </Combobox>
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