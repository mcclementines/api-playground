import type { RequestHistoryEntry } from '../types/request';

const HISTORY_KEY = 'api-playground-history';
const SPECS_CACHE_KEY = 'api-playground-specs-cache';
const MAX_HISTORY_ENTRIES = 50;

/**
 * Save request history to localStorage
 */
export function saveHistory(history: RequestHistoryEntry[]): void {
  try {
    // Keep only the last MAX_HISTORY_ENTRIES
    const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save history to localStorage:', error);
  }
}

/**
 * Load request history from localStorage
 */
export function loadHistory(): RequestHistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored) as RequestHistoryEntry[];
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error('Failed to load history from localStorage:', error);
    return [];
  }
}

/**
 * Clear request history from localStorage
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear history from localStorage:', error);
  }
}

/**
 * Save specs cache to localStorage with timestamp
 */
export function saveSpecsCache(specs: Record<string, unknown>): void {
  try {
    const cache = {
      timestamp: Date.now(),
      specs,
    };
    localStorage.setItem(SPECS_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to save specs cache to localStorage:', error);
  }
}

/**
 * Load specs cache from localStorage (24h TTL)
 */
export function loadSpecsCache(): Record<string, unknown> | null {
  try {
    const stored = localStorage.getItem(SPECS_CACHE_KEY);
    if (!stored) return null;

    const cache = JSON.parse(stored);
    const age = Date.now() - cache.timestamp;
    const TTL = 24 * 60 * 60 * 1000; // 24 hours

    if (age > TTL) {
      localStorage.removeItem(SPECS_CACHE_KEY);
      return null;
    }

    return cache.specs;
  } catch (error) {
    console.error('Failed to load specs cache from localStorage:', error);
    return null;
  }
}
