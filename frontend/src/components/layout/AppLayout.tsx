import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAppStore } from '../../stores/app-store';
import { useServices } from '../../hooks/useServices';
import { useRequestHistory } from '../../hooks/useRequestHistory';
import { Sidebar } from './Sidebar';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorDisplay } from '../shared/ErrorDisplay';
import { RequestHistory } from '../history/RequestHistory';
import { ThemeToggle } from '../shared/ThemeToggle';
import { Clock, Rocket } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { loading, appError } = useAppStore();
  const { services } = useServices();
  const { history } = useRequestHistory();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <div className="h-screen bg-background bg-gradient-mesh text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-foreground">
      {/* Header */}
      <header className="h-16 border-b border-border/40 bg-white/40 dark:bg-muted/20 backdrop-blur-2xl flex items-center justify-between px-6 z-50 overflow-hidden" style={{ WebkitBackdropFilter: 'blur(40px)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl shadow-lg shadow-primary/20 ring-1 ring-primary/20">
            <Rocket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">
              API Playground
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              v1.0.0 • Developer Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-foreground bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-white/20 dark:border-white/10 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Clock className="w-4 h-4 text-primary" />
            <span>History</span>
            {history.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-lg shadow-sm">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar Container */}
        <aside className="w-80 bg-white/30 dark:bg-muted/20 backdrop-blur-xl border-r border-border/40 flex flex-col z-40" style={{ WebkitBackdropFilter: 'blur(24px)' }}>
          {loading && services.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <LoadingSpinner />
              <p className="text-sm font-medium text-muted-foreground mt-4 animate-pulse">Initializing services...</p>
            </div>
          ) : appError ? (
            <div className="p-6">
              <ErrorDisplay message={appError} />
            </div>
          ) : (
            <Sidebar services={services} />
          )}
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
            <div className="min-h-full p-8 max-w-7xl mx-auto">
              {children}
            </div>
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
