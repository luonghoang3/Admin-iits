import React, { Fragment, useState } from 'react'
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
import { OrderItem, Commodity, Unit } from '@/types/orders'

// Helper functions
const getCommodityName = (item: OrderItem, commodities: Commodity[]): string => {
  if (item.commodity && typeof item.commodity === 'object' && item.commodity.name) {
    return item.commodity.name;
  }

  if (item.commodities && typeof item.commodities === 'object' && item.commodities.name) {
    return item.commodities.name;
  }

  const commodity = commodities.find(c => c.id === item.commodity_id);
  return commodity ? commodity.name : 'Unknown Commodity';
};

const getUnitName = (item: OrderItem, units: Unit[]): string => {
  if (item.unit && typeof item.unit === 'object' && item.unit.name) {
    return item.unit.name;
  }

  if (item.units && typeof item.units === 'object' && item.units.name) {
    return item.units.name;
  }

  const unit = units.find(u => u.id === item.unit_id);
  return unit ? unit.name : 'Unknown Unit';
};

// Refactored interface to accept functions from useOrderFormV2
interface OrderItemsSectionProps {
  // Data from useOrderFormV2
  orderItems: OrderItem[];
  addLocalItem: (item: Omit<OrderItem, 'id'>) => void;
  updateLocalItem: (idOrIndex: string | number, updatedFields: Partial<OrderItem>) => void;
  removeLocalItem: (idOrIndex: string | number) => void;

  // Data from other hooks
  commodities: Commodity[];
  units: Unit[];
  isLoadingCommodities?: boolean;
  isLoadingUnits?: boolean;
  isLoadingItems?: boolean;
  itemError?: string | null;

  // Optional props for commodity/unit search (can be managed internally)
  commoditySearch?: string;
  unitSearch?: string;
  setCommoditySearch?: (search: string) => void;
  setUnitSearch?: (search: string) => void;
  getFilteredCommodities?: () => Commodity[];
  getFilteredUnits?: () => Unit[];
  hasMoreCommodities?: boolean;
  isLoadingMoreCommodities?: boolean;
  loadMoreCommodities?: () => void;
  handleCommoditySearch?: (query: string) => void;
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  // Core props from OrderForm
  orderItems,
  addLocalItem,
  updateLocalItem,
  removeLocalItem,
  commodities,
  units,
  isLoadingCommodities,
  isLoadingUnits,
  isLoadingItems,
  itemError: parentItemError,

  // Optional search props (with defaults)
  commoditySearch: externalCommoditySearch = '',
  unitSearch: externalUnitSearch = '',
  setCommoditySearch: setExternalCommoditySearch,
  setUnitSearch: setExternalUnitSearch,
  getFilteredCommodities: externalGetFilteredCommodities,
  getFilteredUnits: externalGetFilteredUnits,
  hasMoreCommodities,
  isLoadingMoreCommodities,
  loadMoreCommodities,
  handleCommoditySearch: externalHandleCommoditySearch
}) => {
  // --- Local Dialog State Management ---
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [currentItemData, setCurrentItemData] = useState<Partial<OrderItem>>({});
  const [isEditingItemDialog, setIsEditingItemDialog] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
  const [localDialogError, setLocalDialogError] = useState<string | null>(null);

  // Local search state (used if external state not provided)
  const [localCommoditySearch, setLocalCommoditySearch] = useState(externalCommoditySearch);
  const [localUnitSearch, setLocalUnitSearch] = useState(externalUnitSearch);

  // --- Dialog Management Functions ---
  const openAddItemForm = () => {
    setCurrentItemData({});
    setIsEditingItemDialog(false);
    setEditingItemId(null);
    setLocalDialogError(null);
    setIsItemDialogOpen(true);
  };

  const openEditItemForm = (item: OrderItem) => {
    // Create a clean copy of the item data
    setCurrentItemData({ ...item });
    setIsEditingItemDialog(true);
    setEditingItemId(item.id || null);
    setLocalDialogError(null);
    setIsItemDialogOpen(true);
  };

  const closeItemDialog = () => {
    setIsItemDialogOpen(false);
    setCurrentItemData({});
    setIsEditingItemDialog(false);
    setEditingItemId(null);
    setLocalDialogError(null);
    // Reset search
    setLocalCommoditySearch('');
    setLocalUnitSearch('');
    if (setExternalCommoditySearch) setExternalCommoditySearch('');
    if (setExternalUnitSearch) setExternalUnitSearch('');
  };

  // --- Form Handling Functions ---
  const handleItemDialogChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'quantity') {
      const numValue = parseFloat(value);
      setCurrentItemData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? '' : numValue
      }));
    } else {
      setCurrentItemData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    setLocalDialogError(null);
  };

  const handleItemSelectChange = (field: string, value: any) => {
    setCurrentItemData(prev => ({
      ...prev,
      [field]: value
    }));
    setLocalDialogError(null);
  };

  const handleSaveItem = () => {
    setLocalDialogError(null);

    // Basic validation
    if (!currentItemData.commodity_id) {
      setLocalDialogError('Please select a commodity');
      return;
    }

    if (!currentItemData.unit_id) {
      setLocalDialogError('Please select a unit');
      return;
    }

    const quantity = Number(currentItemData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setLocalDialogError('Please enter a valid quantity greater than 0');
      return;
    }

    try {
      // Prepare item data
      const selectedCommodity = commodities.find(c => c.id === currentItemData.commodity_id);
      const selectedUnit = units.find(u => u.id === currentItemData.unit_id);

      const itemToSave: Omit<OrderItem, 'id'> = {
        commodity_id: currentItemData.commodity_id!,
        unit_id: currentItemData.unit_id!,
        quantity: quantity,
        commodity_description: currentItemData.commodity_description || null,
        // Include commodity and unit information
        commodities: selectedCommodity || null,
        commodity: selectedCommodity || null,
        units: selectedUnit || null,
        unit: selectedUnit || null
      };

      if (isEditingItemDialog && editingItemId) {
        // Update existing item
        updateLocalItem(editingItemId, itemToSave);
      } else {
        // Add new item
        addLocalItem(itemToSave);
      }

      // Close dialog on success
      closeItemDialog();
    } catch (error: any) {
      console.error("Error saving item:", error);
      setLocalDialogError(error.message || "Failed to save item");
    }
  };

  const handleDeleteItem = (idOrIndex: string | number) => {
    if (confirm('Are you sure you want to remove this item?')) {
      try {
        removeLocalItem(idOrIndex);
      } catch (error: any) {
        console.error("Error removing item:", error);
        alert(`Failed to remove item: ${error.message || "Unknown error"}`);
      }
    }
  };

  // --- Search and Filtering Functions ---
  const handleLocalCommoditySearch = (query: string) => {
    setLocalCommoditySearch(query);
    if (externalHandleCommoditySearch) {
      externalHandleCommoditySearch(query);
    }
  };

  const getLocalFilteredCommodities = () => {
    if (externalGetFilteredCommodities) {
      return externalGetFilteredCommodities();
    }

    if (!localCommoditySearch) {
      return commodities;
    }

    return commodities.filter(c =>
      c.name.toLowerCase().includes(localCommoditySearch.toLowerCase())
    );
  };

  const handleLocalUnitSearch = (query: string) => {
    setLocalUnitSearch(query);
    if (setExternalUnitSearch) {
      setExternalUnitSearch(query);
    }
  };

  const getLocalFilteredUnits = () => {
    if (externalGetFilteredUnits) {
      return externalGetFilteredUnits();
    }

    if (!localUnitSearch) {
      return units;
    }

    return units.filter(u =>
      u.name.toLowerCase().includes(localUnitSearch.toLowerCase())
    );
  };

  // --- Render Component ---
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
          {/* Display parent error if exists */}
          {parentItemError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{parentItemError}</AlertDescription>
            </Alert>
          )}

          {/* Display loading state */}
          {isLoadingItems && <p className="text-sm text-gray-500 mb-4">Loading items...</p>}

          {/* Empty state or items table */}
          {orderItems.length === 0 && !isLoadingItems ? (
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
                {orderItems.map((item, index) => {
                  // Get commodity name using helper function
                  const commodityName = getCommodityName(item, commodities);

                  // Get unit name using helper function
                  const unitName = getUnitName(item, units);

                  return (
                    <TableRow key={item.id || `new-item-${index}`}>
                      <TableCell>{commodityName}</TableCell>
                      <TableCell>{item.commodity_description || '-'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{unitName}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditItemForm(item)}
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id || index)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Item Form Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditingItemDialog ? 'Edit Order Item' : 'Add New Order Item'}
            </DialogTitle>
            <DialogDescription>
              {isEditingItemDialog
                ? 'Update the details of this order item.'
                : 'Add a new item to this order.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {localDialogError && (
              <Alert variant="destructive">
                <AlertDescription>{localDialogError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="commodity_id">Commodity*</Label>
              <Combobox
                value={currentItemData.commodity_id || ''}
                onChange={(value: string) => handleItemSelectChange('commodity_id', value)}
              >
                <div className="relative">
                  <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-input shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-300 sm:text-sm">
                    <Combobox.Input
                      className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                      displayValue={(commodityId: string) =>
                        commodities.find(c => c.id === commodityId)?.name || ''
                      }
                      onChange={(event) => handleLocalCommoditySearch(event.target.value)}
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
                    <Combobox.Options className="absolute z-20 mt-1 max-h-96 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {isLoadingCommodities ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                          Loading...
                        </div>
                      ) : getLocalFilteredCommodities().length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                          No commodities found.
                        </div>
                      ) : (
                        <>
                          {getLocalFilteredCommodities().map((commodity) => (
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
                value={currentItemData.quantity ?? ''}
                onChange={handleItemDialogChange}
                min="0.01"
                step="any"
                placeholder="Enter quantity"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unit_id">Unit*</Label>
              <Combobox
                value={currentItemData.unit_id || ''}
                onChange={(value: string) => handleItemSelectChange('unit_id', value)}
              >
                <div className="relative">
                  <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-input shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-300 sm:text-sm">
                    <Combobox.Input
                      className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                      displayValue={(unitId: string) =>
                        units.find(u => u.id === unitId)?.name || ''
                      }
                      onChange={(event) => handleLocalUnitSearch(event.target.value)}
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
                    <Combobox.Options className="absolute z-20 mt-1 max-h-96 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {isLoadingUnits ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                          Loading...
                        </div>
                      ) : getLocalFilteredUnits().length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                          No units found.
                        </div>
                      ) : (
                        getLocalFilteredUnits().map((unit) => (
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
                value={currentItemData.commodity_description || ''}
                onChange={handleItemDialogChange}
                placeholder="Enter additional item details"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeItemDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem}>
              {isEditingItemDialog ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default OrderItemsSection