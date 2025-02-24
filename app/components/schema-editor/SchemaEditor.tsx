'use client';

import { useState, useEffect } from 'react';
import { JsonForms } from '@jsonforms/react';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import JsonTreeView from '../JsonTreeView';

const schemaBuilderSchema = {
  type: 'object',
  properties: {
    schemaName: {
      type: 'string',
      title: 'Schema Name'
    },
    fields: {
      type: 'array',
      title: 'Fields',
      items: {
        type: 'object',
        properties: {
          name: { 
            type: 'string',
            title: 'Field Name'
          },
          type: {
            type: 'string',
            title: 'Field Type',
            enum: ['string', 'number', 'boolean', 'object', 'array', 'date', 'schema']
          },
          required: { 
            type: 'boolean',
            title: 'Required',
            default: false 
          },
          nullable: { 
            type: 'boolean',
            title: 'Nullable',
            default: true 
          }
        },
        required: ['name', 'type']
      }
    }
  },
  required: ['schemaName']
};

interface SchemaEditorProps {
  schema: any;
  onSave: (schema: any) => void;
  readOnly?: boolean;
}

export const SchemaEditor: React.FC<SchemaEditorProps> = ({
  schema,
  onSave,
  readOnly = false
}) => {
  const [formData, setFormData] = useState(schema);
  const [jsonSchema, setJsonSchema] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const converted = convertToJsonSchema(formData);
      setJsonSchema(converted);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid schema format');
    }
  }, [formData]);

  const convertToJsonSchema = (data: any) => {
    const result: any = {
      type: 'object',
      title: data.schemaName,
      properties: {},
      required: []
    };

    data.fields?.forEach((field: any) => {
      if (!field.name) return;

      result.properties[field.name] = {
        type: field.type,
        nullable: field.nullable
      };

      if (field.required) {
        result.required.push(field.name);
      }
    });

    return result;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-6">Schema Editor</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Form Side */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Form Editor</h3>
          <JsonForms
            schema={schemaBuilderSchema}
            data={formData}
            renderers={materialRenderers}
            cells={materialCells}
            onChange={({ data }) => setFormData(data)}
            readonly={readOnly}
          />
        </div>

        {/* JSON Preview Side */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">JSON Schema Preview</h3>
          <div className="bg-gray-50 rounded p-4 h-[500px] overflow-auto">
            <JsonTreeView data={jsonSchema} />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <button
        className="mt-6 px-4 py-2 bg-[#ff6b4a] text-white rounded-lg hover:bg-[#ff5436] 
          transition-colors disabled:bg-gray-400"
        onClick={() => onSave(jsonSchema)}
        disabled={readOnly || !formData.schemaName || !!error}
      >
        Save Schema
      </button>
    </div>
  );
}; 