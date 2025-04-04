export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  tax_id?: string | null;
  team_ids?: string[];
  created_at?: string;
  updated_at?: string;
  contacts?: Contact[];
}

export interface Contact {
  id: string;
  client_id: string;
  full_name: string;
  position?: string | null;
  phone?: string | null;
  email?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ClientFormData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id?: string;
}

export interface ContactFormData {
  id: string;
  full_name: string;
  position: string;
  phone: string;
  email: string;
} 