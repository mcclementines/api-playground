import { useEffect } from 'react';
import { useAppStore } from '../stores/app-store';
import { apiClient } from '../api/client';

/**
 * Hook to fetch and load available services on mount
 */
export function useServices() {
  const { services, setServices, setLoading, setError } = useAppStore();

  useEffect(() => {
    let mounted = true;

    async function fetchServices() {
      setLoading(true);
      setError(null);

      try {
        const data = await apiClient.getServices();

        if (mounted) {
          setServices(data);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to load services');
          setLoading(false);
        }
      }
    }

    fetchServices();

    return () => {
      mounted = false;
    };
  }, [setServices, setLoading, setError]);

  return { services };
}
