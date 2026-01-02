import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/app-store';
import { RequestBuilder } from './request-builder/RequestBuilder';
import { ResponseViewer } from './response-viewer/ResponseViewer';
import { useProxyRequest } from '../hooks/useProxyRequest';
import { LoadingSpinner } from './shared/LoadingSpinner';
import { ErrorDisplay } from './shared/ErrorDisplay';

type TabType = 'request' | 'response';

export function RequestResponseTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('request');
  const { lastResponse, loading, error, setError } = useAppStore();
  const { sendRequest } = useProxyRequest();

  // Auto-switch to response tab when response is received
  useEffect(() => {
    if (lastResponse) {
      setActiveTab('response');
    }
  }, [lastResponse]);

  const handleSendRequest = async () => {
    const success = await sendRequest();
    if (success) {
      // Tab will auto-switch due to useEffect above
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('request')}
            className={`pb-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'request'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Request Builder
          </button>
          <button
            onClick={() => setActiveTab('response')}
            className={`pb-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'response'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            disabled={!lastResponse}
          >
            Response
            {lastResponse && (
              <span
                className={`ml-2 px-2 py-0.5 text-xs rounded ${
                  lastResponse.statusCode >= 200 && lastResponse.statusCode < 300
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
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
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                <span className="text-sm text-gray-500">
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
                <p className="text-gray-500">No response yet. Send a request to see the response here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
