import { useState } from 'react';

interface QueryParamsEditorProps {
  params: Record<string, string>;
  onChange: (params: Record<string, string>) => void;
}

export function QueryParamsEditor({ params, onChange }: QueryParamsEditorProps) {
  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const paramEntries = Object.entries(params);

  const handleAdd = () => {
    if (newKey.trim() && newValue.trim()) {
      onChange({ ...params, [newKey.trim()]: newValue.trim() });
      setNewKey('');
      setNewValue('');
      setShowForm(false);
    }
  };

  const handleRemove = (key: string) => {
    const newParams = { ...params };
    delete newParams[key];
    onChange(newParams);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Query Parameters</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-primary hover:text-primary/90 font-medium"
          >
            + Add Parameter
          </button>
        )}
      </div>

      {/* Existing params */}
      {paramEntries.length > 0 && (
        <div className="space-y-2">
          {paramEntries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded border border-border"
            >
              <span className="text-sm font-mono text-foreground flex-1 truncate">
                {key}={value}
              </span>
              <button
                onClick={() => handleRemove(key)}
                className="text-red-500 hover:text-red-700 text-sm"
                title="Remove parameter"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add param form */}
      {showForm && (
        <div className="border border-border rounded-md p-3 space-y-2 bg-card">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Parameter name"
              className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 bg-card text-foreground"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setShowForm(false);
              }}
            />
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Parameter value"
              className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 bg-card text-foreground"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setShowForm(false);
              }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newKey.trim() || !newValue.trim()}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setNewKey('');
                setNewValue('');
              }}
              className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded hover:bg-muted/70"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {paramEntries.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground">No additional query parameters</p>
      )}
    </div>
  );
}
