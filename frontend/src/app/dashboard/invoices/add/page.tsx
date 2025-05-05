"use client"

import React, { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import InvoiceForm from '@/components/invoices/InvoiceForm'

export default function AddInvoicePage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  // Debug - chỉ log một lần khi component mount
  useEffect(() => {
    console.log('AddInvoicePage mounted - orderId from URL:', orderId);
  }, []);

  return <InvoiceForm
    mode="add"
    backUrl="/dashboard/invoices"
    orderId={orderId || undefined}
  />
}
