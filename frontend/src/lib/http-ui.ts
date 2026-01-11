import type { HttpMethod } from '../types/request';

export const HTTP_METHOD_BADGE_STYLES: Record<HttpMethod, string> = {
  GET: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60',
  POST: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/60',
  PUT: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60',
  PATCH: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900/60',
  DELETE: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60',
  HEAD: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800',
  OPTIONS: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60',
};

export function getHttpStatusBadgeStyles(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) {
    return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/60';
  }
  if (statusCode >= 300 && statusCode < 400) {
    return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';
  }
  if (statusCode >= 400 && statusCode < 500) {
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
  }
  return 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60';
}

export function getHttpStatusTextStyles(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return 'text-green-600 dark:text-green-400';
  if (statusCode >= 300 && statusCode < 400) return 'text-blue-600 dark:text-blue-400';
  if (statusCode >= 400 && statusCode < 500) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

