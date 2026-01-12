import type { RequestHistoryEntry } from '../../types/request';
import { cn } from '../../lib/utils';
import { ArrowLeftCircle, Trash2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { HTTP_METHOD_BADGE_STYLES, getHttpStatusTextStyles } from '../../lib/http-ui';

interface HistoryItemProps {
  entry: RequestHistoryEntry;
  onReplay: (entry: RequestHistoryEntry) => void;
  onDelete: (id: string) => void;
}

export function HistoryItem({ entry, onReplay, onDelete }: HistoryItemProps) {
  const [copied, setCopied] = useState(false);

  const methodStyles =
    HTTP_METHOD_BADGE_STYLES[entry.method] || 'bg-muted/40 text-muted-foreground border-border';

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

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await navigator.clipboard?.writeText(entry.path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failures (permissions / insecure context)
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(entry.id);
  };

  return (
    <div
      onClick={() => onReplay(entry)}
      className="w-full text-left p-4 hover:bg-muted/40 transition-all group relative cursor-pointer border-b border-border/40 last:border-0 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] active:scale-[0.98]"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onReplay(entry);
        }
      }}
    >
      <div className="flex items-start gap-4">
        {/* Method Badge */}
        <span
          className={cn(
            "px-2.5 py-1 text-[10px] uppercase font-bold rounded-lg border flex-shrink-0 mt-0.5 tracking-[0.12em] shadow-sm transition-transform group-hover:scale-110",
            methodStyles
          )}
        >
          {entry.method}
        </span>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-foreground truncate">
              {entry.service}
            </span>
            <span
              className={cn(
                'text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md border shadow-sm',
                'bg-muted/40 border-border',
                getHttpStatusTextStyles(entry.status)
              )}
            >
              {entry.status}
            </span>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground truncate opacity-60 group-hover:opacity-100 transition-opacity">
            {entry.path}
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] font-medium text-muted-foreground opacity-70">
              {formatTime(entry.timestamp)}
            </span>
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-muted/60 rounded-lg text-muted-foreground hover:text-primary transition-colors shadow-sm"
                title="Copy path"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-colors shadow-sm"
                title="Delete from history"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <ArrowLeftCircle className="w-3 h-3 text-primary ml-1 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
