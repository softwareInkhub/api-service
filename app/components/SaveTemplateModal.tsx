import { useState } from 'react';
import { ClientMethodTemplate } from '../types/ClientMethodTemplate';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<ClientMethodTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData: {
    method: string;
    url: string;
    queryParams: any[];
    headers: any[];
    requestBody: any;
    response?: any;
  };
}

export default function SaveTemplateModal({ isOpen, onClose, onSave, initialData }: SaveTemplateModalProps) {
  const [name, setName] = useState('');
  const [includeResponse, setIncludeResponse] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px]">
        <h2 className="text-lg font-medium mb-4">Save as Template</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeResponse"
              checked={includeResponse}
              onChange={(e) => setIncludeResponse(e.target.checked)}
            />
            <label htmlFor="includeResponse" className="text-sm text-gray-600">
              Include expected response
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!name.trim()) return;
                
                onSave({
                  name: name.trim(),
                  method: initialData.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
                  url: initialData.url,
                  queryParams: initialData.queryParams,
                  headers: initialData.headers,
                  requestBody: initialData.requestBody,
                  expectedResponse: includeResponse ? {
                    body: initialData.response?.data,
                    headers: initialData.response?.headers,
                    status: initialData.response?.status
                  } : undefined
                });
                onClose();
              }}
              className="px-4 py-2 bg-[#ff6b4a] text-white rounded hover:bg-[#ff5436]"
            >
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 