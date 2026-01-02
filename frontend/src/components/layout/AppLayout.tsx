import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAppStore } from '../../stores/app-store';
import { useServices } from '../../hooks/useServices';
import { useRequestHistory } from '../../hooks/useRequestHistory';
import { Sidebar } from './Sidebar';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorDisplay } from '../shared/ErrorDisplay';
import { RequestHistory } from '../history/RequestHistory';
import { Clock, Rocket } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { loading, error } = useAppStore();
  const { services } = useServices();
  const { history } = useRequestHistory();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <div className="h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-500/10 rounded-lg">
            <Rocket className="w-5 h-5 text-brand-500" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">
            API Playground
          </h1>
        </div>

        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"
        >
          <Clock className="w-4 h-4" />
          <span>History</span>
          {history.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-brand-500/10 text-brand-500 rounded-full">
              {history.length}
            </span>
          )}
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar Container */}
        <aside className="w-72 bg-muted/30 border-r border-border flex flex-col z-40">
          {loading && services.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <LoadingSpinner />
              <p className="text-sm text-muted-foreground mt-2">Loading services...</p>
            </div>
          ) : error ? (
            <div className="p-4">
              <ErrorDisplay message={error} />
            </div>
          ) : (
            <Sidebar services={services} />
          )}
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative bg-background">
          <div className="absolute inset-0 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>

      {/* History Slide-over */}
      <RequestHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
