import type { ParameterObject, SchemaObject } from '../../types/openapi';
import { validateParameter } from '../../lib/openapi-parser';

interface ParameterFormProps {
  parameters: ParameterObject[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  label: string;
}

export function ParameterForm({ parameters, values, onChange, label }: ParameterFormProps) {
  if (parameters.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      <div className="space-y-3">
        {parameters.map((param) => {
          const value = values[param.name] || '';
          const error = validateParameter(param, value);
          const schema = param.schema as SchemaObject | undefined;

          return (
            <div key={param.name}>
              <label
                htmlFor={`param-${param.name}`}
                className="block text-sm font-medium text-foreground mb-1"
              >
                {param.name}
                {param.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {schema?.enum ? (
                // Render select for enum values
                <select
                  id={`param-${param.name}`}
                  value={value}
                  onChange={(e) => onChange(param.name, e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 bg-card text-foreground"
                >
                  <option value="">Select...</option>
                  {schema.enum.map((option) => (
                    <option key={String(option)} value={String(option)}>
                      {String(option)}
                    </option>
                  ))}
                </select>
              ) : schema?.type === 'boolean' ? (
                // Render checkbox for boolean
                <select
                  id={`param-${param.name}`}
                  value={value}
                  onChange={(e) => onChange(param.name, e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 bg-card text-foreground"
                >
                  <option value="">Select...</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (
                // Render text input for other types
                <input
                  id={`param-${param.name}`}
                  type={schema?.type === 'number' || schema?.type === 'integer' ? 'number' : 'text'}
                  value={value}
                  onChange={(e) => onChange(param.name, e.target.value)}
                  placeholder={param.description || `Enter ${param.name}`}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 bg-card text-foreground ${
                    error ? 'border-red-300' : 'border-border'
                  }`}
                />
              )}

              {param.description && !error && (
                <p className="mt-1 text-xs text-muted-foreground">{param.description}</p>
              )}

              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
