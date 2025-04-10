import { useState, useEffect, useCallback } from 'react'
import { fetchClients, fetchCommodities, fetchUnits } from '@/utils/supabase/client'

/**
 * Hook to handle loading and managing reference data for forms
 */
export function useReferenceData() {
  // State for clients
  const [clients, setClients] = useState<any[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  
  // State for commodities
  const [commodities, setCommodities] = useState<any[]>([])
  const [isLoadingCommodities, setIsLoadingCommodities] = useState(false)
  
  // State for units
  const [units, setUnits] = useState<any[]>([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  
  // Staggered loading to improve performance
  useEffect(() => {
    const loadData = async () => {
      // First load clients
      await loadClients()
      
      // Then load units (smaller dataset)
      setTimeout(async () => {
        await loadUnits()
        
        // Then load commodities (potentially larger dataset)
        setTimeout(async () => {
          await loadCommodities()
        }, 300)
      }, 200)
    }
    
    loadData()
  }, [])
  
  /**
   * Load clients
   */
  const loadClients = useCallback(async () => {
    if (clients.length > 0) return // Don't reload if already have data
    
    try {
      setIsLoadingClients(true)
      const response = await fetchClients(1, 10) // Start with just 10 clients
      if (response.clients) {
        setClients(response.clients)
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoadingClients(false)
    }
  }, [clients.length])
  
  /**
   * Load commodities
   */
  const loadCommodities = useCallback(async () => {
    if (commodities.length > 0) return // Don't reload if already have data
    
    try {
      setIsLoadingCommodities(true)
      const response = await fetchCommodities(1, 10) // Start with just 10 commodities
      if (response.commodities) {
        setCommodities(response.commodities)
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoadingCommodities(false)
    }
  }, [commodities.length])
  
  /**
   * Load units
   */
  const loadUnits = useCallback(async () => {
    if (units.length > 0) return // Don't reload if already have data
    
    try {
      setIsLoadingUnits(true)
      const response = await fetchUnits()
      if (response.units) {
        setUnits(response.units)
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoadingUnits(false)
    }
  }, [units.length])
  
  return {
    clients,
    isLoadingClients,
    commodities,
    isLoadingCommodities,
    units,
    isLoadingUnits,
    loadClients,
    loadCommodities,
    loadUnits
  }
} 