import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

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
        return { 
          type: ['string', 'null'],
          nullable: true  // Only null values are nullable
        };
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
        
        // Check if any items are null
        const hasNullItems = value.some(item => item === null);
        
        // Check if all items are of same type
        const allSameType = value.every(item => 
          typeof item === typeof value[0] || 
          (item === null && value[0] === null)
        );

        if (allSameType) {
          return {
            type: 'array',
            items: hasNullItems ? { ...baseSchema, nullable: true } : baseSchema
          };
        }

        // If mixed types, allow each type and null
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
          const propSchema = inferType(val);
          properties[key] = {
            ...propSchema,
            nullable: val === null  // Only mark as nullable if value is null
          };
          
          // Add to required if not null
          if (val !== null) {
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
      const baseType = (() => {
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
            return { type: 'string' };

          case 'number':
            return Number.isInteger(value) ? 
              { type: 'integer' } : 
              { type: 'number' };

          case 'boolean':
            return { type: 'boolean' };

          default:
            return { type: typeof value };
        }
      })();

      return baseType; // Return without nullable for non-null values
    };

    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      ...inferType(data)
    };
  }

  static validate(schema: any, data: any): string[] {
    try {
      const validate = ajv.compile(schema);
      let parsedData;
      
      try {
        parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (e) {
        return ['Invalid JSON format'];
      }

      const valid = validate(parsedData);

      if (!valid) {
        return (validate.errors || []).map(error => {
          // Get the full JSON path
          let jsonPath = '';
          if (error.instancePath) {
            // Convert /products/0/variants/0/sku to products[0].variants[0].sku
            jsonPath = error.instancePath
              .split('/')
              .filter(Boolean)
              .map(segment => {
                return /^\d+$/.test(segment) ? `[${segment}]` : segment;
              })
              .join('.');
          }

          // Add property name for required errors
          if (error.keyword === 'required') {
            jsonPath = jsonPath 
              ? `${jsonPath}.${error.params.missingProperty}`
              : error.params.missingProperty;
          }

          // Add property name for additionalProperties errors
          if (error.keyword === 'additionalProperties') {
            jsonPath = jsonPath 
              ? `${jsonPath}.${error.params.additionalProperty}`
              : error.params.additionalProperty;
          }

          // Get the actual value at the error path
          const value = error.instancePath.split('/').reduce(
            (obj, key) => obj && key ? obj[key] : obj,
            parsedData
          );

          // Handle nullable validation
          if (error.keyword === 'type' && value === null) {
            const schema = error.parentSchema;
            if (schema && schema.nullable === true) {
              return null;
            }
          }

          switch (error.keyword) {
            case 'type':
              return `/${jsonPath}: expected type '${error.params.type}', got '${value === null ? 'null' : typeof value}'`;
            case 'required':
              return `/${jsonPath}: missing required property`;
            case 'format':
              return `/${jsonPath}: invalid ${error.params.format} format '${value}'`;
            case 'enum':
              return `/${jsonPath}: value '${value}' must be one of [${error.params.allowedValues.join(', ')}]`;
            case 'oneOf':
              return `/${jsonPath}: value must match exactly one schema`;
            case 'additionalProperties':
              return `/${jsonPath}: property not allowed`;
            default:
              return `/${jsonPath}: ${error.message}`;
          }
        }).filter(Boolean) as string[];
      }
      return [];
    } catch (e) {
      return ['Invalid JSON format'];
    }
  }
}

export const saveSchema = async ({ schemaName, schema }: { schemaName: string, schema: any }) => {
  const schemaRef = doc(db, 'schemas', schemaName);
  await setDoc(schemaRef, { schema }, { merge: true });
  return schemaRef.id;
}; 