import { useState } from 'react';
import { useAppStore } from '../stores/app-store';
import { RequestBuilder } from './request-builder/RequestBuilder';
import { ResponseViewer } from './response-viewer/ResponseViewer';
import { useProxyRequest } from '../hooks/useProxyRequest';
import { LoadingSpinner } from './shared/LoadingSpinner';
import { ErrorDisplay } from './shared/ErrorDisplay';
import { getHttpStatusBadgeStyles } from '../lib/http-ui';
import { cn } from '../lib/utils';

type TabType = 'request' | 'response';

export function RequestResponseTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('request');
  const { lastResponse, loading, error, setError } = useAppStore();
  const { sendRequest } = useProxyRequest();

  const handleSendRequest = async () => {
    const success = await sendRequest();
    if (success) {
      setActiveTab('response');
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('request')}
            className={`pb-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'request'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            Request Builder
          </button>
          <button
            onClick={() => setActiveTab('response')}
            className={`pb-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'response'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            disabled={!lastResponse}
          >
            Response
            {lastResponse && (
              <span
                className={cn(
                  'ml-2 px-2 py-0.5 text-xs rounded border font-semibold',
                  getHttpStatusBadgeStyles(lastResponse.statusCode)
                )}
              >
                {lastResponse.statusCode}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          message={error}
          onRetry={() => {
            setError(null);
            setActiveTab('request');
          }}
        />
      )}

      {/* Tab Content */}
      <div>
        {activeTab === 'request' && (
          <div className="space-y-6">
            <RequestBuilder />

            {/* Send Button */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Sending...
                  </span>
                ) : (
                  'Send Request'
                )}
              </button>
              {loading && (
                <span className="text-sm text-muted-foreground">
                  Waiting for response...
                </span>
              )}
            </div>
          </div>
        )}

        {activeTab === 'response' && (
          <div>
            {lastResponse ? (
              <ResponseViewer response={lastResponse} />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No response yet. Send a request to see the response here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
