import { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/app-store';
import { useRequestHistory } from '../../hooks/useRequestHistory';
import { HistoryItem } from './HistoryItem';
import type { RequestHistoryEntry } from '../../types/request';
import { X, Clock, Trash2, Search } from 'lucide-react';

interface RequestHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestHistory({ isOpen, onClose }: RequestHistoryProps) {
  const { history, clearAll, removeEntry } = useRequestHistory();
  const { loadFromHistory } = useAppStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const query = searchQuery.toLowerCase();
    return history.filter(
      (entry) =>
        entry.service.toLowerCase().includes(query) ||
        entry.method.toLowerCase().includes(query) ||
        entry.path.toLowerCase().includes(query)
    );
  }, [history, searchQuery]);

  const handleReplay = (entry: RequestHistoryEntry) => {
    loadFromHistory(entry);
    onClose();
  };

  const handleClearAll = () => {
    if (showClearConfirm) {
      clearAll();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Request History
              </h2>
              <p className="text-xs text-muted-foreground">
                {history.length} {history.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-md py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 transition-shadow"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground">
                No history yet
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Send a request to see it here. History is saved locally.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <p className="text-sm text-muted-foreground">No matches found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredHistory.map((entry) => (
                <HistoryItem
                  key={entry.id}
                  entry={entry}
                  onReplay={handleReplay}
                  onDelete={removeEntry}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-border bg-muted/20">
            <button
              onClick={handleClearAll}
              className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${showClearConfirm
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
            >
              <Trash2 className="w-4 h-4" />
              {showClearConfirm ? 'Confirm Clear All' : 'Clear All History'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
