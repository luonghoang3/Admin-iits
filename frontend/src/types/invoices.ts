import { Client, Contact } from './clients';
import { Order } from './orders';
import { Unit } from './units';

import { PricingType } from './pricing-types';

export interface InvoiceDetailFormData {
  id?: string;
  invoice_id: string;
  description: string;
  quantity: number | null;
  unit_id?: string | null;
  is_fixed_price: boolean;
  pricing_type_id?: string | null;
  fixed_price?: number | null;
  unit_price?: number | null;
  currency: 'VND' | 'USD';
  amount: number | null;
  sequence?: number;
  notes?: string | null;

  // Nested objects
  pricing_types?: PricingType;
  units?: any;
}

export interface InvoiceDetail extends InvoiceDetailFormData {
  id: string;
  created_at: string;
  updated_at: string;

  // Nested objects
  units?: Unit;
}

export interface InvoiceFormData {
  id?: string;
  invoice_number: string;
  invoice_date: string;
  client_id: string;
  financial_invoice_number?: string | null;
  financial_invoice_date?: string | null;
  reference?: string | null;
  vat_percentage?: number | null;
  vat_amount?: number | null;
  exchange_rate?: number | null;
  total_amount_with_vat?: number | null;
  notes?: string | null;
  order_id?: string | null;
  contact_id?: string | null;
  status?: 'draft' | 'issued' | 'paid' | 'cancelled';
  invoice_details?: InvoiceDetailFormData[];
}

export interface Invoice extends InvoiceFormData {
  id: string;
  created_at: string;
  updated_at: string;

  // Nested objects
  clients?: Client;
  orders?: Order;
  contacts?: Contact;
  invoice_details?: InvoiceDetail[];
}
