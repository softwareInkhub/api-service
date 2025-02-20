'use client';

import { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronRight, FiTrash2, FiEdit2, FiDownload } from 'react-icons/fi';
import { ClientMethodTemplate } from '../types/ClientMethodTemplate';
import JsonTreeView from '../components/JsonTreeView';
import { useRouter } from 'next/navigation';
import { templateService } from '../services/templateService';

export default function ClientMethodTemplates() {
  const [templates, setTemplates] = useState<ClientMethodTemplate[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templates = await templateService.getTemplates();
        setTemplates(templates);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const deleteTemplate = async (id: string) => {
    try {
      await templateService.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
      // You might want to show an error notification here
    }
  };

  const applyTemplate = (template: ClientMethodTemplate) => {
    // Save template data to localStorage for api-tester to pick up
    localStorage.setItem('pendingTemplateApplication', JSON.stringify(template));
    router.push('/api-tester');
  };

  const downloadTemplate = (template: ClientMethodTemplate) => {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Client Method Templates</h1>
        <div className="text-gray-500">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Client Method Templates</h1>
      
      <div className="space-y-2">
        {templates.map(template => (
          <div key={template.id} className="border rounded-lg bg-white">
            {/* Template Header */}
            <div 
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
            >
              <div className="flex items-center gap-4">
                <button className="text-gray-500">
                  {expandedId === template.id ? <FiChevronDown /> : <FiChevronRight />}
                </button>
                <span className="font-medium">{template.name}</span>
                <span className={`px-2 py-1 text-xs rounded font-medium ${
                  template.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                  template.method === 'POST' ? 'bg-green-100 text-green-700' :
                  template.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {template.method}
                </span>
                <span className="text-gray-600 text-sm truncate">
                  {template.url}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    applyTemplate(template);
                  }}
                  className="px-3 py-1 text-sm bg-[#ff6b4a] text-white rounded hover:bg-[#ff5436]"
                >
                  Apply
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadTemplate(template);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700"
                  title="Download Template"
                >
                  <FiDownload size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTemplate(template.id);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700"
                  title="Delete Template"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>

            {/* Template Details */}
            {expandedId === template.id && (
              <div className="border-t p-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Request Section */}
                  <div>
                    <h3 className="font-medium mb-2">Request</h3>
                    <div className="space-y-4">
                      {template.queryParams.length > 0 && (
                        <div>
                          <h4 className="text-sm text-gray-500 mb-1">Query Parameters</h4>
                          <JsonTreeView data={template.queryParams} />
                        </div>
                      )}
                      {template.headers.length > 0 && (
                        <div>
                          <h4 className="text-sm text-gray-500 mb-1">Headers</h4>
                          <JsonTreeView data={template.headers} />
                        </div>
                      )}
                      {template.requestBody && (
                        <div>
                          <h4 className="text-sm text-gray-500 mb-1">Body</h4>
                          <JsonTreeView data={template.requestBody} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expected Response Section */}
                  {template.expectedResponse && (
                    <div>
                      <h3 className="font-medium mb-2">Expected Response</h3>
                      <div className="space-y-4">
                        {template.expectedResponse.status && (
                          <div className="text-sm">
                            Status: <span className={`font-medium ${
                              template.expectedResponse.status < 300 ? 'text-green-600' :
                              template.expectedResponse.status < 400 ? 'text-blue-600' :
                              'text-red-600'
                            }`}>
                              {template.expectedResponse.status}
                            </span>
                          </div>
                        )}
                        {template.expectedResponse.body && (
                          <div>
                            <h4 className="text-sm text-gray-500 mb-1">Body</h4>
                            <JsonTreeView data={template.expectedResponse.body} />
                          </div>
                        )}
                        {template.expectedResponse.headers && (
                          <div>
                            <h4 className="text-sm text-gray-500 mb-1">Headers</h4>
                            <JsonTreeView data={template.expectedResponse.headers} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 