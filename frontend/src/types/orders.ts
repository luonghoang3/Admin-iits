import { Client } from './clients'

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderFormData {
  id?: string;
  client_id: string;
  contact_id?: string;
  type: 'international' | 'local';
  team_id: string;
  order_date: string;
  client_ref_code?: string | null;
  vessel_carrier?: string;
  bill_of_lading?: string;
  bill_of_lading_date?: string | null;
  order_number?: string;
  shipper_id?: string;
  buyer_id?: string;
  status?: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  inspection_date_started?: string | null;
  inspection_date_completed?: string | null;
  inspection_place?: string | null;
  notes?: string | null;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  commodity_id: string;
  quantity: number;
  unit_id: string;
  commodity_description: string | null;

  // Các trường từ nested join
  commodities?: {
    id: string;
    name: string;
    description: string | null;
  } | null;

  units?: {
    id: string;
    name: string;
  } | null;

  // Fields returned by the API after processing
  commodity?: {
    id: string;
    name: string;
    description: string | null;
  } | null;

  unit?: {
    id: string;
    name: string;
  } | null;

  created_at?: string;
  updated_at?: string;
}

export interface Shipper {
  id: string;
  name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Buyer {
  id: string;
  name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Commodity {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  created_at?: string;
  updated_at?: string;
}

export interface Order extends OrderFormData {
  id: string;
  created_at: string;
  updated_at: string;

  // Nested objects
  clients?: Client;
  selected_contact?: {
    id: string;
    client_id: string;
    full_name: string;
    position?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  shipper?: Shipper;
  buyer?: Buyer;
  items?: OrderItem[];
  team?: Team; // Thêm thông tin team tương ứng với department
}