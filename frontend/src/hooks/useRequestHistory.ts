import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/app-store';
import { loadHistory, saveHistory, clearHistory as clearStoredHistory } from '../lib/storage';

/**
 * Hook to manage request history with localStorage persistence
 */
export function useRequestHistory() {
  const { history, clearHistory: clearStoreHistory } = useAppStore();
  const hasLoadedRef = useRef(false);

  // Load history from localStorage on mount (only once)
  useEffect(() => {
    if (!hasLoadedRef.current) {
      const storedHistory = loadHistory();
      if (storedHistory.length > 0) {
        // Set the entire history at once instead of adding one by one
        useAppStore.setState({ history: storedHistory });
      }
      hasLoadedRef.current = true;
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (hasLoadedRef.current && history.length > 0) {
      saveHistory(history);
    }
  }, [history]);

  const clearAll = () => {
    clearStoreHistory();
    clearStoredHistory();
  };

  return {
    history,
    clearAll,
  };
}
