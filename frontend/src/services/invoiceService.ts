import { createClient } from '@/utils/supabase/client';
import { InvoiceFormData, InvoiceDetailFormData } from '@/types/invoices';
import logger from '@/lib/logger';

// Fetch invoice by ID
export async function fetchInvoiceById(id: string) {
  const supabase = createClient();
  try {
    logger.log(`Fetching invoice with ID: ${id}`);

    // Fetch invoice data
    const { data, error } = await supabase.from('invoices').select(`
      *,
      clients!client_id (id, name, address, tax_id),
      orders!order_id (id, order_number),
      contacts!contact_id (id, full_name, position, email, phone)
    `).eq('id', id).single();

    if (error) throw error;
    if (!data) throw new Error(`Invoice with ID ${id} not found`);

    // Fetch invoice details
    const { data: detailsData, error: detailsError } = await supabase
      .from('invoice_details')
      .select(`
        *,
        units (id, name),
        pricing_types (id, code, name)
      `)
      .eq('invoice_id', id)
      .order('sequence', { ascending: true });

    if (detailsError) throw detailsError;

    // Combine data
    const result = {
      ...data,
      invoice_details: detailsData || []
    };

    logger.log(`Successfully fetched invoice: ${JSON.stringify(result, null, 2)}`);
    return result;
  } catch (error) {
    logger.error('Error in fetchInvoiceById:', error, 'id:', id);
    throw error;
  }
}

// Create a new invoice
export async function createInvoice(invoiceData: InvoiceFormData) {
  const supabase = createClient();
  try {
    // Extract invoice details from the form data
    const { invoice_details, ...invoiceOnly } = invoiceData;

    // Ensure invoice_number is generated if not present
    let dataToSave = { ...invoiceOnly };
    if (!dataToSave.invoice_number) {
      // Generate invoice number logic here
      // Format: [Team][Năm]-[Tháng]/[Số thứ tự]
      // Example: AF25-MAR/07
      const today = new Date();
      const year = today.getFullYear().toString().substring(2); // Lấy 2 chữ số cuối của năm

      // Chuyển đổi tháng sang định dạng ba chữ cái
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = monthNames[today.getMonth()];

      // Lấy team code từ order_id nếu có
      let teamCode = 'XX'; // Mặc định nếu không có order_id

      if (dataToSave.order_id) {
        // Fetch order to get team information
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('order_number, team_id, teams!team_id (name)')
          .eq('id', dataToSave.order_id)
          .single();

        if (!orderError && orderData) {
          // Extract team code from order_number or team name
          if (orderData.order_number && orderData.order_number.length >= 3) {
            // Extract from order_number (e.g., IMR25-001 -> MR)
            teamCode = orderData.order_number.substring(1, 3);
          } else if (orderData.teams) {
            // Map team name to team code
            // @ts-ignore - Supabase returns teams as an object, not an array
            const teamName = orderData.teams.name;
            teamCode = teamName === 'Marine' ? 'MR' :
                      teamName === 'Agri' ? 'AF' :
                      teamName === 'CG' ? 'CG' : 'XX';
          }
        }
      }

      // Get next sequence number from database for this team, month and year
      const { data: maxInvoice, error: seqError } = await supabase
        .from('invoices')
        .select('invoice_number')
        .ilike('invoice_number', `${teamCode}${year}-${month}/%`)
        .order('invoice_number', { ascending: false })
        .limit(1);

      if (seqError) throw seqError;

      let sequence = 1;
      if (maxInvoice && maxInvoice.length > 0) {
        try {
          // Extract sequence number from invoice_number (e.g., AF25-MAR/07 -> 07)
          const parts = maxInvoice[0].invoice_number.split('/');
          if (parts.length > 1) {
            const lastSeq = parseInt(parts[1]);
            if (!isNaN(lastSeq)) {
              sequence = lastSeq + 1;
            }
          }
        } catch (e) {
          // If parsing fails, start from 1
          sequence = 1;
        }
      }

      dataToSave.invoice_number = `${teamCode}${year}-${month}/${String(sequence).padStart(2, '0')}`;
    }

    // Insert invoice
    const { data, error } = await supabase.from('invoices').insert([dataToSave]).select().single();
    if (error) throw error;
    if (!data) throw new Error('No data returned from API');

    // Insert invoice details if any
    if (invoice_details && invoice_details.length > 0) {
      const detailsToInsert = invoice_details.map((detail, index) => {
        // Remove pricing_types and units objects as they're not columns in the database
        const { pricing_types, units, ...detailWithoutNestedObjects } = detail;

        return {
          ...detailWithoutNestedObjects,
          invoice_id: data.id,
          sequence: index + 1
        };
      });

      const { error: detailsError } = await supabase
        .from('invoice_details')
        .insert(detailsToInsert);

      if (detailsError) throw detailsError;

      // Fetch the inserted details
      const { data: insertedDetails, error: fetchError } = await supabase
        .from('invoice_details')
        .select('*')
        .eq('invoice_id', data.id)
        .order('sequence', { ascending: true });

      if (fetchError) throw fetchError;

      // Return combined data
      return {
        ...data,
        invoice_details: insertedDetails || []
      };
    }

    return data;
  } catch (error) {
    logger.error('Error in createInvoice:', error, 'invoiceData:', invoiceData);
    throw error;
  }
}

// Update an invoice
export async function updateInvoice(id: string, invoiceData: Partial<InvoiceFormData>) {
  const supabase = createClient();
  try {
    // Extract invoice details from the form data
    const { invoice_details, ...invoiceOnly } = invoiceData;

    // Update invoice
    const { data, error } = await supabase.from('invoices').update(invoiceOnly).eq('id', id).select().single();
    if (error) throw error;
    if (!data) throw new Error('No data returned from API');

    // Handle invoice details if provided
    if (invoice_details) {
      // Get existing details to compare
      const { data: existingDetails, error: fetchError } = await supabase
        .from('invoice_details')
        .select('id')
        .eq('invoice_id', id);

      if (fetchError) throw fetchError;

      const existingIds = new Set((existingDetails || []).map(d => d.id));
      const newDetailsIds = new Set(invoice_details.filter(d => d.id).map(d => d.id));

      // Find details to delete (exist in DB but not in the new data)
      const idsToDelete = [...existingIds].filter(id => !newDetailsIds.has(id));

      // Delete removed details
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('invoice_details')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) throw deleteError;
      }

      // Update or insert details
      for (let i = 0; i < invoice_details.length; i++) {
        const detail = invoice_details[i];
        detail.sequence = i + 1; // Update sequence

        // Remove pricing_types and units objects as they're not columns in the database
        const { pricing_types, units, ...detailWithoutNestedObjects } = detail;

        if (detail.id) {
          // Update existing detail
          const { error: updateError } = await supabase
            .from('invoice_details')
            .update({
              ...detailWithoutNestedObjects,
              invoice_id: id // Ensure correct invoice_id
            })
            .eq('id', detail.id);

          if (updateError) throw updateError;
        } else {
          // Insert new detail
          const { error: insertError } = await supabase
            .from('invoice_details')
            .insert({
              ...detailWithoutNestedObjects,
              invoice_id: id
            });

          if (insertError) throw insertError;
        }
      }

      // Fetch updated details
      const { data: updatedDetails, error: detailsError } = await supabase
        .from('invoice_details')
        .select(`
          *,
          units (id, name),
          pricing_types (id, code, name)
        `)
        .eq('invoice_id', id)
        .order('sequence', { ascending: true });

      if (detailsError) throw detailsError;

      // Return combined data
      return {
        ...data,
        invoice_details: updatedDetails || []
      };
    }

    return data;
  } catch (error) {
    logger.error('Error in updateInvoice:', error, 'id:', id, 'invoiceData:', invoiceData);
    throw error;
  }
}

// Delete an invoice
export async function deleteInvoice(id: string) {
  const supabase = createClient();
  try {
    // Delete invoice details first (cascade should handle this, but just to be safe)
    const { error: detailsError } = await supabase
      .from('invoice_details')
      .delete()
      .eq('invoice_id', id);

    if (detailsError) throw detailsError;

    // Then delete the invoice
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Error in deleteInvoice:', error, 'id:', id);
    throw error;
  }
}

// Fetch units for dropdown
export async function fetchUnits() {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error in fetchUnits:', error);
    throw error;
  }
}

// Create a new invoice detail
export async function createInvoiceDetail(detail: InvoiceDetailFormData) {
  const supabase = createClient();
  try {
    // Remove pricing_types and units objects as they're not columns in the database
    const { pricing_types, units, ...detailWithoutNestedObjects } = detail;

    const { data, error } = await supabase
      .from('invoice_details')
      .insert([detailWithoutNestedObjects])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from API');
    return data;
  } catch (error) {
    logger.error('Error in createInvoiceDetail:', error, 'detail:', detail);
    throw error;
  }
}

// Update an invoice detail
export async function updateInvoiceDetail(id: string, detail: Partial<InvoiceDetailFormData>) {
  const supabase = createClient();
  try {
    // Remove pricing_types and units objects as they're not columns in the database
    const { pricing_types, units, ...detailWithoutNestedObjects } = detail;

    const { data, error } = await supabase
      .from('invoice_details')
      .update(detailWithoutNestedObjects)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from API');
    return data;
  } catch (error) {
    logger.error('Error in updateInvoiceDetail:', error, 'id:', id, 'detail:', detail);
    throw error;
  }
}

// Delete an invoice detail
export async function deleteInvoiceDetail(id: string) {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from('invoice_details')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Error in deleteInvoiceDetail:', error, 'id:', id);
    throw error;
  }
}

// Fetch invoices with client information and pagination
export async function fetchInvoices({
  page = 1,
  limit = 10,
  clientId = null,
  orderIdSearch = '',
  invoiceNumberSearch = '',
  skipPagination = false
}: {
  page?: number;
  limit?: number;
  clientId?: string | null;
  orderIdSearch?: string;
  invoiceNumberSearch?: string;
  skipPagination?: boolean;
} = {}) {
  const supabase = createClient();

  try {
    // Calculate offset based on page and limit
    const offset = (page - 1) * limit;

    // Create base query with joins
    let query = supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        client_id,
        financial_invoice_number,
        financial_invoice_date,
        reference,
        vat_percentage,
        vat_amount,
        exchange_rate,
        notes,
        order_id,
        contact_id,
        status,
        created_at,
        updated_at,
        clients!client_id (id, name),
        orders!order_id (id, order_number),
        contacts!contact_id (id, full_name)
      `, { count: 'exact' });

    // Apply filters
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (orderIdSearch) {
      query = query.eq('order_id', orderIdSearch);
    }

    if (invoiceNumberSearch) {
      query = query.ilike('invoice_number', `%${invoiceNumberSearch}%`);
    }

    // Sort by invoice_date descending
    query = query
      .order('invoice_date', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply pagination if not skipped
    if (!skipPagination) {
      query = query.range(offset, offset + limit - 1);
    }

    // Execute query
    const { data: invoices, error: invoicesError, count } = await query;

    if (invoicesError) throw invoicesError;

    return {
      invoices: invoices || [],
      total: count || 0,
      error: null
    };
  } catch (error) {
    logger.error('Error in fetchInvoices:', error);
    return {
      invoices: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
