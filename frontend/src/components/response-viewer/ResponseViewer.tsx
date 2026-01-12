import { useState } from 'react';
import type { ProxyResponse } from '../../types/request';
import { PrettyDisplay } from './PrettyDisplay';
import { RawJsonView } from './RawJsonView';
import { Eye, Code, ArrowUpRight, Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getHttpStatusBadgeStyles } from '../../lib/http-ui';

interface ResponseViewerProps {
  response: ProxyResponse;
}

export function ResponseViewer({ response }: ResponseViewerProps) {
  const [viewMode, setViewMode] = useState<'pretty' | 'raw'>('pretty');
  const [showHeaders, setShowHeaders] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusText = response.statusCode >= 200 && response.statusCode < 300 ? 'Success' : 'Error';

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(response.body, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "px-3 py-1.5 rounded-md border font-bold text-sm flex items-center gap-2",
              getHttpStatusBadgeStyles(response.statusCode)
            )}
          >
            <span className="text-lg leading-none mb-0.5">●</span>
            <span>{response.statusCode} {statusText}</span>
          </div>

          <div className="h-6 w-px bg-border/50" />

          <button
            onClick={() => setShowHeaders(!showHeaders)}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium transition-colors px-2 py-1 rounded-md",
              showHeaders
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            {showHeaders ? 'Hide Headers' : 'View Headers'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            title="Copy Response"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Response Headers */}
      {showHeaders && (
        <div className="bg-muted/30 border border-border rounded-lg p-4 font-mono text-xs overflow-x-auto animate-in fade-in slide-in-from-top-2">
          <h3 className="ui-kicker font-semibold text-muted-foreground mb-3">Response Headers</h3>
          <div className="space-y-1.5">
            {Object.entries(response.headers).map(([key, values]) => (
              <div key={key} className="flex gap-4 group">
                <span className="text-muted-foreground font-semibold min-w-[120px]">{key}:</span>
                <span className="text-foreground break-all">{values.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="space-y-4">
        <div className="flex items-center border-b border-border">
          <button
            onClick={() => setViewMode('pretty')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              viewMode === 'pretty'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Code className="w-4 h-4" />
            Pretty
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              viewMode === 'raw'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <ArrowUpRight className="w-4 h-4" />
            Raw JSON
          </button>
        </div>

        {/* Response Body */}
        <div className="bg-card border border-border rounded-lg overflow-hidden min-h-[300px] shadow-sm">
          {viewMode === 'pretty' ? (
            <PrettyDisplay data={response.body} />
          ) : (
            <div className="p-4">
              <RawJsonView data={response.body} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
