export interface PricingTypeFormData {
  id?: string;
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface PricingType extends PricingTypeFormData {
  id: string;
  created_at: string;
  updated_at: string;
}
