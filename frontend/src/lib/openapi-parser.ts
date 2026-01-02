import type {
  OperationObject,
  ParameterObject,
  SchemaObject,
  ParsedParameters,
} from '../types/openapi';

/**
 * Parse operation parameters into categories
 */
export function parseParameters(operation: OperationObject): ParsedParameters {
  const params = (operation.parameters || []) as ParameterObject[];

  return {
    pathParams: params.filter((p) => p.in === 'path'),
    queryParams: params.filter((p) => p.in === 'query'),
    headerParams: params.filter((p) => p.in === 'header'),
  };
}

/**
 * Extract request body schema from operation
 */
export function parseRequestBodySchema(
  operation: OperationObject
): SchemaObject | null {
  if (!operation.requestBody) return null;

  const requestBody = operation.requestBody as any;
  const content = requestBody.content?.['application/json'];

  return content?.schema || null;
}

/**
 * Generate default value based on schema type
 */
export function generateDefaultValue(schema: SchemaObject): any {
  if (schema.default !== undefined) {
    return schema.default;
  }

  switch (schema.type) {
    case 'string':
      return '';
    case 'number':
    case 'integer':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return null;
  }
}

/**
 * Validate parameter value against schema
 */
export function validateParameter(
  param: ParameterObject,
  value: any
): string | null {
  if (param.required && (value === undefined || value === '')) {
    return `${param.name} is required`;
  }

  const schema = param.schema as SchemaObject;
  if (!schema) return null;

  // Type validation
  if (value !== '' && value !== undefined) {
    if (schema.type === 'number' || schema.type === 'integer') {
      const num = Number(value);
      if (isNaN(num)) {
        return `${param.name} must be a number`;
      }

      if (schema.minimum !== undefined && num < schema.minimum) {
        return `${param.name} must be >= ${schema.minimum}`;
      }

      if (schema.maximum !== undefined && num > schema.maximum) {
        return `${param.name} must be <= ${schema.maximum}`;
      }
    }

    if (schema.pattern && typeof value === 'string') {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        return `${param.name} does not match required pattern`;
      }
    }

    if (schema.enum && !schema.enum.includes(value)) {
      return `${param.name} must be one of: ${schema.enum.join(', ')}`;
    }
  }

  return null;
}
