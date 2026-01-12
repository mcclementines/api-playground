import { useAppStore } from '../stores/app-store';
import { apiClient } from '../api/client';
import { buildProxyRequest, validatePathParams } from '../lib/request-builder';
import type { ProxyRequest } from '../types/request';

/**
 * Hook to send proxy requests
 */
export function useProxyRequest() {
  const {
    selectedService,
    selectedEndpoint,
    requestForm,
    setLoading,
    setRequestError,
    setResponse,
    addToHistory,
  } = useAppStore();

  const sendRequest = async (): Promise<boolean> => {
    if (!selectedService || !selectedEndpoint) {
      setRequestError('No service or endpoint selected');
      return false;
    }

    // Validate path parameters
    const pathError = validatePathParams(selectedEndpoint.path, requestForm.pathParams);
    if (pathError) {
      setRequestError(pathError);
      return false;
    }

    // Validate JSON body if present
    if (requestForm.body && requestForm.body.trim() !== '') {
      try {
        JSON.parse(requestForm.body);
      } catch {
        setRequestError('Invalid JSON in request body');
        return false;
      }
    }

    setLoading(true);
    setRequestError(null);

    try {
      // Build the proxy request
      const proxyRequest: ProxyRequest = buildProxyRequest(
        selectedService,
        selectedEndpoint.method,
        selectedEndpoint.path,
        requestForm
      );

      // Send the request
      const response = await apiClient.proxyRequest(proxyRequest);

      // Store the response
      setResponse(response);

      // Add to history
      addToHistory({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        service: selectedService,
        method: selectedEndpoint.method,
        path: proxyRequest.path,
        request: proxyRequest,
        response,
        status: response.statusCode,
      });

      setLoading(false);
      return true;
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Request failed');
      setLoading(false);
      return false;
    }
  };

  return {
    sendRequest,
  };
}
