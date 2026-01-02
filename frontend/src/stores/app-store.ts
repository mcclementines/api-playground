import { create } from 'zustand';
import type { OpenAPISpec, EndpointSelection } from '../types/openapi';
import type { RequestFormState, RequestHistoryEntry, ProxyResponse } from '../types/request';

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

  loadFromHistory: (entry) => {

    // Parse request form from history entry
    const url = new URL(entry.request.path, 'http://dummy.com');
    const pathParams: Record<string, string> = {};
    const queryParams: Record<string, string> = {};

    // Extract query params from path
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // TODO: Extract path params - for now we'll just use the path as-is
    // This is a limitation - we'd need to match against the OpenAPI spec
    // to properly extract path params

    set({
      selectedService: entry.service,
      requestForm: {
        pathParams,
        queryParams,
        headers: entry.request.headers || {},
        body: entry.request.body ? JSON.stringify(entry.request.body, null, 2) : '',
      },
      lastResponse: entry.response,
    });

    // Note: We don't set selectedEndpoint here because we'd need to
    // find it from the spec, which requires async logic
    // This can be enhanced in a hook
  },

  clearHistory: () => set({ history: [] }),
}));
