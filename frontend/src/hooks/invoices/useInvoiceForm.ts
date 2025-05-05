import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { InvoiceFormData, Invoice } from '@/types/invoices';
import { fetchInvoiceById, createInvoice, updateInvoice } from '@/services/invoiceService';
import { fetchOrderById } from '@/services/orderService';
import { useRouter } from 'next/navigation';
import logger from '@/lib/logger';

interface UseInvoiceFormProps {
  mode: 'create' | 'edit';
  invoiceId?: string;
  orderId?: string; // Thêm tham số orderId
  onSuccess?: (data: Invoice) => void;
  onError?: (error: Error) => void;
}

export function useInvoiceForm({
  mode,
  invoiceId,
  orderId,
  onSuccess,
  onError
}: UseInvoiceFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    client_id: '',
    status: 'draft'
  });

  const [loading, setLoading] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load invoice data if in edit mode
  useEffect(() => {
    // Thêm biến để theo dõi xem useEffect đã chạy chưa
    let isInitialLoad = true;

    if (mode === 'edit' && invoiceId) {
      const loadInvoice = async () => {
        // Chỉ tải dữ liệu nếu đây là lần đầu tiên
        if (!isInitialLoad) return;
        isInitialLoad = false;

        try {
          setLoading(true);
          logger.log(`Loading invoice data for edit mode, invoiceId: ${invoiceId}`);

          const invoiceData = await fetchInvoiceById(invoiceId);
          logger.log(`Invoice data loaded for edit:`, invoiceData);

          // Log thông tin đơn hàng để debug
          logger.log(`Invoice order_id: ${invoiceData.order_id}`);

          const formDataToSet = {
            id: invoiceData.id,
            invoice_number: invoiceData.invoice_number,
            invoice_date: invoiceData.invoice_date,
            client_id: invoiceData.client_id,
            financial_invoice_number: invoiceData.financial_invoice_number,
            financial_invoice_date: invoiceData.financial_invoice_date,
            reference: invoiceData.reference,
            vat_percentage: invoiceData.vat_percentage,
            vat_amount: invoiceData.vat_amount,
            exchange_rate: invoiceData.exchange_rate,
            notes: invoiceData.notes,
            order_id: invoiceData.order_id,
            contact_id: invoiceData.contact_id,
            status: invoiceData.status,
            invoice_details: invoiceData.invoice_details || []
          };

          logger.log(`Setting form data in edit mode:`, formDataToSet);
          setFormData(formDataToSet);
        } catch (err) {
          logger.error(`Error loading invoice data for edit:`, err);
          const error = err instanceof Error ? err : new Error('Failed to load invoice');
          setError(error.message);
          if (onError) onError(error);
        } finally {
          setLoading(false);
        }
      };

      loadInvoice();
    }

    // Cleanup function để đảm bảo useEffect không chạy lại
    return () => {
      isInitialLoad = false;
    };
  }, [mode, invoiceId]); // Loại bỏ onError để tránh vòng lặp

  // Load order data if orderId is provided (for creating invoice from order)
  useEffect(() => {
    // Thêm biến để theo dõi xem useEffect đã chạy chưa
    let isInitialLoad = true;

    if (mode === 'create' && orderId) {
      const loadOrderData = async () => {
        // Chỉ tải dữ liệu nếu đây là lần đầu tiên
        if (!isInitialLoad) return;
        isInitialLoad = false;

        try {
          setLoading(true);
          console.log('Loading order data for orderId:', orderId);

          const orderData = await fetchOrderById(orderId);

          console.log('Order data loaded:', orderData);

          if (!orderData) {
            throw new Error('Không tìm thấy đơn hàng');
          }

          // Tạo số hóa đơn tự động theo định dạng [Team][Năm]-[Tháng]/[Số thứ tự]
          const today = new Date();
          const year = today.getFullYear().toString().substring(2); // Lấy 2 chữ số cuối của năm

          // Chuyển đổi tháng sang định dạng ba chữ cái
          const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
          const month = monthNames[today.getMonth()];

          // Lấy team code từ order_number
          // Ví dụ: IMR25-001 -> MR
          const teamCode = orderData.order_number.substring(1, 3);

          // Tạo số thứ tự, bắt đầu từ 01 và tăng dần
          // Truy vấn cơ sở dữ liệu để lấy số thứ tự tiếp theo
          const supabase = createClient();
          const { data: maxInvoice, error: seqError } = await supabase
            .from('invoices')
            .select('invoice_number')
            .ilike('invoice_number', `${teamCode}${year}-${month}/%`)
            .order('invoice_number', { ascending: false })
            .limit(1);

          let sequenceNumber = '01';

          if (!seqError && maxInvoice && maxInvoice.length > 0) {
            try {
              // Extract sequence number from invoice_number (e.g., AF25-MAR/07 -> 07)
              const parts = maxInvoice[0].invoice_number.split('/');
              if (parts.length > 1) {
                const lastSeq = parseInt(parts[1]);
                if (!isNaN(lastSeq)) {
                  sequenceNumber = String(lastSeq + 1).padStart(2, '0');
                }
              }
            } catch (e) {
              // If parsing fails, use default 01
              sequenceNumber = '01';
            }
          }

          // Tạo số hóa đơn theo định dạng mới
          const invoiceNumber = `${teamCode}${year}-${month}/${sequenceNumber}`;

          // Điền thông tin từ đơn hàng vào form hóa đơn
          const newFormData = {
            invoice_number: invoiceNumber,
            invoice_date: today.toISOString().split('T')[0],
            client_id: orderData.client_id,
            contact_id: orderData.contact_id || null,
            order_id: orderId,
            reference: orderData.client_ref_code || null,
            notes: `Hóa đơn cho đơn hàng ${orderData.order_number}`,
            status: 'draft',
            vat_percentage: 10, // Mặc định 10%
            invoice_details: [] // Khởi tạo mảng rỗng cho chi tiết hóa đơn
          };

          console.log('Setting form data:', newFormData);
          setFormData(newFormData);
        } catch (err) {
          console.error('Error loading order data:', err);
          const error = err instanceof Error ? err : new Error('Không thể tải dữ liệu đơn hàng');
          setError(error.message);
          if (onError) onError(error);
        } finally {
          setLoading(false);
        }
      };

      loadOrderData();
    }

    // Cleanup function để đảm bảo useEffect không chạy lại
    return () => {
      isInitialLoad = false;
    };
  }, [mode, orderId]); // Loại bỏ onError để tránh vòng lặp

  // Handle form field changes
  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Set a specific field value
  const setFieldValue = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Save the invoice
  const saveInvoice = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);

      let result;
      if (mode === 'create') {
        result = await createInvoice(formData);
        if (onSuccess) onSuccess(result);
        router.push(`/dashboard/invoices/${result.id}`);
      } else {
        if (!invoiceId) throw new Error('Invoice ID is required for updates');
        result = await updateInvoice(invoiceId, formData);
        if (onSuccess) onSuccess(result);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save invoice');
      setError(error.message);
      if (onError) onError(error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [formData, mode, invoiceId, onSuccess, onError, router]);

  return {
    formData,
    loading,
    isSaving,
    error,
    handleFormChange,
    setFieldValue,
    saveInvoice
  };
}
