import { useEffect } from 'react';
import { useAppStore } from '../../stores/app-store';
import { parseParameters, parseRequestBodySchema } from '../../lib/openapi-parser';
import { extractPathParams } from '../../lib/request-builder';
import { ParameterForm } from './ParameterForm';
import { HeadersEditor } from './HeadersEditor';
import { BodyEditor } from './BodyEditor';
import { BodySchemaForm } from './BodySchemaForm';
import { PayloadPreview } from './PayloadPreview';
import { Box, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { HttpMethod } from '../../types/request';

const METHOD_BADGES: Record<HttpMethod, string> = {
  GET: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  POST: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900',
  PUT: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900',
  PATCH: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900',
  DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900',
  HEAD: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800',
  OPTIONS: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
};

export function RequestBuilder() {
  const {
    selectedService,
    selectedEndpoint,
    requestForm,
    updateRequestForm,
    resetRequestForm,
  } = useAppStore();

  // Reset form when endpoint changes
  useEffect(() => {
    if (selectedEndpoint) {
      resetRequestForm();

      // Initialize path params with empty values
      const pathParamNames = extractPathParams(selectedEndpoint.path);
      const initialPathParams: Record<string, string> = {};
      pathParamNames.forEach((name) => {
        initialPathParams[name] = '';
      });
      updateRequestForm({ pathParams: initialPathParams });
    }
  }, [selectedEndpoint?.path, selectedEndpoint?.method]);

  if (!selectedService || !selectedEndpoint) {
    return null;
  }

  const { operation } = selectedEndpoint;
  const { pathParams, queryParams } = parseParameters(operation);

  // Determine if body editor should be shown
  const showBodyEditor =
    selectedEndpoint.method === 'POST' ||
    selectedEndpoint.method === 'PUT' ||
    selectedEndpoint.method === 'PATCH';

  // Get request body schema if available
  let bodySchema = null;
  if (showBodyEditor) {
    try {
      bodySchema = parseRequestBodySchema(operation);
    } catch (error) {
      console.error('Error parsing request body schema:', error);
    }
  }

  const { specs } = useAppStore();
  const spec = specs[selectedService] as any;
  const baseURL = spec?.['x-proxy-config']?.baseURL || '';
  const apiTitle = spec?.info?.title || selectedService;

  return (
    <div className="space-y-8 pb-10">
      {/* API Info Banner */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm flex items-start gap-3">
        <div className="p-2 bg-brand-500/10 rounded-full mt-0.5">
          <Box className="w-4 h-4 text-brand-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">{apiTitle}</h3>
            {baseURL && (
              <a
                href={baseURL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand-500 transition-colors"
              >
                {baseURL}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Build and send requests to this service. Responses will be proxied through the backend.
          </p>
        </div>
      </div>

      {/* Endpoint Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span
            className={cn(
              "px-3 py-1 text-sm font-bold rounded-md border shadow-sm",
              METHOD_BADGES[selectedEndpoint.method]
            )}
          >
            {selectedEndpoint.method}
          </span>
          <h2 className="text-xl font-mono font-medium text-foreground tracking-tight break-all">
            {selectedEndpoint.path}
          </h2>
        </div>

        {operation.summary && (
          <p className="text-base text-foreground/80 leading-relaxed max-w-2xl">{operation.summary}</p>
        )}

        {operation.description && (
          <div className="mt-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-border/50">
            {operation.description}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Path Parameters */}
          {pathParams.length > 0 && (
            <section className="bg-card rounded-lg border border-border p-5 shadow-sm">
              <ParameterForm
                parameters={pathParams}
                values={requestForm.pathParams}
                onChange={(name, value) =>
                  updateRequestForm({
                    pathParams: { ...requestForm.pathParams, [name]: value },
                  })
                }
                label="Path Parameters"
              />
            </section>
          )}

          {/* Query Parameters */}
          {queryParams.length > 0 && (
            <section className="bg-card rounded-lg border border-border p-5 shadow-sm">
              <ParameterForm
                parameters={queryParams}
                values={requestForm.queryParams}
                onChange={(name, value) =>
                  updateRequestForm({
                    queryParams: { ...requestForm.queryParams, [name]: value },
                  })
                }
                label="Query Parameters"
              />
            </section>
          )}

          {/* Headers */}
          <section className="bg-card rounded-lg border border-border p-5 shadow-sm">
            <HeadersEditor
              headers={requestForm.headers}
              onChange={(headers) => updateRequestForm({ headers })}
            />
          </section>

          {/* Request Body */}
          {showBodyEditor && (
            <section className="bg-card rounded-lg border border-border p-5 shadow-sm">
              {bodySchema ? (
                <BodySchemaForm
                  schema={bodySchema}
                  value={requestForm.body}
                  onChange={(body) => updateRequestForm({ body })}
                />
              ) : (
                <BodyEditor
                  value={requestForm.body}
                  onChange={(body) => updateRequestForm({ body })}
                />
              )}
            </section>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 h-fit">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Request Preview
          </h3>
          {/* Payload Preview */}
          <PayloadPreview
            service={selectedService}
            method={selectedEndpoint.method}
            path={selectedEndpoint.path}
            formState={requestForm}
          />
        </div>
      </div>
    </div>
  );
}
