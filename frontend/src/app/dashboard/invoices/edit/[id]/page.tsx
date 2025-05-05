'use client';

import { useParams } from 'next/navigation';
import InvoiceForm from '@/components/invoices/InvoiceForm'

export default function EditInvoicePage() {
  const params = useParams();
  const invoiceId = params.id as string;
  
  return <InvoiceForm mode="edit" invoiceId={invoiceId} backUrl="/dashboard/invoices" />
}
