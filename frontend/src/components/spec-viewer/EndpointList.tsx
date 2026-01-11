import type { OpenAPISpec, OperationObject } from '../../types/openapi';
import type { HttpMethod } from '../../types/request';
import { useAppStore } from '../../stores/app-store';
import { cn } from '../../lib/utils';
import { HTTP_METHOD_BADGE_STYLES } from '../../lib/http-ui';

interface EndpointListProps {
  spec: OpenAPISpec;
}

interface EndpointItem {
  path: string;
  method: HttpMethod;
  operation: OperationObject;
  summary?: string;
}

export function EndpointList({ spec }: EndpointListProps) {
  const { selectedEndpoint, selectEndpoint } = useAppStore();

  // Parse endpoints from spec
  const endpoints: EndpointItem[] = [];

  if (spec.paths) {
    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      if (!pathItem) return;

      const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

      methods.forEach((method) => {
        const operation = pathItem[method] as OperationObject | undefined;
        if (operation) {
          endpoints.push({
            path,
            method: method.toUpperCase() as HttpMethod,
            operation,
            summary: operation.summary || operation.description,
          });
        }
      });
    });
  }

  if (endpoints.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No endpoints found in this service
      </div>
    );
  }

  return (
    <div className="space-y-0.5 px-2">
      {endpoints.map((endpoint, index) => {
        const isSelected =
          selectedEndpoint?.path === endpoint.path &&
          selectedEndpoint?.method === endpoint.method;

        return (
          <button
            key={`${endpoint.method}-${endpoint.path}-${index}`}
            onClick={() => selectEndpoint(endpoint)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-lg transition-all border",
              isSelected
                ? "bg-card shadow-sm border-border ring-1 ring-ring/10 z-10"
                : "hover:bg-muted/50 border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "px-1.5 py-0.5 text-[10px] uppercase font-bold rounded-md border",
                  HTTP_METHOD_BADGE_STYLES[endpoint.method]
                )}
              >
                {endpoint.method}
              </span>
              <span className="text-sm font-medium font-mono truncate opacity-90">
                {endpoint.path}
              </span>
            </div>
            {endpoint.summary && (
              <div className="mt-1.5 pl-0.5 text-xs text-muted-foreground line-clamp-1 opacity-75 group-hover:opacity-100">
                {endpoint.summary}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
