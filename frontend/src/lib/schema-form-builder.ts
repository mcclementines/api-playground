import type { SchemaObject } from '../types/openapi';

/**
 * Build a default object from a schema
 */
export function buildDefaultFromSchema(schema: SchemaObject | null | undefined): any {
  if (!schema || !schema.type) return {};

  switch (schema.type) {
    case 'object':
      const obj: Record<string, any> = {};
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, propSchema]) => {
          obj[key] = buildDefaultFromSchema(propSchema as SchemaObject);
        });
      }
      return obj;

    case 'array':
      return [];

    case 'string':
      return schema.default !== undefined ? schema.default : '';

    case 'number':
    case 'integer':
      return schema.default !== undefined ? schema.default : 0;

    case 'boolean':
      return schema.default !== undefined ? schema.default : false;

    default:
      return null;
  }
}

/**
 * Get all properties from a schema including nested objects (flattened with dot notation)
 */
export function getSchemaFields(
  schema: SchemaObject | null | undefined,
  prefix: string = ''
): Array<{
  path: string;
  schema: SchemaObject;
  required: boolean;
  label: string;
}> {
  const fields: Array<{
    path: string;
    schema: SchemaObject;
    required: boolean;
    label: string;
  }> = [];

  if (!schema) {
    return fields;
  }

  if (schema.type === 'object' && schema.properties) {
    const requiredFields = schema.required || [];

    Object.entries(schema.properties).forEach(([key, propSchema]) => {
      if (!propSchema) return;

      const fieldSchema = propSchema as SchemaObject;
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      const isRequired = requiredFields.includes(key);

      // For nested objects, flatten them
      if (fieldSchema.type === 'object' && fieldSchema.properties) {
        fields.push(...getSchemaFields(fieldSchema, fieldPath));
      } else {
        fields.push({
          path: fieldPath,
          schema: fieldSchema,
          required: isRequired,
          label: key,
        });
      }
    });
  }

  return fields;
}

/**
 * Set a value in an object using dot notation path
 */
export function setValueByPath(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const result = { ...obj };
  let current = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];

  // Convert value based on type
  if (value === '') {
    delete current[lastKey]; // Remove empty values
  } else {
    current[lastKey] = value;
  }

  return result;
}

/**
 * Get a value from an object using dot notation path
 */
export function getValueByPath(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

/**
 * Validate a value against a schema
 */
export function validateSchemaValue(schema: SchemaObject, value: any): string | null {
  if (schema.required && (value === undefined || value === '' || value === null)) {
    return 'This field is required';
  }

  if (value === '' || value === undefined || value === null) {
    return null; // Empty non-required fields are valid
  }

  // Type validation
  if (schema.type === 'number' || schema.type === 'integer') {
    const num = Number(value);
    if (isNaN(num)) {
      return 'Must be a number';
    }

    if (schema.minimum !== undefined && num < schema.minimum) {
      return `Must be >= ${schema.minimum}`;
    }

    if (schema.maximum !== undefined && num > schema.maximum) {
      return `Must be <= ${schema.maximum}`;
    }

    if (schema.type === 'integer' && !Number.isInteger(num)) {
      return 'Must be an integer';
    }
  }

  if (schema.type === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      return `Minimum length is ${schema.minLength}`;
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      return `Maximum length is ${schema.maxLength}`;
    }

    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        return 'Does not match required pattern';
      }
    }

    if (schema.enum && !schema.enum.includes(value)) {
      return `Must be one of: ${schema.enum.join(', ')}`;
    }
  }

  return null;
}
