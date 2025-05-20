export interface TeamOrder {
  team: string;
  count: number;
  percent: number;
  color: string;
  team_id?: string;
}

export interface TeamInvoice {
  team: string;
  count: number;
  vnd_amount: number;
  usd_amount: number;
  percent: number;
  color: string;
  team_id?: string;
}

export interface MonthlyOrder {
  month: number;
  count: number;
}

export interface MonthlyInvoice {
  month: number;
  count: number;
  vnd_amount: number;
  usd_amount: number;
}

export interface InvoiceStatusCount {
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  count: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalClients: number;
  totalOrders: number;
  ordersThisYear: number;
  monthlyOrders: MonthlyOrder[];
  monthlyOrdersLastYear: MonthlyOrder[];
  teamOrders: TeamOrder[];
  // Thêm các trường mới
  totalInvoices: number;
  invoicesThisYear: number;
  invoiceStatusCounts: InvoiceStatusCount[];
  monthlyInvoices: MonthlyInvoice[];
  monthlyInvoicesLastYear: MonthlyInvoice[];
  teamInvoices: TeamInvoice[];
  totalRevenueVND: number;
  totalRevenueUSD: number;
}

export interface StatsData {
  user_count?: { count: number };
  client_count?: { count: number };
  order_count?: { count: number };
  year_order_count?: { count: number };
  current_year_orders?: MonthlyOrder[];
  previous_year_orders?: MonthlyOrder[];
  team_orders?: TeamOrder[];
  // Thêm các trường mới
  invoice_count?: { count: number };
  year_invoice_count?: { count: number };
  invoice_status_counts?: InvoiceStatusCount[];
  current_year_invoices?: MonthlyInvoice[];
  previous_year_invoices?: MonthlyInvoice[];
  team_invoices?: TeamInvoice[];
  total_revenue_vnd?: { amount: number };
  total_revenue_usd?: { amount: number };
}
