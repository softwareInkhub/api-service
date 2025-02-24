import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ 
  allErrors: true,
  useDefaults: true,
  coerceTypes: false,
  strict: true,
  validateFormats: true
});
addFormats(ajv);

export class JsonSchemaService {
  static generateSchema(data: any): any {
    const inferType = (value: any): any => {
      // Handle null values
      if (value === null) {
        return { type: ['null', 'string'] }; // Allow null or string
      }

      // Handle arrays
      if (Array.isArray(value)) {
        if (!value.length) {
          return {
            type: 'array',
            items: {}
          };
        }

        // Get schema for first item as base
        const baseSchema = inferType(value[0]);
        
        // Check if all items are of same type
        const allSameType = value.every(item => 
          typeof item === typeof value[0] || 
          (item === null && value[0] === null)
        );

        if (allSameType) {
          return {
            type: 'array',
            items: baseSchema
          };
        }

        // If mixed types, allow each type
        const itemSchemas = value.map(item => inferType(item));
        return {
          type: 'array',
          items: {
            oneOf: [...new Set(itemSchemas)]
          }
        };
      }

      // Handle objects
      if (typeof value === 'object') {
        const properties: Record<string, any> = {};
        const required: string[] = [];

        Object.entries(value).forEach(([key, val]) => {
          properties[key] = inferType(val);
          if (val !== null && val !== undefined) {
            required.push(key);
          }
        });

        return {
          type: 'object',
          properties,
          required,
          additionalProperties: false
        };
      }

      // Handle primitive types
      switch (typeof value) {
        case 'string':
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            return {
              type: 'string',
              format: 'date-time'
            };
          }
          if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return {
              type: 'string',
              format: 'date'
            };
          }
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return {
              type: 'string',
              format: 'email'
            };
          }
          if (/^https?:\/\//.test(value)) {
            return {
              type: 'string',
              format: 'uri'
            };
          }
          return { 
            type: 'string'
          };

        case 'number':
          return Number.isInteger(value) ? 
            { type: 'integer' } : 
            { type: 'number' };

        case 'boolean':
          return { type: 'boolean' };

        default:
          return { type: typeof value };
      }
    };

    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      ...inferType(data)
    };
  }

  static validate(schema: any, data: any): string[] {
    try {
      const validate = ajv.compile(schema);
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      const valid = validate(parsedData);

      if (!valid) {
        return (validate.errors || []).map(error => {
          const path = error.instancePath || 'root';
          const value = error.instancePath.split('/').reduce(
            (obj, key) => obj && key ? obj[key] : obj, 
            parsedData
          );

          switch (error.keyword) {
            case 'type':
              return `${path}: expected type '${error.params.type}', got '${typeof value}' (${value})`;
            case 'required':
              return `${path}: missing required property '${error.params.missingProperty}'`;
            case 'format':
              return `${path}: invalid ${error.params.format} format for value '${value}'`;
            case 'enum':
              return `${path}: value '${value}' must be one of: ${error.params.allowedValues.join(', ')}`;
            case 'oneOf':
              return `${path}: value '${value}' must match exactly one schema`;
            case 'additionalProperties':
              return `${path}: property '${error.params.additionalProperty}' is not allowed`;
            default:
              return `${path}: ${error.message} (got: ${value})`;
          }
        });
      }
      return [];
    } catch (e) {
      return ['Invalid JSON format'];
    }
  }
} 