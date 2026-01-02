import type { RequestHistoryEntry } from '../../types/request';
import { cn } from '../../lib/utils';
import { ArrowLeftCircle } from 'lucide-react';

interface HistoryItemProps {
  entry: RequestHistoryEntry;
  onReplay: (entry: RequestHistoryEntry) => void;
}

const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  POST: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900',
  PUT: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900',
  PATCH: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900',
  DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900',
};

export function HistoryItem({ entry, onReplay }: HistoryItemProps) {
  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400';
    if (status >= 300 && status < 400) return 'text-blue-600 dark:text-blue-400';
    if (status >= 400 && status < 500) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <button
      onClick={() => onReplay(entry)}
      className="w-full text-left p-3 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-start gap-3">
        {/* Method Badge */}
        <span
          className={cn(
            "px-2 py-0.5 text-[10px] uppercase font-bold rounded-md border flex-shrink-0 mt-0.5",
            METHOD_STYLES[entry.method] || 'bg-gray-500/10 text-gray-600 border-gray-200'
          )}
        >
          {entry.method}
        </span>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground truncate">
              {entry.service}
            </span>
            <span className={`text-xs font-bold font-mono ${getStatusColor(entry.status)}`}>
              {entry.status}
            </span>
          </div>
          <div className="text-xs font-mono text-muted-foreground truncate mt-1">
            {entry.path}
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              {formatTime(entry.timestamp)}
            </span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowLeftCircle className="w-3.5 h-3.5 text-brand-500" />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
