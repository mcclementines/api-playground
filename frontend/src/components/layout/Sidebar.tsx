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
    <div className="flex flex-col h-full bg-transparent">
      {/* Service Selector */}
      <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <label htmlFor="service-select" className="flex items-center gap-2 ui-kicker font-semibold text-muted-foreground mb-3 ml-1">
          <Layers className="w-3.5 h-3.5 text-primary" />
          Workspace Context
        </label>
        <div className="relative group">
          <select
            id="service-select"
            value={selectedService || ''}
            onChange={(e) => selectService(e.target.value || null)}
            className={cn(
              "w-full appearance-none bg-primary/5 dark:bg-white/5 border border-white/20 dark:border-white/10 text-foreground h-11 px-4 py-2 rounded-lg shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
              "text-sm font-semibold transition-all cursor-pointer group-hover:bg-primary/10 dark:group-hover:bg-white/10"
            )}
          >
            <option value="">Select an API...</option>
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground group-hover:text-primary transition-colors">
            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
        {!selectedService && (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in duration-700">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4 border border-primary/10 shadow-inner">
              <Layers className="w-7 h-7 text-primary/50" />
            </div>
            <p className="text-sm font-bold text-foreground">Awaiting Input</p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Launch your session by selecting a service from the context menu above.
            </p>
          </div>
        )}

        {selectedService && isLoading && (
          <div className="py-20 flex flex-col items-center animate-in fade-in duration-300">
            <LoadingSpinner />
            <p className="ui-kicker font-semibold text-muted-foreground mt-5 animate-pulse">
              Parsing Schema...
            </p>
          </div>
        )}

        {selectedService && !isLoading && spec && (
          <div className="py-4 animate-in fade-in slide-in-from-left-2 duration-500">
            <div className="px-6 py-3 sticky top-0 bg-white/40 dark:bg-muted/20 backdrop-blur-xl z-10 border-b border-white/5 mb-2" style={{ WebkitBackdropFilter: 'blur(20px)' }}>
              <h2 className="ui-kicker-strong font-bold text-muted-foreground">
                Available Operations
              </h2>
            </div>
            <div className="px-2">
              <EndpointList spec={spec} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
