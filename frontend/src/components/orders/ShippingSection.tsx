import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OrderFormData } from '@/types/orders'
import ShipperBuyerSection from './ShipperBuyerSection'

interface ShippingSectionProps {
  formData: OrderFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleValueChange: (name: string, value: any) => void;
  isLoading?: boolean;
}

// Updated component to use ShipperBuyerSection instead of placeholder
const ShippingSection: React.FC<ShippingSectionProps> = ({
  formData,
  handleChange,
  handleValueChange,
  isLoading = false
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ShipperBuyerSection */}
        <ShipperBuyerSection
          shipperId={formData.shipper_id || ''}
          buyerId={formData.buyer_id || ''}
          onChange={(field, value) => handleValueChange(field === 'shipper' ? 'shipper_id' : 'buyer_id', value)}
          disabled={isLoading}
        />

        {/* Additional shipping fields - change to 3 columns on medium screens */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="vessel_carrier">Vessel/Carrier</Label>
            <Input
              id="vessel_carrier"
              name="vessel_carrier"
              value={formData.vessel_carrier || ''}
              onChange={handleChange}
              placeholder="Enter vessel or carrier name"
              disabled={isLoading}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill_of_lading">Bill of Lading</Label>
            <Input
              id="bill_of_lading"
              name="bill_of_lading"
              value={formData.bill_of_lading || ''}
              onChange={handleChange}
              placeholder="Enter bill of lading number"
              disabled={isLoading}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill_of_lading_date">Bill of Lading Date</Label>
            <Input
              id="bill_of_lading_date"
              name="bill_of_lading_date"
              type="date"
              value={formData.bill_of_lading_date || ''}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ShippingSection