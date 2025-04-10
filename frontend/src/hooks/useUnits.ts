import { useEffect, useState } from 'react';
import { fetchUnits } from '@/utils/supabase/client';
import type { Unit } from '@/types/orders';

export function useUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUnits() {
      try {
        setIsLoading(true);
        const { units: data } = await fetchUnits();
        setUnits(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load units');
      } finally {
        setIsLoading(false);
      }
    }

    loadUnits();
  }, []);

  return { units, isLoading, error };
} 