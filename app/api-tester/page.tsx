'use client';

import { useState, useEffect } from 'react';
import { FiSend, FiPlus, FiTrash2, FiClock, FiSearch, FiMaximize2, FiMinimize2, FiDownload } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import type { default as JsonEditorType } from 'react-json-editor-ajrm';
import JsonTreeView from '../components/JsonTreeView';
import SaveTemplateModal from '../components/SaveTemplateModal';
import { ClientMethodTemplate } from '../types/ClientMethodTemplate';
import { templateService } from '../services/templateService';

// Create a type for the component props
interface JsonEditorProps {
  id?: string;
  placeholder?: any;
  locale?: any;
  viewOnly?: boolean;
  onChange?: (value: any) => void;
  colors?: {
    background: string;
    default: string;
  };
  height?: string;
  width?: string;
  reset?: boolean;
  modifyErrorText?: (error: string) => string;
}

// Update the dynamic import
const JsonEditor = dynamic<JsonEditorProps>(() =>
  import('react-json-editor-ajrm').then(mod => mod.default)
  , { ssr: false });

interface KeyValuePair {
  key: string;
  value: string;
}

interface RequestHistory {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  queryParams: KeyValuePair[];
  headers: KeyValuePair[];
  body: any;
  response?: {
    status: number;
    data: any;
    headers: any;
  };
}

interface JsonEditorLocale {
  format: string;
  type: string;
  value: string;
  validation: string;
  nonAlphanumeric: string;
  quote: string;
  alpha: string;
  digit: string;
  punct: string;
  space: string;
  safe: string;
  unicode: string;
  escape: string;
}

const locale: JsonEditorLocale = {
  format: "Format",
  type: "Type",
  value: "Value",
  validation: "Validation",
  nonAlphanumeric: "Non-alphanumeric",
  quote: "Quote",
  alpha: "Alpha",
  digit: "Digit",
  punct: "Punctuation",
  space: "Space",
  safe: "Safe",
  unicode: "Unicode",
  escape: "Escape"
};

// Add this helper function at the top level
const formatJson = (json: any): string => {
  try {
    return JSON.stringify(json, null, 2);
  } catch (e) {
    return '';
  }
};

// Add this helper function
const downloadJson = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export default function ApiTester() {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body');
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>([{ key: '', value: '' }]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([{ key: '', value: '' }]);
  const [requestBody, setRequestBody] = useState<any>({});
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [urlSuggestions, setUrlSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [requestFormat, setRequestFormat] = useState<'json' | 'form'>('json');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('apiRequestHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('apiRequestHistory', JSON.stringify(history));
  }, [history]);

  // Update URL suggestions when typing
  useEffect(() => {
    if (url.trim()) {
      const suggestions = history
        .filter(h => h.url.toLowerCase().includes(url.toLowerCase()))
        .map(h => h.url)
        .filter((value, index, self) => self.indexOf(value) === index)
        .slice(0, 5);
      setUrlSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [url, history]);

  // Add to existing useEffect or create new one
  useEffect(() => {
    // Check for pending template application
    const pendingTemplate = localStorage.getItem('pendingTemplateApplication');
    if (pendingTemplate) {
      const template = JSON.parse(pendingTemplate);
      
      // Apply template data
      setMethod(template.method);
      setUrl(template.url);
      setQueryParams(template.queryParams.length ? template.queryParams : [{ key: '', value: '' }]);
      setHeaders(template.headers.length ? template.headers : [{ key: '', value: '' }]);
      
      if (template.requestBody) {
        setRequestBody(template.requestBody);
        setRequestFormat(Array.isArray(template.requestBody) || typeof template.requestBody === 'object' ? 'json' : 'form');
        setActiveTab('body');
      } else if (template.queryParams.some((p: KeyValuePair) => p.key)) {
        setActiveTab('params');
      } else if (template.headers.some((h: KeyValuePair) => h.key)) {
        setActiveTab('headers');
      }

      // Clear the pending template
      localStorage.removeItem('pendingTemplateApplication');
    }
  }, []); // Run once on mount

  const handleAddParam = (type: 'query' | 'header') => {
    if (type === 'query') {
      setQueryParams([...queryParams, { key: '', value: '' }]);
    } else {
      setHeaders([...headers, { key: '', value: '' }]);
    }
  };

  const handleRemoveParam = (type: 'query' | 'header', index: number) => {
    if (type === 'query') {
      setQueryParams(queryParams.filter((_, i) => i !== index));
    } else {
      setHeaders(headers.filter((_, i) => i !== index));
    }
  };

  const handleParamChange = (
    type: 'query' | 'header',
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    if (type === 'query') {
      const newParams = [...queryParams];
      newParams[index][field] = value;
      setQueryParams(newParams);
    } else {
      const newHeaders = [...headers];
      newHeaders[index][field] = value;
      setHeaders(newHeaders);
    }
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      const queryParamsObj = queryParams.reduce((acc, { key, value }) => {
        if (key) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      const headersObj = headers.reduce((acc, { key, value }) => {
        if (key) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      // Fix: Properly handle request body based on format and tab
      let processedBody = undefined;
      if (method !== 'GET' && activeTab === 'body') {
        if (requestFormat === 'json') {
          processedBody = requestBody;
        } else if (requestFormat === 'form') {
          // Convert form data to object
          processedBody = Object.fromEntries(
            Object.entries(requestBody).filter(([key]) => key.trim() !== '')
          );
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/openApi/openapi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          url,
          queryParams: queryParamsObj,
          headers: headersObj,
          body: processedBody // Use processed body here
        }),
      });

      const data = await response.json();
      setResponse(data);

      // Add to history with full response
      const historyItem: RequestHistory = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        method,
        url,
        queryParams,
        headers,
        body: processedBody,
        response: {
          status: data.status,
          data: data.data,
          headers: data.headers
        }
      };
      setHistory(prev => [historyItem, ...prev.slice(0, 19)]);
    } catch (error) {
      setResponse({
        error: 'Failed to make request',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item: RequestHistory) => {
    setMethod(item.method);
    setUrl(item.url);
    setQueryParams(item.queryParams.length ? item.queryParams : [{ key: '', value: '' }]);
    setHeaders(item.headers.length ? item.headers : [{ key: '', value: '' }]);
    
    if (item.body) {
      setRequestBody(item.body);
      setRequestFormat(Array.isArray(item.body) || typeof item.body === 'object' ? 'json' : 'form');
    } else {
      setRequestBody({});
    }

    // Set appropriate tab based on data
    if (item.body && Object.keys(item.body).length > 0) {
      setActiveTab('body');
    } else if (item.queryParams.some(p => p.key)) {
      setActiveTab('params');
    } else if (item.headers.some(h => h.key)) {
      setActiveTab('headers');
    }

    // Set response data if available
    if (item.response) {
      setResponse({
        status: item.response.status,
        data: item.response.data,
        headers: item.response.headers
      });
      setResponseTab('body');
    }
    
    setShowHistory(false);
  };

  const saveTemplate = async (template: Omit<ClientMethodTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await templateService.saveTemplate(template);
      setShowSaveTemplate(false);
    } catch (error) {
      console.error('Error saving template:', error);
      // You might want to show an error notification here
    }
  };

  return (
    <div className="h-screen bg-[#f8f8f8]">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">OPEN API</h1>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <FiClock />
            History
          </button>
        </div>

        {/* History Overlay */}
        {showHistory && (
          <div className="fixed right-0 top-0 h-screen w-[400px] bg-white border-l shadow-lg flex flex-col z-50">
            <div className="flex justify-between items-center px-6 py-4 border-b shrink-0">
              <h2 className="text-lg font-medium">Request History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              <div className="space-y-2">
                {history.map(item => (
                  <div
                    key={item.id}
                    className="border rounded-lg hover:border-gray-300 transition-colors bg-white"
                  >
                    {/* Clickable Header */}
                    <div 
                      className="p-3 flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${
                          item.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                          item.method === 'POST' ? 'bg-green-100 text-green-700' :
                          item.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.method}
                        </span>
                        <span className="truncate font-mono text-xs text-gray-600">
                          {item.url}
                        </span>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadFromHistory(item);
                        }}
                        className="px-3 py-1 text-xs bg-[#ff6b4a] text-white rounded hover:bg-[#ff5436] shrink-0"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {expandedHistoryId === item.id && (
                      <div className="border-t px-3 py-2 text-xs">
                        <div className="space-y-2">
                          {/* Request Details */}
                          <div className="space-y-1">
                            <div className="text-gray-500">
                              {new Date(item.timestamp).toLocaleString()}
                            </div>
                            <div className="flex gap-2">
                              {item.queryParams.some(p => p.key) && (
                                <span className="px-2 py-0.5 bg-gray-100 rounded">
                                  {item.queryParams.filter(p => p.key).length} params
                                </span>
                              )}
                              {item.headers.some(h => h.key) && (
                                <span className="px-2 py-0.5 bg-gray-100 rounded">
                                  {item.headers.filter(h => h.key).length} headers
                                </span>
                              )}
                              {item.body && Object.keys(item.body).length > 0 && (
                                <span className="px-2 py-0.5 bg-gray-100 rounded">
                                  {typeof item.body === 'object' ? 'JSON' : 'Form'} body
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Response Preview */}
                          {item.response && (
                            <div className="border-t pt-2 mt-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-medium ${
                                  item.response.status < 300 ? 'text-green-600' :
                                  item.response.status < 400 ? 'text-blue-600' :
                                  'text-red-600'
                                }`}>
                                  Status: {item.response.status}
                                </span>
                              </div>
                              <div className="bg-gray-50 border rounded p-2 max-h-[100px] overflow-auto font-mono">
                                {JSON.stringify(item.response.data, null, 2)}
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
          </div>
        )}

        {/* URL Bar with Suggestions */}
        <div className="flex gap-2 mb-4 relative">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="px-4 py-2 border rounded bg-white text-gray-700 font-medium w-28"
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
            <option>PATCH</option>
          </select>
          <div className="flex-1 relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Enter request URL"
              className="w-full px-4 py-2 border rounded"
            />
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 bg-white border rounded-b shadow-lg mt-1 z-10">
                {urlSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setUrl(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                  >
                    <FiSearch className="text-gray-400" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSaveTemplate(true)}
              className="px-4 py-2 border rounded text-gray-600 hover:text-gray-800"
            >
              Save as Template
            </button>
            <button
              onClick={handleSend}
              disabled={loading}
              className="px-6 py-2 bg-[#ff6b4a] text-white rounded font-medium hover:bg-[#ff5436] disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border rounded-lg">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('params')}
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'params' ? 'text-[#ff6b4a] border-b-2 border-[#ff6b4a]' : 'text-gray-600'}`}
            >
              Query Params
            </button>
            <button
              onClick={() => setActiveTab('headers')}
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'headers' ? 'text-[#ff6b4a] border-b-2 border-[#ff6b4a]' : 'text-gray-600'}`}
            >
              Headers
            </button>
            <button
              onClick={() => setActiveTab('body')}
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'body' ? 'text-[#ff6b4a] border-b-2 border-[#ff6b4a]' : 'text-gray-600'}`}
            >
              Body
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'params' && (
              <div className="space-y-2">
                {queryParams.map((param, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) => handleParamChange('query', index, 'key', e.target.value)}
                      placeholder="Key"
                      className="flex-1 px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => handleParamChange('query', index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 border rounded"
                    />
                    <button
                      onClick={() => handleRemoveParam('query', index)}
                      className="px-3 text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddParam('query')}
                  className="text-[#ff6b4a] font-medium hover:text-[#ff5436]"
                >
                  Add
                </button>
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="space-y-2">
                {headers.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => handleParamChange('header', index, 'key', e.target.value)}
                      placeholder="Key"
                      className="flex-1 px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => handleParamChange('header', index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 border rounded"
                    />
                    <button
                      onClick={() => handleRemoveParam('header', index)}
                      className="px-3 text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddParam('header')}
                  className="text-[#ff6b4a] font-medium hover:text-[#ff5436]"
                >
                  Add
                </button>
              </div>
            )}

            {activeTab === 'body' && method !== 'GET' && (
              <div className="space-y-4">
                {/* Body Type Tabs */}
                <div className="flex border-b">
                  <button
                    onClick={() => setRequestFormat('json')}
                    className={`px-6 py-3 text-sm font-medium ${requestFormat === 'json'
                        ? 'text-[#ff6b4a] border-b-2 border-[#ff6b4a]'
                        : 'text-gray-600'
                      }`}
                  >
                    raw (json)
                  </button>
                  <button
                    onClick={() => setRequestFormat('form')}
                    className={`px-6 py-3 text-sm font-medium ${requestFormat === 'form'
                        ? 'text-[#ff6b4a] border-b-2 border-[#ff6b4a]'
                        : 'text-gray-600'
                      }`}
                  >
                    form-data
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-4">
                  {requestFormat === 'json' ? (
                    <div className="border rounded bg-white">
                      <div className="flex justify-between items-center border-b px-4 py-2">
                        <span className="text-sm font-medium text-gray-700">JSON</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              try {
                                setRequestBody({});
                              } catch (e) {
                                console.error('Failed to clear JSON');
                              }
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => {
                              try {
                                const formatted = typeof requestBody === 'string'
                                  ? JSON.parse(requestBody)
                                  : requestBody;
                                setRequestBody(formatted);
                              } catch (e) {
                                console.error('Invalid JSON');
                              }
                            }}
                            className="text-sm text-[#ff6b4a] hover:text-[#ff5436]"
                          >
                            Format
                          </button>
                        </div>
                      </div>
                      <div className="flex">
                        {/* Editable textarea */}
                        <div className="w-1/2 border-r">
                          <textarea
                            value={typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody, null, 2)}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                setRequestBody(parsed);
                              } catch {
                                setRequestBody(e.target.value);
                              }
                            }}
                            placeholder="Enter JSON request body"
                            className="w-full h-[300px] p-4 font-mono text-sm resize-none focus:outline-none"
                            spellCheck={false}
                          />
                        </div>
                        {/* JSON Tree View */}
                        <div className="w-1/2 p-4 overflow-auto h-[300px]">
                          <JsonTreeView
                            data={
                              typeof requestBody === 'string'
                                ? JSON.parse(requestBody || '{}')
                                : requestBody
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(requestBody || {}).map(([key, value], index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => {
                              const newBody = { ...requestBody };
                              delete newBody[key];
                              newBody[e.target.value] = value;
                              setRequestBody(newBody);
                            }}
                            placeholder="Key"
                            className="flex-1 px-3 py-2 border rounded"
                          />
                          <input
                            type="text"
                            value={value as string}
                            onChange={(e) => {
                              setRequestBody({
                                ...requestBody,
                                [key]: e.target.value
                              });
                            }}
                            placeholder="Value"
                            className="flex-1 px-3 py-2 border rounded"
                          />
                          <button
                            onClick={() => {
                              const newBody = { ...requestBody };
                              delete newBody[key];
                              setRequestBody(newBody);
                            }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setRequestBody({
                            ...requestBody,
                            '': ''
                          });
                        }}
                        className="text-[#ff6b4a] hover:text-[#ff5436] flex items-center gap-1"
                      >
                        <FiPlus /> Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Response Section */}
        {response && (
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-2">Response</h2>
            <div className="bg-white border rounded max-h-[500px] flex flex-col">
              {/* Response Tabs */}
              <div className="flex border-b shrink-0">
                <button
                  onClick={() => setResponseTab('body')}
                  className={`px-6 py-3 text-sm font-medium ${
                    responseTab === 'body'
                      ? 'text-[#ff6b4a] border-b-2 border-[#ff6b4a]'
                      : 'text-gray-600'
                  }`}
                >
                  Response Body
                </button>
                <button
                  onClick={() => setResponseTab('headers')}
                  className={`px-6 py-3 text-sm font-medium ${
                    responseTab === 'headers'
                      ? 'text-[#ff6b4a] border-b-2 border-[#ff6b4a]'
                      : 'text-gray-600'
                  }`}
                >
                  Response Headers
                </button>
              </div>

              {/* Response Content */}
              <div className="flex-1 overflow-auto">
                {responseTab === 'body' && (
                  <div className="border rounded bg-white h-full">
                    <div className="flex justify-between items-center border-b px-4 py-2 sticky top-0 bg-white z-10">
                      <span className="text-sm font-medium text-gray-700">Response Body</span>
                      <button
                        onClick={() => downloadJson(response.data, 'response.json')}
                        className="text-sm text-[#ff6b4a] hover:text-[#ff5436] flex items-center gap-1"
                        title="Download JSON"
                      >
                        <FiDownload size={14} />
                      </button>
                    </div>
                    <div className="p-4 font-mono text-sm">
                      <JsonTreeView data={response.data} />
                    </div>
                  </div>
                )}
                {responseTab === 'headers' && (
                  <div className="border rounded bg-white h-full">
                    <div className="p-4 font-mono text-sm">
                      <div className="sticky top-0 bg-white pb-2 mb-2 border-b">
                        <span className="font-medium">Status: </span>
                        <span className={`${
                          response.status < 300 ? 'text-green-600' :
                          response.status < 400 ? 'text-blue-600' :
                          'text-red-600'
                        }`}>
                          {response.status}
                        </span>
                      </div>
                      <JsonTreeView data={response.headers} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <SaveTemplateModal
          isOpen={showSaveTemplate}
          onClose={() => setShowSaveTemplate(false)}
          onSave={saveTemplate}
          initialData={{
            method,
            url,
            queryParams,
            headers,
            requestBody,
            response
          }}
        />
      </div>
    </div>
  );
} 