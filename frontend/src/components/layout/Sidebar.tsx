import { useAppStore } from '../../stores/app-store';
import { useOpenApiSpec } from '../../hooks/useOpenApiSpec';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EndpointList } from '../spec-viewer/EndpointList';
import { Layers } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  services: string[];
}

export function Sidebar({ services }: SidebarProps) {
  const { selectedService, selectService } = useAppStore();
  const { spec, isLoading } = useOpenApiSpec(selectedService);

  return (
    <div className="flex flex-col h-full bg-muted/5">
      {/* Service Selector */}
      <div className="p-4 border-b border-border bg-card/50">
        <label htmlFor="service-select" className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          <Layers className="w-3.5 h-3.5" />
          Available Services
        </label>
        <div className="relative">
          <select
            id="service-select"
            value={selectedService || ''}
            onChange={(e) => selectService(e.target.value || null)}
            className={cn(
              "w-full appearance-none bg-background border border-input text-foreground h-9 px-3 py-1 rounded-md shadow-sm",
              "focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring",
              "text-sm transition-colors cursor-pointer"
            )}
          >
            <option value="">Select a service...</option>
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="flex-1 overflow-y-auto w-full">
        {!selectedService && (
          <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Layers className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No Service Selected</p>
            <p className="text-xs text-muted-foreground mt-1">
              Choose an API service from the dropdown above to view its endpoints.
            </p>
          </div>
        )}

        {selectedService && isLoading && (
          <div className="py-12 flex flex-col items-center">
            <LoadingSpinner />
            <p className="text-xs text-muted-foreground mt-3 animate-pulse">
              Fetching OpenAPI spec...
            </p>
          </div>
        )}

        {selectedService && !isLoading && spec && (
          <div className="py-2">
            <div className="px-4 py-2 sticky top-0 bg-muted/5 backdrop-blur-sm z-10">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Endpoints
              </h2>
            </div>
            <div className="mt-1">
              <EndpointList spec={spec} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
