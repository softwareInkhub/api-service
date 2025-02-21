'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSend, FiPlus, FiTrash2, FiClock, FiSearch, FiMaximize2, FiMinimize2, FiDownload } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import type { default as JsonEditorType } from 'react-json-editor-ajrm';
import JsonTreeView from '../components/JsonTreeView';
import SaveTemplateModal from '../components/SaveTemplateModal';
import { ClientMethodTemplate } from '../types/ClientMethodTemplate';
import { templateService } from '../services/templateService';
import CreateTemplateButton from '../components/shared/CreateTemplateButton';
import ApiFormHeader from '../components/api/ApiFormHeader';
import { NamespaceMethod } from '../types/namespace';
import { namespaceService } from '../services/namespaceService';

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

// Add these type definitions at the top
type RequestTab = 'params' | 'headers' | 'body';
type ResponseTab = 'body' | 'headers';

export default function ApiTester() {
  const [activeTab, setActiveTab] = useState<RequestTab>('params');
  const [responseTab, setResponseTab] = useState<ResponseTab>('body');
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
    try {
      console.group('API Request');
      
      // Log request details
      console.log('Request URL:', url);
      console.log('Method:', method);
      console.log('Query Parameters:', queryParams.filter(p => p.key));
      console.log('Headers:', headers.filter(h => h.key));
      if (method !== 'GET') {
        console.log('Request Body:', requestBody);
      }

      setLoading(true);
      const startTime = performance.now();

      // Format request body based on method
      let formattedBody;
      if (method !== 'GET') {
        try {
          // If requestBody is string, parse it as JSON
          formattedBody = typeof requestBody === 'string' 
            ? JSON.parse(requestBody)
            : requestBody;
        } catch (error) {
          console.error('Invalid JSON in request body:', error);
          throw new Error('Invalid JSON in request body');
        }
      }

      // Send request through our backend proxy
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/openApi/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          url,
          queryParams: queryParams.filter(p => p.key).reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
          }, {} as Record<string, string>),
          headers: headers.filter(h => h.key).reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
          }, {} as Record<string, string>),
          body: formattedBody // Use formatted body
        })
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const responseData = await response.json();

      console.group('API Response');
      console.log('Status:', responseData.status);
      console.log('Time:', `${responseTime}ms`);
      console.log('Size:', JSON.stringify(responseData.data).length, 'bytes');
      console.log('Headers:', responseData.headers);
      console.log('Body:', responseData.data);
      console.groupEnd();

      setResponse({
        status: responseData.status,
        data: responseData.data,
        headers: responseData.headers,
        time: `${responseTime}ms`
      });

      // Add to history
      const historyItem: RequestHistory = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        method,
        url,
        queryParams: queryParams.filter(p => p.key),
        headers: headers.filter(h => h.key),
        body: requestBody,
        response: {
          status: responseData.status,
          data: responseData.data,
          headers: responseData.headers
        }
      };

      setHistory(prev => [historyItem, ...prev]);

    } catch (error) {
      console.error('Request Error:', error);
      setResponse({
        status: 0,
        data: { error: 'Request failed' },
        headers: {},
        time: '0ms'
      });
    } finally {
      setLoading(false);
      console.groupEnd();
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

  const handleMethodSelect = async (method: NamespaceMethod) => {
    console.group('API Form Population');
    
    // Log Method Details
    console.group('Method Details');
    console.log('Name:', method['namespace-account-method-name']);
    console.log('Type:', method['namespace-account-method-type']);
    console.log('URL Override:', method['namespace-account-method-url-override']);
    console.log('Query Parameters:', method['namespace-account-method-queryParams']);
    console.groupEnd();

    // Get Account and Namespace Details
    const accounts = await namespaceService.getNamespaceAccounts(method['namespace-id']);
    const account = accounts[0];
    const namespace = await namespaceService.getNamespace(method['namespace-id']);
    
    console.group('URL Resolution');
    console.log('Method URL:', method['namespace-account-method-url-override']);
    console.log('Account URL:', account?.['namespace-account-url-override']);
    console.log('Namespace URL:', namespace?.['namespace-url']);
    
    // Cascade through URL options
    const finalUrl = method['namespace-account-method-url-override'] || 
                    account?.['namespace-account-url-override'] || 
                    namespace?.['namespace-url'] || 
                    '';
    
    console.log('Final Resolved URL:', finalUrl);
    console.groupEnd();

    // Log Account Details
    console.group('Account Details');
    console.log('Name:', account?.['namespace-account-name']);
    console.log('URL Override:', account?.['namespace-account-url-override']);
    console.log('Headers:', account?.['namespace-account-header']);
    console.groupEnd();

    // Log Form Updates
    console.group('Form Updates');
    
    // Set HTTP method
    console.log('Setting Method:', method['namespace-account-method-type']);
    setMethod(method['namespace-account-method-type']);
    
    // Set the resolved URL
    console.log('Setting URL:', finalUrl);
    setUrl(finalUrl);
    
    // Set query parameters
    if (method['namespace-account-method-queryParams']?.length) {
      console.log('Setting Query Params:', method['namespace-account-method-queryParams']);
      setQueryParams(method['namespace-account-method-queryParams']);
    } else {
      console.log('Setting Empty Query Params');
      setQueryParams([{ key: '', value: '' }]);
    }
    
    // Set headers from account
    if (account?.['namespace-account-header']?.length) {
      console.log('Setting Headers:', account['namespace-account-header']);
      setHeaders(account['namespace-account-header']);
    } else {
      console.log('Setting Empty Headers');
      setHeaders([{ key: '', value: '' }]);
    }
    
    console.log('Resetting Body and Setting Tab to params');
    setRequestBody({});
    setRequestFormat('json');
    setActiveTab('params');
    
    console.groupEnd();
    console.groupEnd();
  };

  const handleTestRoute = async (route: string) => {
    setLoading(true);
    try {
      let response: Response | undefined;
      const testId = '123'; // Example ID for testing
      
      switch (route) {
        case 'getAllClients':
          response = await fetch('/api/client/getAllClients');
          break;
          
        case 'getClientById':
          response = await fetch(`/api/client/getClientById?id=${testId}`);
          break;
          
        case 'createClient':
          response = await fetch('/api/client/createClient', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientName: 'Test Client'
            }),
          });
          break;

        case 'updateClient':
          response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/openApi/proxy`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              method: 'PUT',
              url: `/api/client/updateClient?id=${testId}`,
              queryParams: { id: testId },
              headers: {
                'Content-Type': 'application/json'
              },
              body: {
                clientName: 'Updated Client Name',
                // Add other fields you want to update
                updatedAt: new Date().toISOString()
              }
            })
          });
          break;

        case 'deleteClient':
          response = await fetch(`/api/client/deleteClient?id=${testId}`, {
            method: 'DELETE'
          });
          break;

        default:
          throw new Error('Invalid route');
      }

      if (!response) {
        throw new Error('No response received');
      }

      const data = await response.json();
      setResponse(data);
    } catch (error) {
      console.error('Error testing route:', error);
      setResponse({ status: 500, data: null, error: 'Failed to test route' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Main Header - Compact */}
      <header className="bg-white border-b py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">API Tester</h1>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 rounded border hover:bg-gray-50"
            >
              <FiClock size={14} />
              History
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Flex Layout */}
      <main className="flex-1 container mx-auto px-4 py-2 flex flex-col min-h-0">
        {/* Namespace Account Method Selector - Compact */}
        <section className="mb-2">
          <ApiFormHeader onMethodSelect={handleMethodSelect} />
        </section>

        {/* API Terminal - Flex Layout */}
        <section className="flex-1 bg-white rounded-lg shadow flex flex-col min-h-0">
          {/* Request Section - Fixed Height */}
          <div className="p-3 border-b">
            <div className="flex items-center gap-2 mb-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter request URL"
                className="flex-1 px-2 py-1 border rounded text-sm"
              />
              <button
                onClick={handleSend}
                className="px-4 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center gap-1"
              >
                <FiSend size={14} />
                Send
              </button>
            </div>

            {/* Request Tabs - Compact */}
            <div className="flex border-b text-sm">
              {['params', 'headers', 'body'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as RequestTab)}
                  className={`px-3 py-1 capitalize ${
                    activeTab === tab ? 'border-b-2 border-blue-500' : ''
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Content Area - No Overflow */}
          <div className="flex-1 p-3">
            {/* Request Content */}
            <div className="space-y-4">
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
                  {/* Request Body Section */}
                  <div className="border rounded bg-white">
                    <div className="flex justify-between items-center border-b px-3 py-2">
                      <div className="flex gap-4">
                        <button
                          onClick={() => setRequestFormat('json')}
                          className={`text-sm ${requestFormat === 'json' ? 'text-[#ff6b4a]' : 'text-gray-600'}`}
                        >
                          JSON
                        </button>
                        <button
                          onClick={() => setRequestFormat('form')}
                          className={`text-sm ${requestFormat === 'form' ? 'text-[#ff6b4a]' : 'text-gray-600'}`}
                        >
                          Form
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          try {
                            const formatted = JSON.stringify(
                              typeof requestBody === 'string' 
                                ? JSON.parse(requestBody) 
                                : requestBody, 
                              null, 
                              2
                            );
                            setRequestBody(formatted);
                          } catch (e) {
                            // Silently handle invalid JSON
                            console.log('Could not format: Invalid JSON');
                          }
                        }}
                        className="text-sm text-[#ff6b4a] hover:text-[#ff5436]"
                      >
                        Format
                      </button>
                    </div>

                    {/* Split View Container */}
                    <div className="grid grid-cols-2 divide-x">
                      {/* Left Side - Raw JSON/Text */}
                      <div className="p-4">
                        <textarea
                          value={typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody, null, 2)}
                          onChange={(e) => {
                            if (requestFormat === 'json') {
                              try {
                                // Attempt to parse as JSON, but don't throw if invalid
                                JSON.parse(e.target.value);
                              } catch (error) {
                                // Continue even if invalid JSON
                              }
                            }
                            setRequestBody(e.target.value);
                          }}
                          placeholder={requestFormat === 'json' ? "Enter JSON request body" : "Enter raw request body"}
                          className="w-full h-[300px] font-mono text-sm resize-none focus:outline-none"
                          spellCheck={false}
                        />
                      </div>

                      {/* Right Side - Form View */}
                      <div className="p-4">
                        {requestFormat === 'form' ? (
                          <div className="space-y-2">
                            {Object.entries(
                              typeof requestBody === 'string' 
                                ? JSON.parse(requestBody || '{}') 
                                : requestBody || {}
                            ).map(([key, value], index) => (
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
                                const newBody = typeof requestBody === 'string' 
                                  ? JSON.parse(requestBody || '{}') 
                                  : { ...requestBody };
                                newBody[''] = '';
                                setRequestBody(newBody);
                              }}
                              className="text-[#ff6b4a] hover:text-[#ff5436] flex items-center gap-1"
                            >
                              <FiPlus /> Add Field
                            </button>
                          </div>
                        ) : (
                          <div className="font-mono text-sm whitespace-pre-wrap">
                            {/* Preview formatted JSON */}
                            {(() => {
                              try {
                                return JSON.stringify(
                                  typeof requestBody === 'string' 
                                    ? JSON.parse(requestBody) 
                                    : requestBody,
                                  null, 
                                  2
                                );
                              } catch (e) {
                                return 'Invalid JSON';
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Response Section with Separator */}
            {response && (
              <>
                <div className="my-6 border-t border-gray-200" />
                
                {/* Response Header */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Response</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${
                        response.status < 300 ? 'text-green-600' :
                        response.status < 400 ? 'text-blue-600' :
                        'text-red-600'
                      }`}>
                        {response.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">{response.time || '200ms'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium">{JSON.stringify(response.data).length} bytes</span>
                    </div>
                  </div>
                </div>

                {/* Response Content - Fixed Height with Internal Scroll */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Response Body */}
                  <div className="border rounded bg-white">
                    <div className="flex justify-between items-center border-b px-3 py-1 bg-white">
                      <span className="text-sm font-medium text-gray-700">Body</span>
                      <button
                        onClick={() => downloadJson(response.data, 'response.json')}
                        className="text-sm text-[#ff6b4a] hover:text-[#ff5436]"
                        title="Download JSON"
                      >
                        <FiDownload size={14} />
                      </button>
                    </div>
                    <div className="h-[400px] overflow-auto">
                      <div className="p-2 font-mono text-sm">
                        <JsonTreeView data={response.data} />
                      </div>
                    </div>
                  </div>

                  {/* Response Headers */}
                  <div className="border rounded bg-white">
                    <div className="px-3 py-1 border-b bg-white">
                      <span className="text-sm font-medium text-gray-700">Headers</span>
                    </div>
                    <div className="h-[400px] overflow-auto">
                      <div className="p-2 font-mono text-sm">
                        <JsonTreeView data={response.headers} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* History Sidebar - Keep as is */}
      {showHistory && (
        <div className="fixed right-0 top-0 h-screen w-[400px] bg-white border-l shadow-lg">
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
    </div>
  );
} 