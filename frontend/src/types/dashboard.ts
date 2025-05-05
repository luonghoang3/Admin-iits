export interface TeamOrder {
  team: string;
  count: number;
  percent: number;
  color: string;
  team_id?: string;
}

export interface MonthlyOrder {
  month: number;
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
}

export interface StatsData {
  user_count?: { count: number };
  client_count?: { count: number };
  order_count?: { count: number };
  year_order_count?: { count: number };
  current_year_orders?: MonthlyOrder[];
  previous_year_orders?: MonthlyOrder[];
  team_orders?: TeamOrder[];
}
