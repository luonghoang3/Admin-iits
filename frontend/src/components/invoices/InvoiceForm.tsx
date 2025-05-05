import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeftIcon, SaveIcon } from "lucide-react"
import { useInvoiceForm } from '@/hooks/invoices/useInvoiceForm'
import { createClient } from '@/utils/supabase/client'
import { useToast } from "@/components/ui/use-toast"

// Component sections
import InvoiceDetailsSection from './InvoiceDetailsSection'
import ClientInformationSection from './ClientInformationSection'
import FinancialDetailsSection from './FinancialDetailsSection'
import InvoiceDetailsItemsSection from './InvoiceDetailsItemsSection'

interface InvoiceFormProps {
  invoiceId?: string
  mode: 'add' | 'edit'
  backUrl?: string
  orderId?: string // Thêm tham số orderId
}

export default function InvoiceForm({ invoiceId, mode = 'add', backUrl = '/dashboard/invoices', orderId }: InvoiceFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [localLoading, setLocalLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderDetails, setOrderDetails] = useState<{
    order_number?: string;
    order_date?: string;
  }>({});

  // Convert component mode to hook mode
  const hookMode = mode === 'add' ? 'create' : 'edit'

  // Use the invoice form hook
  const {
    formData,
    loading,
    isSaving,
    error: formError,
    handleFormChange,
    setFieldValue,
    saveInvoice
  } = useInvoiceForm({
    mode: hookMode,
    invoiceId,
    orderId, // Truyền tham số orderId vào hook
    onSuccess: ({ id }) => {
      if (mode === 'add') {
        // Redirect is handled inside the hook
      }
    },
    onError: (error) => {
      setError(error.message)
    }
  })

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validate required fields
      if (!formData.client_id) {
        setError('Vui lòng chọn khách hàng')
        setSaving(false)
        return
      }

      if (!formData.invoice_date) {
        setError('Vui lòng chọn ngày hóa đơn')
        setSaving(false)
        return
      }

      // Save the invoice
      await saveInvoice()

      // Show success toast
      toast({
        title: mode === 'add' ? "Đã tạo hóa đơn" : "Đã cập nhật hóa đơn",
        description: `Hóa đơn ${formData.invoice_number} đã được ${mode === 'add' ? 'tạo' : 'cập nhật'} thành công.`,
        variant: "default",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu hóa đơn')
    } finally {
      setSaving(false)
    }
  }

  // Debug - chỉ log một lần khi component mount
  const hasLogged = useRef(false);

  useEffect(() => {
    if (!hasLogged.current) {
      console.log('InvoiceForm mounted with state:', {
        mode,
        orderId,
        loading,
        isSaving,
        formData: formData ? 'Has formData' : 'No formData',
        error,
        formError
      });
      hasLogged.current = true;
    }
  }, []);

  // Lấy thông tin đơn hàng khi có order_id
  const hasFetched = useRef(false);

  useEffect(() => {
    // Reset flag khi formData.order_id thay đổi
    if (formData?.order_id !== hasFetched.current) {
      hasFetched.current = false;
    }

    if (formData?.order_id && !hasFetched.current) {
      console.log('Fetching order details for order_id:', formData.order_id);

      const fetchOrderDetails = async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('orders')
            .select('order_number, order_date')
            .eq('id', formData.order_id)
            .single();

          if (error) throw error;
          if (data) {
            console.log('Found order details:', data);
            setOrderDetails({
              order_number: data.order_number,
              order_date: data.order_date
            });
            hasFetched.current = formData.order_id; // Lưu order_id đã fetch
          }
        } catch (error) {
          console.error('Error fetching order details:', error);
        }
      };

      fetchOrderDetails();
    }
  }, [formData?.order_id]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href={backUrl} className="mr-4">
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold">
            {mode === 'add' ? (
              orderId ? 'Tạo hóa đơn từ đơn hàng' : 'Tạo hóa đơn mới'
            ) : (
              'Chỉnh sửa hóa đơn'
            )}
          </h1>
        </div>
        <div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(backUrl)}
              disabled={isSaving || saving || loading}
            >
              Hủy
            </Button>
            <Button
              variant="default"
              className="flex items-center"
              onClick={handleSubmit}
              disabled={isSaving || saving || loading}
            >
              {isSaving || saving ? (
                <>Đang lưu...</>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {mode === 'add' ? 'Lưu hóa đơn' : 'Cập nhật hóa đơn'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {(error || formError) && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error || formError}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[400px] animate-pulse bg-muted rounded-md"></div>
          <div className="h-[400px] animate-pulse bg-muted rounded-md"></div>
        </div>
      ) : formData ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <InvoiceDetailsSection
                formData={formData}
                handleChange={handleFormChange}
                handleValueChange={setFieldValue}
                isEditMode={mode === 'edit'}
                orderDetails={orderDetails}
              />
            </div>
            <div>
              <ClientInformationSection
                formData={formData}
                handleValueChange={setFieldValue}
              />
            </div>
          </div>

          {/* Chi tiết hóa đơn và Thuế */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
              <InvoiceDetailsItemsSection
                formData={formData}
                handleValueChange={setFieldValue}
              />
            </div>
            <div className="md:col-span-1">
              <FinancialDetailsSection
                formData={formData}
                handleChange={handleFormChange}
                handleValueChange={setFieldValue}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[400px]">
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      )}
    </div>
  )
}
