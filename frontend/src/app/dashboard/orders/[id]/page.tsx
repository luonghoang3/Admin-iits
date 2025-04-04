"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchOrder, fetchOrderItems } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from 'date-fns'

import { 
  ArrowLeftIcon, 
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ArchiveBoxIcon as PackageIcon
} from "@heroicons/react/24/outline"

import { Order, OrderItem } from '@/types/orders.d'

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter()
  
  // Truy cập params trực tiếp thay vì sử dụng React.use()
  const orderId = params.id
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  
  // Fetch order data
  useEffect(() => {
    async function loadOrderData() {
      try {
        setLoading(true)
        
        // Fetch order details
        const { order, error: orderError } = await fetchOrder(orderId)
        
        if (orderError) {
          throw new Error(`Failed to load order: ${orderError}`)
        }
        
        if (order) {
          setOrder(order)
          
          // Load order items
          const { orderItems, error: itemsError } = await fetchOrderItems(orderId)
          
          if (itemsError) {
            console.error('Error loading order items:', itemsError)
          } else {
            setOrderItems(orderItems || [])
          }
        } else {
          throw new Error('Order not found')
        }
      } catch (err: any) {
        console.error('Error loading order:', err)
        setError(err.message || 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }
    
    if (orderId) {
      loadOrderData()
    }
  }, [orderId])
  
  // Helper function to render status badge
  const getStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    
    switch(status) {
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Draft</Badge>
      case 'confirmed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }
  
  // Handle delete order
  const handleDeleteOrder = async () => {
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        // Implement delete functionality
        router.push('/dashboard/orders')
      } catch (err: any) {
        console.error('Error deleting order:', err)
        setError(err.message || 'Failed to delete order')
      }
    }
  }
  
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading order information...</p>
        </div>
      </div>
    )
  }
  
  if (error || !order) {
    return (
      <div className="p-6 space-y-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Order not found'}</AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/dashboard/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild className="h-8 w-8">
            <Link href="/dashboard/orders">
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PackageIcon className="h-6 w-6" />
            Order {order.order_number}
          </h1>
          <div className="flex items-center ml-2 space-x-2">
            {getStatusBadge(order.status || 'draft')}
            
            <Badge variant="outline" className="bg-slate-100">
              {order.type === 'international' ? 'International' : 'Local'}
            </Badge>
            
            <Badge variant="outline" className="bg-slate-100">
              {order.department === 'marine' ? 'Marine' : 
               order.department === 'agriculture' ? 'Agriculture' : 'Consumer Goods'}
            </Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/orders/edit/${orderId}`} className="flex items-center gap-1">
              <PencilIcon className="h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <DocumentDuplicateIcon className="h-4 w-4" />
            Duplicate
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 text-red-600 hover:text-red-700"
            onClick={handleDeleteOrder}
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      {/* Order Details Section */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Client Information (50%) */}
        <Card className="md:w-[50%]">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{order.clients?.name || '-'}</p>
            </div>
            {order.clients && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.clients.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.clients.phone || '-'}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <p className="font-medium">{order.selected_contact?.full_name || '-'}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Shipping Information (20%) */}
        <Card className="md:w-[20%]">
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Shipper</p>
              <p className="font-medium">{order.shipper?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Buyer</p>
              <p className="font-medium">{order.buyer?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vessel/Carrier</p>
              <p className="font-medium">{order.vessel_carrier || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bill of Lading</p>
              <p className="font-medium">{order.bill_of_lading || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bill of Lading Date</p>
              <p className="font-medium">
                {order.bill_of_lading_date ? format(new Date(order.bill_of_lading_date), 'MMM d, yyyy') : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Order Information (30%) - right side */}
        <Card className="md:w-[30%]">
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-medium">{order.order_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-medium">
                  {order.order_date ? format(new Date(order.order_date), 'MMM d, yyyy') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{order.type || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium capitalize">
                  {order.department === 'marine' ? 'Marine' : 
                   order.department === 'agriculture' ? 'Agriculture' : 'Consumer Goods'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{order.status || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client Ref Code</p>
                <p className="font-medium">{order.client_ref_code || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Order Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          {orderItems.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No items added to this order.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.commodities?.name || 'Unknown'}</TableCell>
                    <TableCell>{item.commodity_description || '-'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.units?.name || 'Unknown'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Notes */}
      {order.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 