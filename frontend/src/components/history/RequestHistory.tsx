import { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/app-store';
import { useRequestHistory } from '../../hooks/useRequestHistory';
import { HistoryItem } from './HistoryItem';
import type { RequestHistoryEntry } from '../../types/request';
import { X, Clock, Trash2, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

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

  const groupedHistory = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: Record<string, RequestHistoryEntry[]> = {
      Today: [],
      Yesterday: [],
      Older: [],
    };

    filteredHistory.forEach((entry) => {
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);

      if (entryDate.getTime() === today.getTime()) {
        groups.Today.push(entry);
      } else if (entryDate.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(entry);
      } else {
        groups.Older.push(entry);
      }
    });

    return groups;
  }, [filteredHistory]);

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
        className="fixed inset-0 bg-black/5 dark:bg-black/40 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className="fixed right-4 top-4 bottom-4 w-[26rem] glass-card shadow-2xl z-50 flex flex-col rounded-[2.5rem] overflow-hidden animate-in slide-in-from-right-8 duration-500 ease-out">
        {/* Header */}
        <div className="p-8 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                History
              </h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
                {history.length} request{history.length !== 1 ? 's' : ''} stored
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Area */}
        <div className="px-8 mb-6">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/40 border border-border/50 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-12 animate-in fade-in zoom-in duration-700">
              <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                <Clock className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Clear Skies
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px] mx-auto opacity-70">
                Your request history will appear here once you start executing operations.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-12">
              <p className="text-sm font-semibold text-muted-foreground">No matching fragments</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2 font-black opacity-70">"{searchQuery}"</p>
            </div>
          ) : (
            <div className="pb-8">
              {Object.entries(groupedHistory).map(([group, entries]) => (
                entries.length > 0 && (
                  <div key={group} className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 first:duration-300">
                    <div className="px-4 py-2 sticky top-0 bg-transparent z-10">
                      <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-1">
                        {group}
                      </h3>
                    </div>
                    <div className="mt-2 space-y-1">
                      {entries.map((entry) => (
                        <HistoryItem
                          key={entry.id}
                          entry={entry}
                          onReplay={handleReplay}
                          onDelete={removeEntry}
                        />
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-8 pt-4 border-t border-border/50 mt-auto">
            <button
              onClick={handleClearAll}
              className={cn(
                "w-full px-6 py-3 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-3 overflow-hidden group relative",
                showClearConfirm
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
                  : 'bg-card/40 text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-border/50'
              )}
            >
              <Trash2 className={cn("w-3.5 h-3.5 transition-transform", showClearConfirm && "animate-bounce")} />
              <span className="relative z-10">
                {showClearConfirm ? 'Confirm Purge All' : 'Wipe Console History'}
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
