import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { InvoiceFormData } from '@/types/invoices'

interface FinancialDetailsSectionProps {
  formData: InvoiceFormData
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleValueChange: (field: string, value: any) => void
}

export default function FinancialDetailsSection({
  formData,
  handleChange,
  handleValueChange
}: FinancialDetailsSectionProps) {
  // Format currency based on the currency type
  const formatCurrency = (amount: number, currency: 'VND' | 'USD' = 'VND'): string => {
    if (amount === 0) return '';

    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } else {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }
  };
  const [subtotalVND, setSubtotalVND] = useState<number>(0);
  const [subtotalUSD, setSubtotalUSD] = useState<number>(0);
  const [totalVND, setTotalVND] = useState<number>(0);
  const [totalUSD, setTotalUSD] = useState<number>(0);
  const [primaryCurrency, setPrimaryCurrency] = useState<'VND' | 'USD'>('VND');

  // Calculate subtotal from invoice details
  useEffect(() => {
    if (formData.invoice_details && formData.invoice_details.length > 0) {
      // Calculate subtotals separately for VND and USD
      let calculatedSubtotalVND = 0;
      let calculatedSubtotalUSD = 0;
      let hasVND = false;
      let hasUSD = false;

      formData.invoice_details.forEach(detail => {
        if (detail.currency === 'VND') {
          calculatedSubtotalVND += detail.amount;
          hasVND = true;
        } else if (detail.currency === 'USD') {
          calculatedSubtotalUSD += detail.amount;
          hasUSD = true;
        }
      });

      // Set the primary currency based on which one is used
      if (hasUSD && !hasVND) {
        setPrimaryCurrency('USD');
      } else {
        setPrimaryCurrency('VND');
      }

      setSubtotalVND(calculatedSubtotalVND);
      setSubtotalUSD(calculatedSubtotalUSD);

      // Calculate VAT and total for each currency
      const vatAmountVND = formData.vat_percentage ? (calculatedSubtotalVND * formData.vat_percentage / 100) : 0;
      const totalWithVatVND = calculatedSubtotalVND + vatAmountVND;

      const vatAmountUSD = formData.vat_percentage ? (calculatedSubtotalUSD * formData.vat_percentage / 100) : 0;
      const totalWithVatUSD = calculatedSubtotalUSD + vatAmountUSD;

      setTotalVND(totalWithVatVND);
      setTotalUSD(totalWithVatUSD);

      // Update VAT amount and total_amount_with_vat in form data based on primary currency
      if (primaryCurrency === 'USD') {
        // Round to 2 decimal places for USD
        const roundedVatUSD = Math.round(vatAmountUSD * 100) / 100;
        const roundedTotalUSD = Math.round(totalWithVatUSD * 100) / 100;
        handleValueChange('vat_amount', roundedVatUSD);
        handleValueChange('total_amount_with_vat', roundedTotalUSD);
      } else {
        // Round to 0 decimal places for VND
        const roundedVatVND = Math.round(vatAmountVND);
        const roundedTotalVND = Math.round(totalWithVatVND);
        handleValueChange('vat_amount', roundedVatVND);
        handleValueChange('total_amount_with_vat', roundedTotalVND);
      }
    } else {
      setSubtotalVND(0);
      setSubtotalUSD(0);
      setTotalVND(0);
      setTotalUSD(0);
      setPrimaryCurrency('VND');

      // Update total_amount_with_vat to 0 when there are no invoice details
      handleValueChange('vat_amount', 0);
      handleValueChange('total_amount_with_vat', 0);
    }
  }, [formData.invoice_details, formData.vat_percentage, handleValueChange]);

  // Handle numeric input changes with validation
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value;

    // Allow empty value
    if (value === '') {
      handleValueChange(field, null);
      return;
    }

    // Validate numeric input
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      handleValueChange(field, numericValue);

      // If changing VAT percentage, calculate and update VAT amount and total_amount_with_vat
      if (field === 'vat_percentage') {
        if (primaryCurrency === 'USD') {
          const vatAmount = subtotalUSD * numericValue / 100;
          const totalWithVat = subtotalUSD + vatAmount;
          // Round to 2 decimal places for USD
          const roundedVatUSD = Math.round(vatAmount * 100) / 100;
          const roundedTotalUSD = Math.round(totalWithVat * 100) / 100;
          handleValueChange('vat_amount', roundedVatUSD);
          handleValueChange('total_amount_with_vat', roundedTotalUSD);
        } else {
          const vatAmount = subtotalVND * numericValue / 100;
          const totalWithVat = subtotalVND + vatAmount;
          // Round to 0 decimal places for VND
          const roundedVatVND = Math.round(vatAmount);
          const roundedTotalVND = Math.round(totalWithVat);
          handleValueChange('vat_amount', roundedVatVND);
          handleValueChange('total_amount_with_vat', roundedTotalVND);
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thuế</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vat_percentage">VAT (%)</Label>
          <Input
            id="vat_percentage"
            name="vat_percentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.vat_percentage === null || formData.vat_percentage === undefined ? '' : formData.vat_percentage}
            onChange={(e) => handleNumericChange(e, 'vat_percentage')}
            placeholder="Nhập % VAT"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vat_amount">Số tiền VAT</Label>
          <div className="flex items-center gap-2">
            <Input
              id="vat_amount"
              name="vat_amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.vat_amount === null || formData.vat_amount === undefined ? '' :
                    (primaryCurrency === 'USD'
                      ? (Math.round(formData.vat_amount * 100) / 100)
                      : Math.round(formData.vat_amount))}
              onChange={(e) => handleNumericChange(e, 'vat_amount')}
              placeholder="Tự động tính"
              readOnly
              className="bg-muted"
            />
            <span className="text-sm font-medium">{primaryCurrency}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exchange_rate">Tỷ giá (tham khảo)</Label>
          <Input
            id="exchange_rate"
            name="exchange_rate"
            type="number"
            step="0.000001"
            min="0"
            value={formData.exchange_rate === null || formData.exchange_rate === undefined ? '' : formData.exchange_rate}
            onChange={(e) => handleNumericChange(e, 'exchange_rate')}
            placeholder="Nhập tỷ giá tham khảo"
          />
          <p className="text-xs text-muted-foreground">
            Tỷ giá này chỉ mang tính tham khảo, không ảnh hưởng đến tính toán
          </p>
        </div>

        <div className="pt-4 border-t">
          {subtotalVND > 0 && (
            <>
              <div className="flex justify-between items-center">
                <Label>Tổng tiền (VND):</Label>
                <div className="font-medium">{formatCurrency(subtotalVND, 'VND')}</div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <Label>VAT ({formData.vat_percentage || 0}%):</Label>
                <div className="font-medium">
                  {formData.vat_percentage && formData.vat_percentage > 0
                    ? formatCurrency(Math.round(subtotalVND * formData.vat_percentage / 100), 'VND')
                    : ''}
                </div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <Label className="font-bold">Tổng cộng (VND):</Label>
                <div className="font-bold text-lg">{formatCurrency(totalVND, 'VND')}</div>
              </div>
            </>
          )}

          {subtotalUSD > 0 && (
            <>
              {subtotalVND > 0 && <div className="my-2 border-t pt-2"></div>}

              <div className="flex justify-between items-center">
                <Label>Tổng tiền (USD):</Label>
                <div className="font-medium">{formatCurrency(subtotalUSD, 'USD')}</div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <Label>VAT ({formData.vat_percentage || 0}%):</Label>
                <div className="font-medium">
                  {formData.vat_percentage && formData.vat_percentage > 0
                    ? formatCurrency(Math.round(subtotalUSD * formData.vat_percentage / 100 * 100) / 100, 'USD')
                    : ''}
                </div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <Label className="font-bold">Tổng cộng (USD):</Label>
                <div className="font-bold text-lg">{formatCurrency(totalUSD, 'USD')}</div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
