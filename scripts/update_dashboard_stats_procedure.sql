-- Cập nhật stored procedure get_dashboard_stats để thêm thống kê hóa đơn tài chính
CREATE OR REPLACE FUNCTION get_dashboard_stats(year_param integer, month_param text DEFAULT 'all')
RETURNS TABLE (
  stat_type text,
  stat_value jsonb
) AS $$
DECLARE
  user_count bigint;
  client_count bigint;
  order_count bigint;
  year_order_count bigint;
  invoice_count bigint;
  year_invoice_count bigint;
  invoice_status_counts jsonb;
  current_year_orders jsonb;
  previous_year_orders jsonb;
  current_year_invoices jsonb;
  previous_year_invoices jsonb;
  team_orders jsonb;
  team_invoices jsonb;
  total_revenue_vnd numeric;
  total_revenue_usd numeric;
  start_date date;
  end_date date;
BEGIN
  -- Lấy tổng số người dùng
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Lấy tổng số khách hàng
  SELECT COUNT(*) INTO client_count FROM clients;
  
  -- Lấy tổng số đơn hàng
  SELECT COUNT(*) INTO order_count FROM orders;
  
  -- Lấy tổng số hóa đơn
  SELECT COUNT(*) INTO invoice_count FROM invoices;
  
  -- Xác định khoảng thời gian dựa trên tháng được chọn
  start_date := make_date(year_param, 1, 1);
  end_date := make_date(year_param, 12, 31);
  
  IF month_param != 'all' THEN
    -- Nếu chọn tháng cụ thể
    DECLARE
      month_num integer := month_param::integer;
      next_month integer;
      next_year integer := year_param;
    BEGIN
      start_date := make_date(year_param, month_num, 1);
      
      IF month_num = 12 THEN
        next_month := 1;
        next_year := year_param + 1;
      ELSE
        next_month := month_num + 1;
      END IF;
      
      end_date := make_date(next_year, next_month, 1) - interval '1 day';
    END;
  END IF;
  
  -- Lấy số đơn hàng trong năm/tháng được chọn
  SELECT COUNT(*) INTO year_order_count 
  FROM orders 
  WHERE order_date BETWEEN start_date AND end_date;
  
  -- Lấy số hóa đơn trong năm/tháng được chọn
  SELECT COUNT(*) INTO year_invoice_count 
  FROM invoices 
  WHERE invoice_date BETWEEN start_date AND end_date;
  
  -- Lấy số lượng hóa đơn theo trạng thái
  SELECT jsonb_agg(
    jsonb_build_object(
      'status', status,
      'count', count
    )
  ) INTO invoice_status_counts
  FROM (
    SELECT 
      status,
      COUNT(*)::bigint as count
    FROM invoices
    WHERE invoice_date BETWEEN start_date AND end_date
    GROUP BY status
    ORDER BY status
  ) s;
  
  -- Lấy đơn hàng theo tháng cho năm hiện tại
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', month,
      'count', count
    )
  ) INTO current_year_orders
  FROM (
    SELECT 
      EXTRACT(MONTH FROM order_date)::integer as month, 
      COUNT(*)::bigint as count
    FROM orders
    WHERE EXTRACT(YEAR FROM order_date) = year_param
    GROUP BY month
    ORDER BY month
  ) m;
  
  -- Lấy đơn hàng theo tháng cho năm trước
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', month,
      'count', count
    )
  ) INTO previous_year_orders
  FROM (
    SELECT 
      EXTRACT(MONTH FROM order_date)::integer as month, 
      COUNT(*)::bigint as count
    FROM orders
    WHERE EXTRACT(YEAR FROM order_date) = year_param - 1
    GROUP BY month
    ORDER BY month
  ) m;
  
  -- Lấy hóa đơn theo tháng cho năm hiện tại
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', month,
      'count', count,
      'vnd_amount', vnd_amount,
      'usd_amount', usd_amount
    )
  ) INTO current_year_invoices
  FROM (
    SELECT 
      EXTRACT(MONTH FROM i.invoice_date)::integer as month, 
      COUNT(DISTINCT i.id)::bigint as count,
      COALESCE(SUM(
        CASE WHEN id.currency = 'VND' THEN id.amount ELSE 0 END
      ), 0) as vnd_amount,
      COALESCE(SUM(
        CASE WHEN id.currency = 'USD' THEN id.amount ELSE 0 END
      ), 0) as usd_amount
    FROM invoices i
    LEFT JOIN invoice_details id ON i.id = id.invoice_id
    WHERE EXTRACT(YEAR FROM i.invoice_date) = year_param
    GROUP BY month
    ORDER BY month
  ) m;
  
  -- Lấy hóa đơn theo tháng cho năm trước
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', month,
      'count', count,
      'vnd_amount', vnd_amount,
      'usd_amount', usd_amount
    )
  ) INTO previous_year_invoices
  FROM (
    SELECT 
      EXTRACT(MONTH FROM i.invoice_date)::integer as month, 
      COUNT(DISTINCT i.id)::bigint as count,
      COALESCE(SUM(
        CASE WHEN id.currency = 'VND' THEN id.amount ELSE 0 END
      ), 0) as vnd_amount,
      COALESCE(SUM(
        CASE WHEN id.currency = 'USD' THEN id.amount ELSE 0 END
      ), 0) as usd_amount
    FROM invoices i
    LEFT JOIN invoice_details id ON i.id = id.invoice_id
    WHERE EXTRACT(YEAR FROM i.invoice_date) = year_param - 1
    GROUP BY month
    ORDER BY month
  ) m;
  
  -- Lấy thống kê đơn hàng theo team
  IF month_param = 'all' THEN
    -- Nếu không chọn tháng cụ thể
    SELECT jsonb_agg(
      jsonb_build_object(
        'team', team_name,
        'count', count,
        'team_id', team_id
      )
    ) INTO team_orders
    FROM (
      SELECT 
        t.name as team_name,
        o.team_id,
        COUNT(*)::bigint as count
      FROM orders o
      LEFT JOIN teams t ON o.team_id = t.id
      WHERE EXTRACT(YEAR FROM o.order_date) = year_param
      GROUP BY t.name, o.team_id
      ORDER BY count DESC
    ) t;
  ELSE
    -- Nếu chọn tháng cụ thể
    SELECT jsonb_agg(
      jsonb_build_object(
        'team', team_name,
        'count', count,
        'team_id', team_id
      )
    ) INTO team_orders
    FROM (
      SELECT 
        t.name as team_name,
        o.team_id,
        COUNT(*)::bigint as count
      FROM orders o
      LEFT JOIN teams t ON o.team_id = t.id
      WHERE o.order_date BETWEEN start_date AND end_date
      GROUP BY t.name, o.team_id
      ORDER BY count DESC
    ) t;
  END IF;
  
  -- Lấy thống kê hóa đơn theo team
  IF month_param = 'all' THEN
    -- Nếu không chọn tháng cụ thể
    SELECT jsonb_agg(
      jsonb_build_object(
        'team', team_name,
        'count', count,
        'team_id', team_id,
        'vnd_amount', vnd_amount,
        'usd_amount', usd_amount
      )
    ) INTO team_invoices
    FROM (
      SELECT 
        t.name as team_name,
        o.team_id,
        COUNT(DISTINCT i.id)::bigint as count,
        COALESCE(SUM(
          CASE WHEN id.currency = 'VND' THEN id.amount ELSE 0 END
        ), 0) as vnd_amount,
        COALESCE(SUM(
          CASE WHEN id.currency = 'USD' THEN id.amount ELSE 0 END
        ), 0) as usd_amount
      FROM invoices i
      JOIN orders o ON i.order_id = o.id
      LEFT JOIN teams t ON o.team_id = t.id
      LEFT JOIN invoice_details id ON i.id = id.invoice_id
      WHERE EXTRACT(YEAR FROM i.invoice_date) = year_param
      GROUP BY t.name, o.team_id
      ORDER BY count DESC
    ) t;
  ELSE
    -- Nếu chọn tháng cụ thể
    SELECT jsonb_agg(
      jsonb_build_object(
        'team', team_name,
        'count', count,
        'team_id', team_id,
        'vnd_amount', vnd_amount,
        'usd_amount', usd_amount
      )
    ) INTO team_invoices
    FROM (
      SELECT 
        t.name as team_name,
        o.team_id,
        COUNT(DISTINCT i.id)::bigint as count,
        COALESCE(SUM(
          CASE WHEN id.currency = 'VND' THEN id.amount ELSE 0 END
        ), 0) as vnd_amount,
        COALESCE(SUM(
          CASE WHEN id.currency = 'USD' THEN id.amount ELSE 0 END
        ), 0) as usd_amount
      FROM invoices i
      JOIN orders o ON i.order_id = o.id
      LEFT JOIN teams t ON o.team_id = t.id
      LEFT JOIN invoice_details id ON i.id = id.invoice_id
      WHERE i.invoice_date BETWEEN start_date AND end_date
      GROUP BY t.name, o.team_id
      ORDER BY count DESC
    ) t;
  END IF;
  
  -- Lấy tổng doanh thu
  SELECT 
    COALESCE(SUM(
      CASE WHEN id.currency = 'VND' THEN id.amount ELSE 0 END
    ), 0) INTO total_revenue_vnd
  FROM invoices i
  LEFT JOIN invoice_details id ON i.id = id.invoice_id
  WHERE i.invoice_date BETWEEN start_date AND end_date;
  
  SELECT 
    COALESCE(SUM(
      CASE WHEN id.currency = 'USD' THEN id.amount ELSE 0 END
    ), 0) INTO total_revenue_usd
  FROM invoices i
  LEFT JOIN invoice_details id ON i.id = id.invoice_id
  WHERE i.invoice_date BETWEEN start_date AND end_date;
  
  -- Trả về kết quả
  RETURN QUERY VALUES 
    -- Các giá trị hiện có
    ('user_count', jsonb_build_object('count', user_count)),
    ('client_count', jsonb_build_object('count', client_count)),
    ('order_count', jsonb_build_object('count', order_count)),
    ('year_order_count', jsonb_build_object('count', year_order_count)),
    ('current_year_orders', COALESCE(current_year_orders, '[]'::jsonb)),
    ('previous_year_orders', COALESCE(previous_year_orders, '[]'::jsonb)),
    ('team_orders', COALESCE(team_orders, '[]'::jsonb)),
    -- Các giá trị mới thêm
    ('invoice_count', jsonb_build_object('count', invoice_count)),
    ('year_invoice_count', jsonb_build_object('count', year_invoice_count)),
    ('invoice_status_counts', COALESCE(invoice_status_counts, '[]'::jsonb)),
    ('current_year_invoices', COALESCE(current_year_invoices, '[]'::jsonb)),
    ('previous_year_invoices', COALESCE(previous_year_invoices, '[]'::jsonb)),
    ('team_invoices', COALESCE(team_invoices, '[]'::jsonb)),
    ('total_revenue_vnd', jsonb_build_object('amount', total_revenue_vnd)),
    ('total_revenue_usd', jsonb_build_object('amount', total_revenue_usd));
END;
$$ LANGUAGE plpgsql;
