import { createClient } from '@/utils/supabase/client';
import { PricingType, PricingTypeFormData } from '@/types/pricing-types';
import logger from '@/lib/logger';

// Fetch all pricing types
export async function fetchPricingTypes() {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('pricing_types')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error in fetchPricingTypes:', error);
    throw error;
  }
}

// Fetch pricing type by ID
export async function fetchPricingTypeById(id: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('pricing_types')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    if (!data) throw new Error(`Pricing type with ID ${id} not found`);
    return data;
  } catch (error) {
    logger.error('Error in fetchPricingTypeById:', error, 'id:', id);
    throw error;
  }
}

// Create a new pricing type
export async function createPricingType(pricingTypeData: PricingTypeFormData) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('pricing_types')
      .insert([pricingTypeData])
      .select()
      .single();
      
    if (error) throw error;
    if (!data) throw new Error('No data returned from API');
    return data;
  } catch (error) {
    logger.error('Error in createPricingType:', error, 'pricingTypeData:', pricingTypeData);
    throw error;
  }
}

// Update a pricing type
export async function updatePricingType(id: string, pricingTypeData: Partial<PricingTypeFormData>) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('pricing_types')
      .update(pricingTypeData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    if (!data) throw new Error('No data returned from API');
    return data;
  } catch (error) {
    logger.error('Error in updatePricingType:', error, 'id:', id, 'pricingTypeData:', pricingTypeData);
    throw error;
  }
}

// Delete a pricing type
export async function deletePricingType(id: string) {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from('pricing_types')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Error in deletePricingType:', error, 'id:', id);
    throw error;
  }
}
