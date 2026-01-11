import { useState, useEffect } from 'react';
import type { SchemaObject } from '../../types/openapi';
import {
  getSchemaFields,
  buildDefaultFromSchema,
  setValueByPath,
  getValueByPath,
  validateSchemaValue,
} from '../../lib/schema-form-builder';

interface BodySchemaFormProps {
  schema: SchemaObject;
  value: string; // JSON string
  onChange: (value: string) => void;
}

export function BodySchemaForm({ schema, value, onChange }: BodySchemaFormProps) {
  const [formData, setFormData] = useState<any>(() => {
    try {
      return value ? JSON.parse(value) : buildDefaultFromSchema(schema);
    } catch (error) {
      console.error('Error parsing initial value:', error);
      return buildDefaultFromSchema(schema);
    }
  });

  const [showJson, setShowJson] = useState(false);

  // Get all form fields from schema
  let fields: ReturnType<typeof getSchemaFields> = [];
  try {
    fields = getSchemaFields(schema);
  } catch (error) {
    console.error('Error parsing schema fields:', error, schema);
  }

  // Update parent when form data changes
  useEffect(() => {
    const jsonString = JSON.stringify(formData, null, 2);
    onChange(jsonString);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]); // Only re-run when formData changes, not when onChange changes

  const handleFieldChange = (path: string, newValue: any, fieldSchema: SchemaObject) => {
    let processedValue = newValue;

    // Convert to appropriate type
    if (fieldSchema.type === 'number' || fieldSchema.type === 'integer') {
      processedValue = newValue === '' ? '' : Number(newValue);
    } else if (fieldSchema.type === 'boolean') {
      processedValue = newValue === 'true';
    }

    setFormData((prev: any) => setValueByPath(prev, path, processedValue));
  };

  // Safeguard: If there's any error state, fallback to simple message
  if (!schema) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Request Body</h3>
        <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-md border border-border">
          No request body schema available
        </div>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Request Body</h3>
        <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-md border border-border">
          No body schema defined for this endpoint
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Request Body</h3>
        <button
          onClick={() => setShowJson(!showJson)}
          className="text-xs text-primary hover:text-primary/90 font-medium"
        >
          {showJson ? 'Show Form' : 'Show JSON'}
        </button>
      </div>

      {showJson ? (
        <div className="border border-border rounded-md p-3 bg-muted/30 overflow-x-auto">
          <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="space-y-3 border border-border rounded-md p-4 bg-card">
          {fields.map((field) => {
            const currentValue = getValueByPath(formData, field.path);
            const error = validateSchemaValue(field.schema, currentValue);

            return (
              <div key={field.path}>
                <label
                  htmlFor={`body-${field.path}`}
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {/* Enum field - render as select */}
                {field.schema.enum ? (
                  <select
                    id={`body-${field.path}`}
                    value={currentValue || ''}
                    onChange={(e) => handleFieldChange(field.path, e.target.value, field.schema)}
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 bg-card text-foreground"
                  >
                    <option value="">Select...</option>
                    {field.schema.enum.map((option) => (
                      <option key={String(option)} value={String(option)}>
                        {String(option)}
                      </option>
                    ))}
                  </select>
                ) : field.schema.type === 'boolean' ? (
                  <select
                    id={`body-${field.path}`}
                    value={currentValue === undefined ? '' : String(currentValue)}
                    onChange={(e) => handleFieldChange(field.path, e.target.value, field.schema)}
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 bg-card text-foreground"
                  >
                    <option value="">Select...</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : field.schema.type === 'array' ? (
                  <textarea
                    id={`body-${field.path}`}
                    value={currentValue ? JSON.stringify(currentValue) : '[]'}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        handleFieldChange(field.path, parsed, field.schema);
                      } catch {
                        // Invalid JSON, don't update
                      }
                    }}
                    placeholder="[]"
                    rows={2}
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 font-mono text-sm bg-card text-foreground"
                  />
                ) : (
                  <input
                    id={`body-${field.path}`}
                    type={
                      field.schema.type === 'number' || field.schema.type === 'integer'
                        ? 'number'
                        : 'text'
                    }
                    value={currentValue ?? ''}
                    onChange={(e) => handleFieldChange(field.path, e.target.value, field.schema)}
                    placeholder={field.schema.description || `Enter ${field.label}`}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 bg-card text-foreground ${
                      error ? 'border-red-300' : 'border-border'
                    }`}
                  />
                )}

                {field.schema.description && !error && (
                  <p className="mt-1 text-xs text-muted-foreground">{field.schema.description}</p>
                )}

                {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Fill out the form to automatically generate the request body JSON
      </p>
    </div>
  );
}
