import { useEffect } from 'react';
import { useAppStore } from '../stores/app-store';
import { apiClient } from '../api/client';

/**
 * Hook to fetch OpenAPI spec for the selected service
 */
export function useOpenApiSpec(service: string | null) {
  const { specs, setSpec, setLoading, setAppError } = useAppStore();

  useEffect(() => {
    if (!service) return;

    // Check if spec is already loaded
    if (specs[service]) {
      return;
    }

    let mounted = true;

    async function fetchSpec() {
      if (!service) return;

      setLoading(true);
      setAppError(null);

      try {
        const spec = await apiClient.getSpec(service);

        if (mounted) {
          setSpec(service, spec);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setAppError(
            error instanceof Error ? error.message : `Failed to load spec for ${service}`
          );
          setLoading(false);
        }
      }
    }

    fetchSpec();

    return () => {
      mounted = false;
    };
  }, [service, specs, setSpec, setLoading, setAppError]);

  return {
    spec: service ? specs[service] : null,
    isLoading: !service || !specs[service],
  };
}
