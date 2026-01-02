import { useMemo } from 'react';
import { buildProxyRequest } from '../../lib/request-builder';
import type { RequestFormState } from '../../types/request';
import type { OpenAPISpecWithProxy } from '../../types/openapi';
import { useAppStore } from '../../stores/app-store';

interface PayloadPreviewProps {
  service: string;
  method: string;
  path: string;
  formState: RequestFormState;
}

export function PayloadPreview({ service, method, path, formState }: PayloadPreviewProps) {
  const { specs } = useAppStore();
  const spec = specs[service] as OpenAPISpecWithProxy | undefined;

  const requestDetails = useMemo(() => {
    const proxyRequest = buildProxyRequest(service, method, path, formState);

    // Get the actual API base URL from the spec
    const baseURL = spec?.['x-proxy-config']?.baseURL || 'unknown';
    const fullURL = `${baseURL}${proxyRequest.path}`;

    return {
      method: proxyRequest.method,
      url: fullURL,
      headers: proxyRequest.headers || {},
      body: proxyRequest.body,
    };
  }, [service, method, path, formState, spec]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Request Preview</h3>
      <div className="border border-gray-300 rounded-md p-3 bg-gray-50 font-mono text-xs space-y-2">
        {/* Request Line */}
        <div>
          <span className="font-semibold text-blue-700">{requestDetails.method}</span>{' '}
          <span className="text-gray-700">{requestDetails.url}</span>
        </div>

        {/* Headers */}
        {Object.keys(requestDetails.headers).length > 0 && (
          <div className="pt-2 border-t border-gray-300">
            <div className="text-gray-500 mb-1">Headers:</div>
            {Object.entries(requestDetails.headers).map(([key, value]) => (
              <div key={key} className="text-gray-700">
                <span className="text-purple-700">{key}:</span> {value}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        {requestDetails.body && (
          <div className="pt-2 border-t border-gray-300">
            <div className="text-gray-500 mb-1">Body:</div>
            <pre className="text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(requestDetails.body, null, 2)}
            </pre>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500">
        This request will be sent to the {spec?.info?.title || service} API
      </p>
    </div>
  );
}
