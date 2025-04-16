import React, { Fragment, useState } from 'react'
// Import custom combobox component
import { Combobox as HeadlessuiCombobox } from "@/components/ui/combobox"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Lazy load dialog
import dynamic from 'next/dynamic'

const OrderItemDialog = dynamic(() => import('./dialogs/OrderItemDialog'), {
  loading: () => null
})

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
  // Data from useOrderItems
  orderItems: OrderItem[];
  addOrUpdateItem: (item: Partial<OrderItem>) => void;
  removeItem: (idOrIndex: string | number) => void;

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
  addOrUpdateItem,
  removeItem,
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

  // Handler for add or update item
  const handleSaveItem = () => {
    if (!currentItemData) return;
    console.log('OrderItemsSection: handleSaveItem called with data:', currentItemData);
    addOrUpdateItem(currentItemData);
    console.log('OrderItemsSection: addOrUpdateItem called');
    setIsItemDialogOpen(false);
    setCurrentItemData({});
    setIsEditingItemDialog(false);
    setEditingItemId(null);
    setLocalDialogError(null);
  };

  // Handler for delete item
  const handleDeleteItem = (idOrIndex: string | number) => {
    removeItem(idOrIndex);
  };

  // Handler for open add item dialog
  const openAddItemForm = () => {
    setCurrentItemData({});
    setIsEditingItemDialog(false);
    setIsItemDialogOpen(true);
    setEditingItemId(null);
    setLocalDialogError(null);
  };

  // Handler for open edit item dialog
  const openEditItemForm = (item: OrderItem) => {
    setCurrentItemData(item);
    setIsEditingItemDialog(true);
    setIsItemDialogOpen(true);
    setEditingItemId(item.id || null);
    setLocalDialogError(null);
  };

  // Handler for close dialog
  const closeItemDialog = () => {
    setIsItemDialogOpen(false);
    setCurrentItemData({});
    setIsEditingItemDialog(false);
    setEditingItemId(null);
    setLocalDialogError(null);
  };

  // Local search state (used if external state not provided)
  const [localCommoditySearch, setLocalCommoditySearch] = useState(externalCommoditySearch);
  const [localUnitSearch, setLocalUnitSearch] = useState(externalUnitSearch);

  // --- Form Handling Functions ---
  const handleItemDialogChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'quantity') {
      const numValue = parseFloat(value);
      setCurrentItemData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? undefined : numValue
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

      {/* Item Form Dialog - Lazy Loaded */}
      <OrderItemDialog
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        isEditing={isEditingItemDialog}
        currentItem={currentItemData}
        commodities={commodities}
        units={units}
        error={localDialogError}
        handleChange={handleItemDialogChange}
        handleSelectChange={handleItemSelectChange}
        handleSave={handleSaveItem}
        handleClose={closeItemDialog}
        commoditySearch={localCommoditySearch}
        unitSearch={localUnitSearch}
        handleCommoditySearch={handleLocalCommoditySearch}
        handleUnitSearch={handleLocalUnitSearch}
        hasMoreCommodities={hasMoreCommodities}
        isLoadingMoreCommodities={isLoadingMoreCommodities}
        loadMoreCommodities={loadMoreCommodities}
        isLoadingCommodities={isLoadingCommodities}
        isLoadingUnits={isLoadingUnits}
      />
    </>
  )
}

export default OrderItemsSection