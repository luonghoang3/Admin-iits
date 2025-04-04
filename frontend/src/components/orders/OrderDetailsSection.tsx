import React from 'react'
import { CalendarIcon, BuildingOffice2Icon as Building2Icon } from "@heroicons/react/24/outline"
import { format } from "date-fns"

// ShadCN components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Types
import { OrderFormData } from '@/types/orders.d'

interface OrderDetailsSectionProps {
  formData: OrderFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleValueChange: (name: string, value: any) => void;
  previewOrderNumber?: string;
  isEditMode?: boolean;
}

const OrderDetailsSection: React.FC<OrderDetailsSectionProps> = ({
  formData,
  handleChange,
  handleValueChange,
  previewOrderNumber,
  isEditMode = false
}) => {
  // Ensure values are never undefined
  const type = formData.type || 'international';
  const department = formData.department || 'marine';
  const order_date = formData.order_date || '';
  const status = formData.status || 'draft';
  const client_ref_code = formData.client_ref_code || '';
  const inspection_date_started = formData.inspection_date_started || '';
  const inspection_date_completed = formData.inspection_date_completed || '';

  // Map type and department values to display text
  const typeDisplay = {
    'international': 'International',
    'local': 'Local'
  };

  const departmentDisplay = {
    'marine': 'Marine',
    'agriculture': 'Agriculture',
    'consumer goods': 'Consumer Goods'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2Icon className="h-5 w-5 mr-2 text-gray-500" />
          Order Details
          {previewOrderNumber && (
            <span className="ml-auto text-sm text-gray-500">
              Order number: <span className="font-semibold">{previewOrderNumber}</span>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="type">Order Type</Label>
            {isEditMode ? (
              <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground">
                {typeDisplay[type as keyof typeof typeDisplay]}
              </div>
            ) : (
              <Select
                value={type}
                onValueChange={(value) => handleValueChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="international">International</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            {isEditMode ? (
              <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground">
                {departmentDisplay[department as keyof typeof departmentDisplay]}
              </div>
            ) : (
              <Select
                value={department}
                onValueChange={(value) => handleValueChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marine">Marine</SelectItem>
                  <SelectItem value="agriculture">Agriculture</SelectItem>
                  <SelectItem value="consumer goods">Consumer Goods</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="order_date">Order Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !order_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {order_date ? format(new Date(order_date), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={order_date ? new Date(order_date) : undefined}
                  onSelect={(date) => date && handleValueChange('order_date', format(date, 'yyyy-MM-dd'))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => handleValueChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 col-span-2">
            <Label htmlFor="client_ref_code">Client Reference</Label>
            <Input
              id="client_ref_code"
              name="client_ref_code"
              value={client_ref_code}
              onChange={handleChange}
              placeholder="Client reference code"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="inspection_date_started">Inspection Start</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !inspection_date_started && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {inspection_date_started ? format(new Date(inspection_date_started), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={inspection_date_started ? new Date(inspection_date_started) : undefined}
                  onSelect={(date) => date && handleValueChange('inspection_date_started', format(date, 'yyyy-MM-dd'))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="inspection_date_completed">Inspection Completion</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !inspection_date_completed && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {inspection_date_completed ? format(new Date(inspection_date_completed), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={inspection_date_completed ? new Date(inspection_date_completed) : undefined}
                  onSelect={(date) => date && handleValueChange('inspection_date_completed', format(date, 'yyyy-MM-dd'))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OrderDetailsSection 