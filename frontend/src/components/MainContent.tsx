import { useAppStore } from '../stores/app-store';
import { RequestResponseTabs } from './RequestResponseTabs';

export function MainContent() {
  const { selectedService, selectedEndpoint } = useAppStore();

  if (!selectedService) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
          <div className="relative w-24 h-24 bg-white dark:bg-card border border-border flex items-center justify-center shadow-xl rotate-3 rounded-3xl">
            <svg className="w-12 h-12 text-primary drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-foreground mb-3">
          Initialize your Workspace
        </h3>
        <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Select a service from the sidebar to begin exploring endpoints and testing your APIs.
        </p>
      </div>
    );
  }

  if (!selectedEndpoint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
          <div className="relative w-24 h-24 bg-white dark:bg-card border border-border flex items-center justify-center shadow-xl -rotate-3 rounded-3xl">
            <svg className="w-12 h-12 text-primary drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-foreground mb-3">
          Select an Endpoint
        </h3>
        <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Choose an operation from the list to populate the request builder and start your execution.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
        <RequestResponseTabs />
      </div>
    </div>
  );
}
