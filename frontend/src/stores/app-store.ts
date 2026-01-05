import { create } from 'zustand';
import type { OpenAPISpec, EndpointSelection } from '../types/openapi';
import type { RequestFormState, RequestHistoryEntry, ProxyResponse, HttpMethod } from '../types/request';

interface AppState {
  // Services & Specs
  services: string[];
  specs: Record<string, OpenAPISpec>;
  selectedService: string | null;
  selectedEndpoint: EndpointSelection | null;

  // Request Form State
  requestForm: RequestFormState;

  // Response State
  lastResponse: ProxyResponse | null;
  loading: boolean;
  error: string | null;

  // History (max 50 entries)
  history: RequestHistoryEntry[];

  // Actions
  setServices: (services: string[]) => void;
  setSpec: (service: string, spec: OpenAPISpec) => void;
  selectService: (service: string | null) => void;
  selectEndpoint: (endpoint: EndpointSelection | null) => void;
  updateRequestForm: (form: Partial<RequestFormState>) => void;
  resetRequestForm: () => void;
  setResponse: (response: ProxyResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addToHistory: (entry: RequestHistoryEntry) => void;
  loadFromHistory: (entry: RequestHistoryEntry) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}

const initialRequestForm: RequestFormState = {
  pathParams: {},
  queryParams: {},
  headers: {},
  body: '',
};

export const useAppStore = create<AppState>((set) => ({
  // Initial State
  services: [],
  specs: {},
  selectedService: null,
  selectedEndpoint: null,
  requestForm: initialRequestForm,
  lastResponse: null,
  loading: false,
  error: null,
  history: [],

  // Actions
  setServices: (services) => set({ services }),

  setSpec: (service, spec) =>
    set((state) => ({
      specs: { ...state.specs, [service]: spec },
    })),

  selectService: (service) =>
    set({
      selectedService: service,
      selectedEndpoint: null, // Reset endpoint when service changes
      requestForm: initialRequestForm,
      lastResponse: null,
      error: null,
    }),

  selectEndpoint: (endpoint) =>
    set({
      selectedEndpoint: endpoint,
      requestForm: initialRequestForm, // Reset form when endpoint changes
      lastResponse: null,
      error: null,
    }),

  updateRequestForm: (form) =>
    set((state) => ({
      requestForm: { ...state.requestForm, ...form },
    })),

  resetRequestForm: () => set({ requestForm: initialRequestForm }),

  setResponse: (response) => set({ lastResponse: response }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  addToHistory: (entry) =>
    set((state) => {
      const newHistory = [entry, ...state.history];
      // Keep max 50 entries (FIFO)
      if (newHistory.length > 50) {
        newHistory.pop();
      }
      return { history: newHistory };
    }),

  loadFromHistory: (entry: RequestHistoryEntry) => {
    const { specs } = useAppStore.getState();
    const spec = specs[entry.service];
    let selectedEndpoint: EndpointSelection | null = null;
    const pathParams: Record<string, string> = {};

    if (spec && spec.paths) {
      // Find matching endpoint
      for (const [pathTemplate, operations] of Object.entries(spec.paths)) {
        if (operations && typeof operations === 'object') {
          const operation = (operations as any)[entry.method.toLowerCase()];
          if (operation) {
            // Create regex for matching and parameter extraction
            // e.g., /posts/{id} -> /posts/([^/]+)
            const paramNames: string[] = [];
            const normalizedTemplate = pathTemplate.replace(/\{([^}]+)\}/g, (_, paramName) => {
              paramNames.push(paramName);
              return '([^/]+)';
            });
            const regex = new RegExp(`^${normalizedTemplate}$`);

            // The entry.path might have query params, strip them for matching
            const pathOnly = entry.path.split('?')[0];

            const match = pathOnly.match(regex);
            if (match) {
              selectedEndpoint = {
                path: pathTemplate,
                method: entry.method as HttpMethod,
                operation: operation as any
              };

              // Extract path parameters
              paramNames.forEach((name, index) => {
                pathParams[name] = match[index + 1];
              });
              break;
            }
          }
        }
      }
    }

    // Parse query params from history entry
    const queryParams: Record<string, string> = {};
    try {
      // Use entry.path (which includes query params) or entry.request.path if available
      const fullPath = entry.request.path || entry.path;
      const url = new URL(fullPath, 'http://dummy.com');
      url.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });
    } catch (e) {
      console.warn('Failed to parse query params from history entry path', e);
    }

    set({
      selectedService: entry.service,
      selectedEndpoint,
      requestForm: {
        pathParams,
        queryParams,
        headers: entry.request.headers || {},
        body: entry.request.body ? JSON.stringify(entry.request.body, null, 2) : '',
      },
      lastResponse: entry.response,
      error: null,
    });
  },

  removeFromHistory: (id) =>
    set((state) => ({
      history: state.history.filter((item) => item.id !== id),
    })),

  clearHistory: () => set({ history: [] }),
}));
