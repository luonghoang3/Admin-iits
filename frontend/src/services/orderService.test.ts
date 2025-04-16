// Mock Supabase client để không truy cập thật vào DB
jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: (tableName: string) => {
      if (tableName === 'order_items') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({ data: [{ id: 'mock-item-id', order_id: 'mock-order-id', quantity: 20 }], error: null })
            })
          }),
          insert: () => ({ single: () => ({ data: { id: 'mock-item-id', order_id: 'mock-order-id', quantity: 10 }, error: null }) }),
          update: () => ({ eq: () => ({ single: () => ({ data: { id: 'mock-item-id', order_id: 'mock-order-id', quantity: 20 }, error: null }) }) }),
          delete: () => ({ eq: () => ({ data: null, error: null }) })
        };
      }
      // default mock cho các bảng khác
      return {
        select: () => ({ eq: () => ({ single: () => ({ data: { id: 'mock-order-id', status: 'draft' }, error: null }) }) }),
        insert: () => ({ single: () => ({ data: { id: 'mock-order-id' }, error: null }) }),
        update: () => ({ eq: () => ({ single: () => ({ data: { id: 'mock-order-id', status: 'completed' }, error: null }) }) }),
        delete: () => ({ eq: () => ({ data: null, error: null }) }),
        order: () => ({ eq: () => ({ single: () => ({ data: { id: 'mock-order-id' }, error: null }) }) }),
        range: () => ({ select: () => ({ data: [], count: 0, error: null }) })
      };
    }
  })
}));

import {
  fetchOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  fetchOrders,
  fetchOrderItems,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
  deleteOrderItemsByOrderId
} from './orderService';

describe('Order Service (Mocked)', () => {
  let createdOrderId: string;
  let createdItemId: string;
  const testOrder = {
    client_id: 'test-client',
    type: 'international',
    team_id: 'e7697f59-05cc-434e-b679-fde4c53b7d7c',
    order_date: new Date().toISOString().split('T')[0],
    status: 'draft',
  };

  it('should create an order', async () => {
    const order = await createOrder(testOrder) as { id: string };
    expect(order).toBeDefined();
    expect(order.id).toBeDefined();
    createdOrderId = order.id;
  });

  it('should fetch order by id', async () => {
    const order = await fetchOrderById(createdOrderId);
    expect(order).toBeDefined();
    expect(order.id).toEqual(createdOrderId);
  });

  it('should update order', async () => {
    const updated = await updateOrder(createdOrderId, { status: 'completed' });
    expect(updated).toBeDefined();
    expect(updated.status).toEqual('completed');
  });

  it('should create order item', async () => {
    const payload = {
      order_id: createdOrderId,
      commodity_id: 'test-commodity',
      unit_id: 'test-unit',
      quantity: 10,
      commodity_description: 'Test commodity',
    };
    const { orderItem, error } = await createOrderItem(payload);
    expect(error).toBeNull();
    expect(orderItem).toBeDefined();
    createdItemId = orderItem.id;
  });

  it('should fetch order items', async () => {
    const { orderItems, error } = await fetchOrderItems(createdOrderId);
    expect(error).toBeNull();
    expect(orderItems.length).toBeGreaterThan(0);
  });

  it('should update order item', async () => {
    const { orderItem, error } = await updateOrderItem(createdItemId, { quantity: 20 });
    expect(error).toBeNull();
    expect(orderItem.quantity).toEqual(20);
  });

  it('should delete order item', async () => {
    const { success, error } = await deleteOrderItem(createdItemId);
    expect(error).toBeNull();
    expect(success).toBe(true);
  });

  it('should delete all order items by order id', async () => {
    const { success, error } = await deleteOrderItemsByOrderId(createdOrderId);
    expect(error).toBeNull();
    expect(success).toBe(true);
  });

  it('should delete order', async () => {
    const { success } = await deleteOrder(createdOrderId);
    expect(success).toBe(true);
  });
});
