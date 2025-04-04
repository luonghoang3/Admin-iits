"use client"

import React from 'react'
import OrderForm from '@/components/orders/OrderForm'

export default function AddOrderPage() {
  return <OrderForm mode="add" backUrl="/dashboard/orders" />
}
