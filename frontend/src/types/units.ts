export interface UnitFormData {
  id?: string;
  name: string;
  description?: string | null;
}

export interface Unit extends UnitFormData {
  id: string;
  created_at: string;
  updated_at?: string | null;
}
