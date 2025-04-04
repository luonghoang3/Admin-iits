import React, { Fragment } from 'react'
import { Combobox, Transition } from '@headlessui/react'
import { 
  ArchiveBoxIcon as PackageIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline"
import { ChevronUpDownIcon } from "@heroicons/react/20/solid"

// ShadCN components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Types
import { OrderItem, Commodity, Unit } from '@/types/orders.d'

interface OrderItemFormData {
  id?: string;
  commodity_id: string;
  commodity_description?: string | null;
  quantity: number;
  unit_id: string;
}

interface OrderItemsSectionProps {
  orderItems: OrderItem[];
  currentItem: OrderItemFormData;
  itemFormOpen: boolean;
  setItemFormOpen: (open: boolean) => void;
  itemError: string | null;
  isEditingItem: boolean;
  
  // Commodities and units
  commodities: Commodity[];
  units: Unit[];
  commoditySearch: string;
  unitSearch: string;
  setCommoditySearch: (search: string) => void;
  setUnitSearch: (search: string) => void;
  getFilteredCommodities: () => Commodity[];
  getFilteredUnits: () => Unit[];
  hasMoreCommodities: boolean;
  isLoadingMoreCommodities: boolean;
  loadMoreCommodities: () => void;
  
  // Handlers
  openAddItemForm: () => void;
  openEditItemForm: (itemId: string) => void;
  handleItemChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleItemSelectChange: (name: string, value: any) => void;
  handleSaveItem: () => void;
  handleDeleteItem: (itemId: string) => void;
  handleCommoditySearch: (query: string) => void;
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  orderItems,
  currentItem,
  itemFormOpen,
  setItemFormOpen,
  itemError,
  isEditingItem,
  commodities,
  units,
  commoditySearch,
  unitSearch,
  setCommoditySearch,
  setUnitSearch,
  getFilteredCommodities,
  getFilteredUnits,
  hasMoreCommodities,
  isLoadingMoreCommodities,
  loadMoreCommodities,
  openAddItemForm,
  openEditItemForm,
  handleItemChange,
  handleItemSelectChange,
  handleSaveItem,
  handleDeleteItem,
  handleCommoditySearch
}) => {
  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <PackageIcon className="mr-2 h-5 w-5" />
            Order Items
          </CardTitle>
          <Button size="sm" variant="default" onClick={openAddItemForm}>
            <PlusIcon className="mr-1 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {orderItems.length === 0 ? (
            <Alert variant="default" className="bg-muted">
              <PackageIcon className="h-4 w-4" />
              <AlertTitle>No items</AlertTitle>
              <AlertDescription>
                Add items to this order using the Add Item button
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item, index) => (
                  <TableRow key={item.id || `new-item-${index}`}>
                    <TableCell>
                      {item.commodities?.name || 'Unknown Commodity'}
                    </TableCell>
                    <TableCell>{item.commodity_description || '-'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.units?.name || 'Unknown Unit'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditItemForm(item.id || '')}
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id || '')}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Item Form Dialog */}
      <Dialog open={itemFormOpen} onOpenChange={setItemFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditingItem ? 'Edit Order Item' : 'Add New Order Item'}
            </DialogTitle>
            <DialogDescription>
              {isEditingItem 
                ? 'Update the details of this order item.'
                : 'Add a new item to this order.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {itemError && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{itemError}</div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="commodity_id">Commodity*</Label>
              <Combobox
                value={currentItem.commodity_id}
                onChange={(value: string) => handleItemSelectChange('commodity_id', value)}
              >
                <div className="relative">
                  <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-input shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-300 sm:text-sm">
                    <Combobox.Input
                      className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                      displayValue={(commodityId: string) => 
                        commodities.find(c => c.id === commodityId)?.name || ''
                      }
                      onChange={(event) => handleCommoditySearch(event.target.value)}
                      placeholder="Search commodity..."
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
                      {getFilteredCommodities().length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                          No commodities found.
                        </div>
                      ) : (
                        <>
                          {getFilteredCommodities().map((commodity) => (
                            <Combobox.Option
                              key={commodity.id}
                              className={({ active }) =>
                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                  active ? 'bg-primary text-white' : 'text-gray-900'
                                }`
                              }
                              value={commodity.id}
                            >
                              {({ selected, active }) => (
                                <>
                                  <span
                                    className={`block truncate ${
                                      selected ? 'font-medium' : 'font-normal'
                                    }`}
                                  >
                                    {commodity.name}
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
                          {hasMoreCommodities && (
                            <div 
                              className="relative cursor-pointer select-none py-2 px-4 text-center text-gray-700 hover:bg-gray-100"
                              onClick={loadMoreCommodities}
                            >
                              {isLoadingMoreCommodities ? 'Loading more...' : 'Load more commodities'}
                            </div>
                          )}
                        </>
                      )}
                    </Combobox.Options>
                  </Transition>
                </div>
              </Combobox>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity*</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={currentItem.quantity}
                onChange={handleItemChange}
                min="1"
                step="0.01"
                placeholder="Enter quantity"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="unit_id">Unit*</Label>
              <Combobox
                value={currentItem.unit_id}
                onChange={(value: string) => handleItemSelectChange('unit_id', value)}
              >
                <div className="relative">
                  <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-input shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-300 sm:text-sm">
                    <Combobox.Input
                      className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                      displayValue={(unitId: string) => 
                        units.find(u => u.id === unitId)?.name || ''
                      }
                      onChange={(event) => setUnitSearch(event.target.value)}
                      placeholder="Search unit..."
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
                      {getFilteredUnits().length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                          No units found.
                        </div>
                      ) : (
                        getFilteredUnits().map((unit) => (
                          <Combobox.Option
                            key={unit.id}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-primary text-white' : 'text-gray-900'
                              }`
                            }
                            value={unit.id}
                          >
                            {({ selected, active }) => (
                              <>
                                <span
                                  className={`block truncate ${
                                    selected ? 'font-medium' : 'font-normal'
                                  }`}
                                >
                                  {unit.name}
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
                        ))
                      )}
                    </Combobox.Options>
                  </Transition>
                </div>
              </Combobox>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="commodity_description">Description (Optional)</Label>
              <Textarea
                id="commodity_description"
                name="commodity_description"
                value={currentItem.commodity_description || ''}
                onChange={handleItemChange}
                placeholder="Enter additional item details"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem}>
              {isEditingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default OrderItemsSection 