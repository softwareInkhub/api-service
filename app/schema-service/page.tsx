'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import { SchemaEditor } from '../components/schema-editor/SchemaEditor';

interface Schema {
  uuid: string;
  schemaName: string;
  schema: string;
  createdAt: string;
  lastUpdatedAt: string;
}

const defaultSchema = {
  schemaName: "New Schema",
  schema: JSON.stringify({
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "number" }
    }
  })
};

export default function SchemaService() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const handleCreateSchema = () => {
    const newSchema = {
      uuid: `temp-${Date.now()}`,
      schemaName: defaultSchema.schemaName,
      schema: defaultSchema.schema,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString()
    };
    setSchemas(prev => [...prev, newSchema]);
    setSelectedSchema(newSchema);
    setIsDirty(true);
  };

  const handleSchemaChange = async (schema: Schema, newSchemaData: any) => {
    try {
      setLoading(true);
      setError(null);

      const isNew = schema.uuid.startsWith('temp-');
      const endpoint = isNew ? '/api/createSchema' : '/api/updateSchema';
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isNew ? {} : { uuid: schema.uuid }),
          schemaName: schema.schemaName,
          schema: JSON.stringify(newSchemaData)
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save schema');
      }

      await fetchSchemas();
    } catch (error: any) {
      setError(error.message);
      console.error('Error saving schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchema = async (schema: Schema) => {
    if (!window.confirm('Are you sure you want to delete this schema?')) return;

    try {
      setLoading(true);
      setError(null);

      // Don't call API for temporary schemas
      if (!schema.uuid.startsWith('temp-')) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deleteSchema`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uuid: schema.uuid })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to delete schema');
        }
      }

      setSchemas(prev => prev.filter(s => s.uuid !== schema.uuid));
      if (selectedSchema?.uuid === schema.uuid) {
        setSelectedSchema(null);
      }
    } catch (error: any) {
      setError(error.message);
      console.error('Error deleting schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchemas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/getAllSchemas`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schemas: ${response.statusText}`);
      }

      const data = await response.json();
      setSchemas(data);
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching schemas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemas();
  }, []);

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Schemas</h2>
          <button
            onClick={handleCreateSchema}
            className="p-2 text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            <FiPlus size={20} />
          </button>
        </div>
        
        <div className="space-y-2">
          {schemas.map(schema => (
            <div
              key={schema.uuid}
              className={`p-3 rounded-lg cursor-pointer flex justify-between items-center ${
                selectedSchema?.uuid === schema.uuid ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100'
              }`}
              onClick={() => setSelectedSchema(schema)}
            >
              <div className="truncate">
                <div className="font-medium">{schema.schemaName}</div>
                <div className="text-xs text-gray-500">
                  {schema.uuid.startsWith('temp-') ? 'Unsaved' : new Date(schema.lastUpdatedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSchema(schema);
                }}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Error Message */}
        {error && (
          <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {selectedSchema ? (
          <SchemaEditor
            schema={JSON.parse(selectedSchema.schema)}
            onSave={(newSchema) => handleSchemaChange(selectedSchema, newSchema)}
            readOnly={loading}
            availableSchemas={schemas.filter(s => s.uuid !== selectedSchema.uuid)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a schema or create a new one
          </div>
        )}
      </div>
    </div>
  );
}