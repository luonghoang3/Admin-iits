'use client';

import { useParams } from 'next/navigation';
import OrderForm from '@/components/orders/OrderForm'

export default function EditOrderPage() {
  const params = useParams();
  const orderId = params.id as string;
  
  return <OrderForm mode="edit" orderId={orderId} backUrl="/dashboard/orders" />
}