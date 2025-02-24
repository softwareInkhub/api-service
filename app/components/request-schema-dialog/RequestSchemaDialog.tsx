'use client';

import { useState, useEffect } from 'react';
import { FiDownload, FiCopy } from 'react-icons/fi';
import JsonTreeView from '../JsonTreeView';
import { JsonSchemaService } from '../../services/jsonSchemaService';
import { NamespaceMethod } from '../../types/namespace';

interface RequestSchemaDialogProps {
  title?: string;
  method: NamespaceMethod;
  currentResponse?: any;
  onClose?: () => void;
}

export const RequestSchemaDialog: React.FC<RequestSchemaDialogProps> = ({
  title = 'Response Data & Schema',
  method,
  currentResponse,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('response');
  const [validationInput, setValidationInput] = useState('');
  const [validationResult, setValidationResult] = useState<string[]>([]);

  // Validate current response against stored schema
  useEffect(() => {
    if (!validationInput) {
      setValidationResult([]);
      return;
    }

    try {
      const jsonData = JSON.parse(validationInput);
      // Use the schema stored in the method
      const schema = activeTab === 'request' 
        ? method['request-schema'] 
        : method['response-schema'];

      if (!schema) {
        setValidationResult(['No schema available for validation']);
        return;
      }

      const errors = JsonSchemaService.validate(schema, jsonData);
      setValidationResult(errors);
    } catch (error) {
      setValidationResult(['Invalid JSON format']);
    }
  }, [validationInput, activeTab, method]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
  };

  const handleDownload = (data: any, type: 'json' | 'schema') => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type === 'json' ? 'data' : 'schema'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Update validation result display
  const getValidationResultDisplay = () => {
    if (!validationInput) return null;

    if (validationResult.length === 0) {
      return (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded">
          <div className="font-medium">JSON is valid</div>
        </div>
      );
    }

    return (
      <div className="mt-4">
        <div className="font-medium mb-2 text-red-600">Validation Results</div>
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="space-y-1">
            {validationResult.map((error, index) => (
              <div key={index} className="text-red-600 font-mono text-sm">
                • {error}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-red-600">
            {validationResult.length} error{validationResult.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('request')}
                className={`px-4 py-1 rounded ${
                  activeTab === 'request' 
                    ? 'bg-[#ff6b4a] text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Request
              </button>
              <button
                onClick={() => setActiveTab('response')}
                className={`px-4 py-1 rounded ${
                  activeTab === 'response' 
                    ? 'bg-[#ff6b4a] text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Response
              </button>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          )}
        </div>

        <div className="p-4 overflow-auto max-h-[calc(90vh-64px)]">
          <div className="grid grid-cols-2 gap-4">
            {/* Data Panel */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">
                  {activeTab === 'request' ? 'Request Data' : 'Response Data'}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => handleCopy(
                    activeTab === 'request' 
                      ? method['sample-request']
                      : (currentResponse || method['sample-response'])
                  )} className="text-gray-500 hover:text-gray-700">
                    <FiCopy size={16} />
                  </button>
                  <button onClick={() => handleDownload(
                    activeTab === 'request'
                      ? method['sample-request']
                      : (currentResponse || method['sample-response']),
                    'json'
                  )} className="text-gray-500 hover:text-gray-700">
                    <FiDownload size={16} />
                  </button>
                </div>
              </div>
              <div className="border rounded p-4 bg-gray-50 h-[400px] overflow-auto">
                <JsonTreeView data={
                  activeTab === 'request'
                    ? method['sample-request']
                    : (currentResponse || method['sample-response'])
                } />
              </div>
            </div>

            {/* Schema Panel */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">
                  {activeTab === 'request' ? 'Request Schema' : 'Response Schema'}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => handleCopy(
                    JSON.stringify(
                      activeTab === 'request'
                        ? method['request-schema']
                        : method['response-schema']
                    ) || '{}'
                  )} className="text-gray-500 hover:text-gray-700">
                    <FiCopy size={16} />
                  </button>
                  <button onClick={() => handleDownload(
                    activeTab === 'request'
                      ? method['request-schema']
                      : method['response-schema'],
                    'schema'
                  )} className="text-gray-500 hover:text-gray-700">
                    <FiDownload size={16} />
                  </button>
                </div>
              </div>
              <div className="border rounded p-4 bg-gray-50 h-[400px] overflow-auto">
                <JsonTreeView data={
                  activeTab === 'request'
                    ? method['request-schema']
                    : method['response-schema']
                } />
                {!method[`${activeTab}-schema`] && (
                  <div className="text-gray-500 text-center mt-4">
                    No schema available. Make an API call to generate the schema.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Validation Section */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Validate JSON</h3>
              <button onClick={() => handleCopy(validationInput)} className="text-gray-500 hover:text-gray-700">
                <FiCopy size={16} />
              </button>
            </div>
            <textarea
              value={validationInput}
              onChange={(e) => setValidationInput(e.target.value)}
              placeholder={`Paste JSON to validate against ${activeTab} schema...`}
              className="w-full h-32 p-2 border rounded font-mono text-sm"
            />
            {getValidationResultDisplay()}
          </div>
        </div>
      </div>
    </div>
  );
}; 