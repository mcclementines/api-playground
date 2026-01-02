import { useAppStore } from '../stores/app-store';
import { RequestResponseTabs } from './RequestResponseTabs';

export function MainContent() {
  const { selectedService, selectedEndpoint } = useAppStore();

  if (!selectedService) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No API selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select an API from the sidebar to start testing
          </p>
        </div>
      </div>
    );
  }

  if (!selectedEndpoint) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No endpoint selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select an endpoint from the list to start building a request
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <RequestResponseTabs />
      </div>
    </div>
  );
}
