import { useMemo } from 'react';
import { buildProxyRequest } from '../../lib/request-builder';
import type { HttpMethod, RequestFormState } from '../../types/request';
import type { OpenAPISpecWithProxy } from '../../types/openapi';
import { useAppStore } from '../../stores/app-store';

interface PayloadPreviewProps {
  service: string;
  method: HttpMethod;
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

    const headers: Record<string, string> = proxyRequest.headers ?? {};

    return {
      method: proxyRequest.method,
      url: fullURL,
      headers,
      body: proxyRequest.body,
    };
  }, [service, method, path, formState, spec]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Request Preview</h3>
      <div className="border border-border rounded-md p-3 bg-muted/30 font-mono text-xs space-y-2">
        {/* Request Line */}
        <div>
          <span className="font-semibold text-primary">{requestDetails.method}</span>{' '}
          <span className="text-foreground">{requestDetails.url}</span>
        </div>

        {/* Headers */}
        {Object.keys(requestDetails.headers).length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="text-muted-foreground mb-1">Headers:</div>
            {Object.entries(requestDetails.headers).map(([key, value]) => (
              <div key={key} className="text-foreground">
                <span className="text-muted-foreground">{key}:</span> {value}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        {requestDetails.body !== undefined && requestDetails.body !== null && (
          <div className="pt-2 border-t border-border">
            <div className="text-muted-foreground mb-1">Body:</div>
            <pre className="text-foreground whitespace-pre-wrap">
              {JSON.stringify(requestDetails.body, null, 2)}
            </pre>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        This request will be sent to the {spec?.info?.title || service} API
      </p>
    </div>
  );
}
