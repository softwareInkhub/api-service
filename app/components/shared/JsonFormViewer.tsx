'use client';

import React, { useState, useEffect } from 'react';
import { JsonForms } from '@jsonforms/react';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import JsonTreeView from '../JsonTreeView';

interface JsonFormViewerProps {
  schema: any;
  initialData?: any;
  onChange?: (data: any) => void;
  readOnly?: boolean;
}

export const JsonFormViewer: React.FC<JsonFormViewerProps> = ({
  schema,
  initialData = {},
  onChange,
  readOnly = false
}) => {
  const [formData, setFormData] = useState(initialData);
  const [jsonText, setJsonText] = useState(JSON.stringify(initialData, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleFormChange = ({ data }: { data: any }) => {
    setFormData(data);
    setJsonText(JSON.stringify(data, null, 2));
    onChange?.(data);
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setFormData(parsed);
      setJsonError(null);
      onChange?.(parsed);
    } catch (e) {
      setJsonError('Invalid JSON format');
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Form View */}
      <div className="overflow-y-auto">
        <h4 className="font-medium text-gray-700 mb-4">Form View</h4>
        <JsonForms
          schema={schema}
          data={formData}
          renderers={materialRenderers}
          cells={materialCells}
          onChange={handleFormChange}
          readonly={readOnly}
        />
      </div>

      {/* JSON View */}
      <div className="border-l pl-6">
        <h4 className="font-medium text-gray-700 mb-4">JSON View</h4>
        <div className="grid grid-rows-2 gap-4 h-[calc(100%-2rem)]">
          {/* JSON Editor */}
          <div className="relative">
            <textarea
              className={`w-full h-full p-4 font-mono text-sm rounded border 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  jsonError ? 'border-red-300' : 'border-gray-300'
                }`}
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              spellCheck={false}
              readOnly={readOnly}
            />
            {jsonError && (
              <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-red-50 text-red-600 text-sm">
                {jsonError}
              </div>
            )}
          </div>

          {/* Tree View */}
          <div className="overflow-y-auto border rounded">
            <JsonTreeView data={formData} />
          </div>
        </div>
      </div>
    </div>
  );
}; 