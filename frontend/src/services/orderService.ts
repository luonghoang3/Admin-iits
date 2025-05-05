import { createClient, fetchNextOrderSequence } from '@/utils/supabase/client';
import { OrderFormData } from '@/types/orders';
import logger from '@/lib/logger'

// This service layer provides a simplified interface for order-related operations
// It uses the lower-level functions from client.ts but adds additional business logic

// Fetch order by ID
export async function fetchOrderById(id: string) {
  const supabase = createClient();
  try {
    // Giảm số lượng log để tránh vòng lặp vô tận
    console.log('fetchOrderById - Fetching order with ID:', id);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        clients!client_id (id, name, trade_name, email, phone, address, tax_id),
        contacts!contact_id (id, full_name, position, email, phone)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('fetchOrderById - Error fetching order:', error);
      throw error;
    }

    if (!data) {
      console.error('fetchOrderById - Order not found with ID:', id);
      throw new Error(`Order with ID ${id} not found`);
    }

    // Chỉ log thông tin cơ bản, không log toàn bộ dữ liệu
    console.log('fetchOrderById - Successfully fetched order with ID:', id);
    return data;
  } catch (error) {
    console.error('fetchOrderById - Caught error:', error);
    logger.error('Error in fetchOrderById:', error, 'id:', id);
    throw error;
  }
}

// Create a new order
export async function createOrder(orderData: OrderFormData) {
  const supabase = createClient();
  try {
    // Ensure order_number is generated if not present
    let dataToSave = { ...orderData };
    if (!dataToSave.order_number) {
      try {
        // Get type prefix (I or L)
        const typePrefix = dataToSave.type === 'international' ? 'I' : 'L';

        // Get team code based on team_id
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('name')
          .eq('id', dataToSave.team_id)
          .single();

        if (teamError) throw teamError;

        // Map team name to team code
        const teamCode = teamData.name === 'Marine' ? 'MR' :
                      teamData.name === 'Agri' ? 'AF' :
                      teamData.name === 'CG' ? 'CG' : 'XX';

        // Get year code (last 2 digits of current year)
        const yearCode = new Date().getFullYear().toString().substring(2);

        // Get next sequence number from database
        const { formattedOrderNumber, error } = await fetchNextOrderSequence(
          typePrefix,
          teamCode,
          yearCode
        );

        if (error) throw error;

        // Use the formatted order number
        dataToSave.order_number = formattedOrderNumber;
      } catch (error) {
        logger.error('Error generating order number in orderService:', error);
        // Fallback to old format if there's an error
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const datePart = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
        const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const rand = Math.floor(1000 + Math.random() * 9000);
        dataToSave.order_number = `ORD-${datePart}-${timePart}-${rand}`;
      }
    }

    const { data, error } = await supabase.from('orders').insert([dataToSave]).select().single();
    if (error) throw error;
    if (!data) throw new Error('No data returned from API');
    return data;
  } catch (error) {
    logger.error('Error in createOrder:', error, 'orderData:', orderData);
    throw error;
  }
}

// Update an order
export async function updateOrder(id: string, orderData: Partial<OrderFormData>) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.from('orders').update(orderData).eq('id', id).select().single();
    if (error) throw error;
    if (!data) throw new Error('No data returned from API');
    return data;
  } catch (error) {
    logger.error('Error in updateOrder:', error, 'id:', id, 'orderData:', orderData);
    throw error;
  }
}

// Delete an order
export async function deleteOrder(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
}

// Fetch all orders with optional filters
// --------- ORDER ITEMS SERVICE ---------

// Fetch order items by order ID
export async function fetchOrderItems(orderId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        commodity_id,
        quantity,
        unit_id,
        units (id, name),
        commodity_description,
        created_at,
        updated_at
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) return { orderItems: [], error };
    return { orderItems: data || [], error: null };
  } catch (error) {
    logger.error('Error in fetchOrderItems:', error, 'orderId:', orderId);
    return { orderItems: [], error };
  }
}

// Create order item
export async function createOrderItem(orderItemData: any) {
  const supabase = createClient();
  try {
    // Ensure order_id is set
    if (!orderItemData.order_id) {
      logger.error('Missing order_id in orderItemData:', orderItemData);
      return { orderItem: null, error: new Error('Missing order_id') };
    }

    // Ensure required fields are present
    if (!orderItemData.commodity_id) {
      return { orderItem: null, error: new Error('Missing commodity_id') };
    }

    if (!orderItemData.unit_id) {
      return { orderItem: null, error: new Error('Missing unit_id') };
    }

    // Set default quantity if not provided
    if (orderItemData.quantity === undefined || orderItemData.quantity === null) {
      orderItemData.quantity = 1;
    }

    // Đã gỡ bỏ debug log

    const { data, error } = await supabase
      .from('order_items')
      .insert([orderItemData])
      .select(`
        id,
        order_id,
        commodity_id,
        quantity,
        unit_id,
        units (id, name),
        commodity_description,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      logger.error('Supabase error in createOrderItem:', error);
      return { orderItem: null, error };
    }

    if (!data) {
      logger.error('No data returned from API in createOrderItem');
      return { orderItem: null, error: new Error('No data returned from API') };
    }

    // Đã gỡ bỏ debug log
    return { orderItem: data, error: null };
  } catch (error) {
    logger.error('Error in createOrderItem:', error, 'orderItemData:', orderItemData);
    return { orderItem: null, error };
  }
}

// Update order item
export async function updateOrderItem(id: string, orderItemData: any) {
  const supabase = createClient();
  try {
    // Validate input
    if (!id) {
      logger.error('Missing id in updateOrderItem');
      return { orderItem: null, error: new Error('Missing item id') };
    }

    // Ensure at least one field is being updated
    if (Object.keys(orderItemData).length === 0) {
      logger.error('No fields to update in updateOrderItem');
      return { orderItem: null, error: new Error('No fields to update') };
    }

    // Đã gỡ bỏ debug log

    const { data, error } = await supabase
      .from('order_items')
      .update(orderItemData)
      .eq('id', id)
      .select(`
        id,
        order_id,
        commodity_id,
        quantity,
        unit_id,
        units (id, name),
        commodity_description,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      logger.error('Supabase error in updateOrderItem:', error);
      return { orderItem: null, error };
    }

    if (!data) {
      logger.error('No data returned from API in updateOrderItem');
      return { orderItem: null, error: new Error('No data returned from API') };
    }

    // Đã gỡ bỏ debug log
    return { orderItem: data, error: null };
  } catch (error) {
    logger.error('Error in updateOrderItem:', error, 'id:', id, 'orderItemData:', orderItemData);
    return { orderItem: null, error };
  }
}

// Delete a single order item
export async function deleteOrderItem(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('order_items').delete().eq('id', id);
  if (error) return { success: false, error };
  return { success: true, error: null };
}

// Delete all order items for a given order
export async function deleteOrderItemsByOrderId(orderId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('order_items').delete().eq('order_id', orderId);
  if (error) return { success: false, error };
  return { success: true, error: null };
}

// --------- ORDERS SERVICE ---------

// Fetch orders with client information and pagination
export async function fetchOrders({
  page = 1,
  limit = 10,
  teamId = null,
  orderNumberSearch = '',
  clientSearch = '', // Thêm tham số clientSearch
  skipPagination = false // Thêm tham số để bỏ qua phân trang khi tìm kiếm khách hàng
}: {
  page?: number;
  limit?: number;
  teamId?: string | null;
  orderNumberSearch?: string;
  clientSearch?: string; // Thêm kiểu dữ liệu cho clientSearch
  skipPagination?: boolean;
} = {}) {
  const supabase = createClient();

  try {
    // Tính offset dựa trên page và limit
    const offset = (page - 1) * limit;

    // Tạo query cơ bản với join rõ ràng hơn
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        client_id,
        team_id,
        type,
        status,
        order_date,
        created_at,
        updated_at,
        client_ref_code,
        inspection_date_started,
        inspection_date_completed,
        inspection_place,
        notes,
        clients!client_id (id, name),
        teams!team_id (id, name)
      `, { count: 'exact' });

    // Áp dụng bộ lọc theo team nếu có
    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    // Áp dụng tìm kiếm theo mã đơn hàng nếu có
    if (orderNumberSearch) {
      query = query.ilike('order_number', `%${orderNumberSearch}%`);
    }

    // Áp dụng tìm kiếm theo khách hàng nếu có
    if (clientSearch) {
      // Import hàm removeAccentsJS từ client.ts
      const { removeAccentsJS } = await import('@/utils/supabase/client');

      // Loại bỏ dấu từ từ khóa tìm kiếm
      const searchWithoutAccent = removeAccentsJS(clientSearch);

      // Sử dụng cách tiếp cận khác: tìm kiếm theo client_id
      // Trước tiên, tìm các client phù hợp với từ khóa tìm kiếm
      const { data: matchingClients, error: clientsError } = await supabase
        .from('clients')
        .select('id')
        .or(`name.ilike.%${clientSearch}%,name_without_accent.ilike.%${searchWithoutAccent}%`);

      if (clientsError) {
        logger.error('Error searching clients:', clientsError);
      } else if (matchingClients && matchingClients.length > 0) {
        // Lấy danh sách ID của các client phù hợp
        const clientIds = matchingClients.map(c => c.id);

        // Tìm các đơn hàng có client_id nằm trong danh sách này
        query = query.in('client_id', clientIds);

        logger.log(`Found ${clientIds.length} clients matching search: ${clientSearch}`);
      } else {
        // Nếu không tìm thấy client nào, trả về kết quả rỗng
        logger.log(`No clients found matching search: ${clientSearch}`);
        return { orders: [], total: 0, error: null };
      }

      logger.log(`Searching for clients with name containing: ${clientSearch} (without accents: ${searchWithoutAccent})`);
    }

    // Sắp xếp theo order_date giảm dần (đơn hàng mới nhất ở trang đầu)
    query = query
      .order('order_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    // Áp dụng phân trang nếu không bỏ qua
    // Luôn áp dụng phân trang, trừ khi skipPagination=true
    if (!skipPagination) {
      query = query.range(offset, offset + limit - 1);
    }

    // Thực thi query
    const { data: orders, error: ordersError, count } = await query;

    if (ordersError) throw ordersError;

    // Đã gỡ bỏ debug log

    // Đảm bảo dữ liệu trả về đúng định dạng
    const processedOrders = orders?.map(order => {
      // Xử lý client_name và team_name
      // Sử dụng cách tiếp cận an toàn hơn
      let client_name = '-';
      let team_name = 'Unknown';

      // Xử lý client_name - ưu tiên trade_name nếu có
      try {
        if (order.clients) {
          // Supabase trả về clients dưới dạng object
          // @ts-ignore - Bỏ qua kiểm tra kiểu dữ liệu
          client_name = order.clients.trade_name || order.clients.name || '-';
          // Đã gỡ bỏ debug log
        }
      } catch (e) {
        // Đã gỡ bỏ debug log
      }

      // Xử lý team_name
      try {
        if (order.teams) {
          // Supabase trả về teams dưới dạng object
          // @ts-ignore - Bỏ qua kiểm tra kiểu dữ liệu
          team_name = order.teams.name || 'Unknown';
          // Đã gỡ bỏ debug log
        }
      } catch (e) {
        // Đã gỡ bỏ debug log
      }

      return {
        ...order,
        client_name,
        team_name
      };
    }) || [];

    return { orders: processedOrders, total: count || 0, error: null };
  } catch (error: any) {
    // Đã gỡ bỏ debug log
    return { orders: [], total: 0, error: error.message };
  }
}
