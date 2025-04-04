import React, { Fragment } from 'react'
import { Combobox, Transition, Menu } from '@headlessui/react'
import { 
  TruckIcon as ShipIcon,
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
import { Input } from "@/components/ui/input"

// Types
import { OrderFormData } from '@/types/orders.d'

interface Shipper {
  id: string;
  name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface Buyer {
  id: string;
  name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface ShippingSectionProps {
  formData: OrderFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleValueChange: (name: string, value: any) => void;
  
  // Shipping entities
  shippers: Shipper[];
  buyers: Buyer[];
  getFilteredShippers: () => Shipper[];
  getFilteredBuyers: () => Buyer[];
  hasMoreShippers: boolean;
  isLoadingMoreShippers: boolean;
  hasMoreBuyers: boolean;
  isLoadingMoreBuyers: boolean;
  loadMoreShippers: () => void;
  loadMoreBuyers: () => void;
  handleShipperSearch: (query: string) => void;
  handleBuyerSearch: (query: string) => void;
  
  // Dialog handlers
  openAddShipperDialog: () => void;
  openEditShipperDialog: (shipperId: string) => void;
  openDeleteShipperConfirm: () => void;
  openAddBuyerDialog: () => void;
  openEditBuyerDialog: (buyerId: string) => void;
  openDeleteBuyerConfirm: () => void;
}

const ShippingSection: React.FC<ShippingSectionProps> = ({
  formData,
  handleChange,
  handleValueChange,
  shippers,
  buyers,
  getFilteredShippers,
  getFilteredBuyers,
  hasMoreShippers,
  isLoadingMoreShippers,
  hasMoreBuyers,
  isLoadingMoreBuyers,
  loadMoreShippers,
  loadMoreBuyers,
  handleShipperSearch,
  handleBuyerSearch,
  openAddShipperDialog,
  openEditShipperDialog,
  openDeleteShipperConfirm,
  openAddBuyerDialog,
  openEditBuyerDialog,
  openDeleteBuyerConfirm
}) => {
  // Ensure shipper_id and buyer_id are never undefined for Combobox
  const shipper_id = formData.shipper_id || '';
  const buyer_id = formData.buyer_id || '';
  const vessel_carrier = formData.vessel_carrier || '';
  const bill_of_lading = formData.bill_of_lading || '';
  const bill_of_lading_date = formData.bill_of_lading_date || '';

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
          <div className="space-y-2">
            <Label htmlFor="shipper_id" className="text-sm font-medium">Shipper</Label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Combobox
                  value={shipper_id}
                  onChange={(value: string) => {
                    handleValueChange('shipper_id', value);
                  }}
                >
                  <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-input shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-300 sm:text-sm">
                      <Combobox.Input
                        className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                        displayValue={(id) => {
                          // Find shipper by ID
                          const shipper = shippers.find(s => s.id === id);
                          // Return name or empty string
                          return shipper ? shipper.name : '';
                        }}
                        onChange={(event) => {
                          // Only search if input is not empty
                          // This prevents clearing the list when we have a selected value
                          if (event.target.value.trim() !== '') {
                            handleShipperSearch(event.target.value);
                          }
                        }}
                        placeholder="Search shipper..."
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
                        {getFilteredShippers().length === 0 ? (
                          <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            No shippers found.
                          </div>
                        ) : (
                          <>
                            {getFilteredShippers().map((shipper) => (
                              <Combobox.Option
                                key={shipper.id}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-primary text-white' : 'text-gray-900'
                                  }`
                                }
                                value={shipper.id}
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span
                                      className={`block truncate ${
                                        selected ? 'font-medium' : 'font-normal'
                                      }`}
                                    >
                                      {shipper.name}
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
                            {hasMoreShippers && (
                              <div 
                                className="relative cursor-pointer select-none py-2 px-4 text-center text-gray-700 hover:bg-gray-100"
                                onClick={loadMoreShippers}
                              >
                                {isLoadingMoreShippers ? 'Loading more...' : 'Load more shippers'}
                              </div>
                            )}
                          </>
                        )}
                      </Combobox.Options>
                    </Transition>
                  </div>
                </Combobox>
              </div>
              
              <div className="relative">
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground">
                      <span className="sr-only">Open options</span>
                      <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                    </Menu.Button>
                  </div>
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
                              onClick={openAddShipperDialog}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex w-full items-center px-4 py-2 text-sm`}
                            >
                              <PlusIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                              Add Shipper
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => shipper_id && openEditShipperDialog(shipper_id)}
                              disabled={!shipper_id}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex w-full items-center px-4 py-2 text-sm ${
                                !shipper_id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <PencilIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                              Edit Shipper
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => shipper_id && openDeleteShipperConfirm()}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex w-full items-center px-4 py-2 text-sm`}
                            >
                              <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                              Delete Shipper
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
            <Label htmlFor="buyer_id" className="text-sm font-medium">Buyer</Label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Combobox
                  value={buyer_id}
                  onChange={(value: string) => {
                    handleValueChange('buyer_id', value);
                  }}
                >
                  <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-input shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-300 sm:text-sm">
                      <Combobox.Input
                        className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                        displayValue={(id) => {
                          // Find buyer by ID
                          const buyer = buyers.find(b => b.id === id);
                          // Return name or empty string
                          return buyer ? buyer.name : '';
                        }}
                        onChange={(event) => {
                          // Only search if input is not empty
                          // This prevents clearing the list when we have a selected value
                          if (event.target.value.trim() !== '') {
                            handleBuyerSearch(event.target.value);
                          }
                        }}
                        placeholder="Search buyer..."
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
                        {getFilteredBuyers().length === 0 ? (
                          <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            No buyers found.
                          </div>
                        ) : (
                          <>
                            {getFilteredBuyers().map((buyer) => (
                              <Combobox.Option
                                key={buyer.id}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-primary text-white' : 'text-gray-900'
                                  }`
                                }
                                value={buyer.id}
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span
                                      className={`block truncate ${
                                        selected ? 'font-medium' : 'font-normal'
                                      }`}
                                    >
                                      {buyer.name}
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
                            {hasMoreBuyers && (
                              <div 
                                className="relative cursor-pointer select-none py-2 px-4 text-center text-gray-700 hover:bg-gray-100"
                                onClick={loadMoreBuyers}
                              >
                                {isLoadingMoreBuyers ? 'Loading more...' : 'Load more buyers'}
                              </div>
                            )}
                          </>
                        )}
                      </Combobox.Options>
                    </Transition>
                  </div>
                </Combobox>
              </div>
              
              <div className="relative">
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground">
                      <span className="sr-only">Open options</span>
                      <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                    </Menu.Button>
                  </div>
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
                              onClick={openAddBuyerDialog}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex w-full items-center px-4 py-2 text-sm`}
                            >
                              <PlusIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                              Add Buyer
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => buyer_id && openEditBuyerDialog(buyer_id)}
                              disabled={!buyer_id}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex w-full items-center px-4 py-2 text-sm ${
                                !buyer_id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <PencilIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                              Edit Buyer
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => buyer_id && openDeleteBuyerConfirm()}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex w-full items-center px-4 py-2 text-sm`}
                            >
                              <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                              Delete Buyer
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
          
          <div className="grid grid-cols-3 col-span-2 gap-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="vessel_carrier" className="text-sm font-medium">Vessel/Carrier</Label>
              <Input
                id="vessel_carrier"
                name="vessel_carrier"
                value={vessel_carrier}
                onChange={handleChange}
                placeholder="Vessel or carrier name"
                className="h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bill_of_lading" className="text-sm font-medium">Bill of Lading</Label>
              <Input
                id="bill_of_lading"
                name="bill_of_lading"
                value={bill_of_lading}
                onChange={handleChange}
                placeholder="Bill of lading number"
                className="h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bill_of_lading_date" className="text-sm font-medium">B/L Date</Label>
              <Input
                id="bill_of_lading_date"
                name="bill_of_lading_date"
                type="date"
                value={bill_of_lading_date}
                onChange={handleChange}
                placeholder="mm/dd/yyyy"
                className="h-10"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ShippingSection 