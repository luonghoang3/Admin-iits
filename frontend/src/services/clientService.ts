/**
 * Service để quản lý các hàm liên quan đến client
 */

import { 
  createClientRecord, 
  updateClient, 
  deleteClient, 
  createContact, 
  updateContact, 
  deleteContact, 
  fetchClients as fetchClientsFromClient,
  fetchClient as fetchClientFromClient,
  fetchContactsByClientId as fetchContactsByClientIdFromClient
} from '@/utils/supabase/client';
import { invalidateClientCache } from '@/services/cacheInvalidationService';
import logger from '@/lib/logger';

/**
 * Lấy danh sách khách hàng
 */
export async function fetchClients(page = 1, limit = 15, searchQuery = '') {
  try {
    const result = await fetchClientsFromClient(page, limit, searchQuery);
    return result;
  } catch (error) {
    logger.error('Error in fetchClients:', error);
    throw error;
  }
}

/**
 * Lấy thông tin khách hàng theo ID
 */
export async function fetchClient(clientId: string) {
  try {
    const result = await fetchClientFromClient(clientId);
    return result;
  } catch (error) {
    logger.error('Error in fetchClient:', error, 'clientId:', clientId);
    throw error;
  }
}

/**
 * Lấy danh sách liên hệ của khách hàng
 */
export async function fetchContactsByClientId(clientId: string) {
  try {
    const result = await fetchContactsByClientIdFromClient(clientId);
    return result;
  } catch (error) {
    logger.error('Error in fetchContactsByClientId:', error, 'clientId:', clientId);
    throw error;
  }
}

/**
 * Tạo khách hàng mới
 */
export async function createClient(data: {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  team_ids?: string[];
}) {
  try {
    const result = await createClientRecord(data);
    
    // Invalidate cache khi tạo khách hàng mới
    if (result.client) {
      invalidateClientCache(result.client.id);
    }
    
    return result;
  } catch (error) {
    logger.error('Error in createClient:', error, 'data:', data);
    throw error;
  }
}

/**
 * Cập nhật thông tin khách hàng
 */
export async function updateClientInfo(clientId: string, data: {
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  team_ids?: string[];
}) {
  try {
    const result = await updateClient(clientId, data);
    
    // Invalidate cache khi cập nhật khách hàng
    invalidateClientCache(clientId);
    
    return result;
  } catch (error) {
    logger.error('Error in updateClientInfo:', error, 'clientId:', clientId, 'data:', data);
    throw error;
  }
}

/**
 * Xóa khách hàng
 */
export async function deleteClientById(clientId: string) {
  try {
    const result = await deleteClient(clientId);
    
    // Invalidate cache khi xóa khách hàng
    invalidateClientCache(clientId);
    
    return result;
  } catch (error) {
    logger.error('Error in deleteClientById:', error, 'clientId:', clientId);
    throw error;
  }
}

/**
 * Tạo liên hệ mới cho khách hàng
 */
export async function createClientContact(data: {
  client_id: string;
  full_name: string;
  position?: string;
  phone?: string;
  email?: string;
}) {
  try {
    const result = await createContact(data);
    
    // Invalidate cache khi tạo liên hệ mới
    invalidateClientCache(data.client_id);
    
    return result;
  } catch (error) {
    logger.error('Error in createClientContact:', error, 'data:', data);
    throw error;
  }
}

/**
 * Cập nhật thông tin liên hệ
 */
export async function updateClientContact(contactId: string, data: {
  full_name?: string;
  position?: string;
  phone?: string;
  email?: string;
}, clientId?: string) {
  try {
    const result = await updateContact(contactId, data);
    
    // Invalidate cache khi cập nhật liên hệ
    if (clientId) {
      invalidateClientCache(clientId);
    }
    
    return result;
  } catch (error) {
    logger.error('Error in updateClientContact:', error, 'contactId:', contactId, 'data:', data);
    throw error;
  }
}

/**
 * Xóa liên hệ
 */
export async function deleteClientContact(contactId: string, clientId?: string) {
  try {
    const result = await deleteContact(contactId);
    
    // Invalidate cache khi xóa liên hệ
    if (clientId) {
      invalidateClientCache(clientId);
    }
    
    return result;
  } catch (error) {
    logger.error('Error in deleteClientContact:', error, 'contactId:', contactId);
    throw error;
  }
}
