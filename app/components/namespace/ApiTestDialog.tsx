'use client';

import { useState, useEffect } from 'react';
import { FiX, FiSend, FiCopy, FiCheck, FiDownload } from 'react-icons/fi';
import { Namespace, NamespaceAccount, NamespaceMethod, KeyValuePair } from '../../types/namespace';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import JsonTreeView from '../JsonTreeView';
import { JsonSchemaService } from '../../services/jsonSchemaService';
import { RequestSchemaDialog } from '../request-schema-dialog/RequestSchemaDialog';

interface ApiResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
  time?: number;
}

interface ApiTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  method: NamespaceMethod;
  namespace: Namespace;
  accounts: NamespaceAccount[];
  initialAccount?: NamespaceAccount;
}

type RequestTab = 'params' | 'headers' | 'body';
type ResponseTab = 'body' | 'schema';

const ApiTestDialog: React.FC<ApiTestDialogProps> = ({
  isOpen,
  onClose,
  method,
  namespace,
  accounts,
  initialAccount
}) => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [requestBody, setRequestBody] = useState<string>(
    JSON.stringify(method['sample-request'] || {}, null, 2)
  );
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>(
    method['namespace-account-method-queryParams'] || [{ key: '', value: '' }]
  );
  const [headers, setHeaders] = useState<KeyValuePair[]>([
    ...(initialAccount || accounts[0])['namespace-account-header'] || [],
    ...(method['namespace-account-method-header'] || []),
    { key: '', value: '' }
  ]);
  const [activeTab, setActiveTab] = useState<RequestTab>('params');
  const [responseTab, setResponseTab] = useState<ResponseTab>('body');
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [selectedAccount, setSelectedAccount] = useState<NamespaceAccount>(
    initialAccount || accounts[0]
  );
  const [validationInput, setValidationInput] = useState('');
  const [validationResult, setValidationResult] = useState<string[]>([]);
  const [responseBodyTab, setResponseBodyTab] = useState<'body' | 'headers'>('body');
  const [showSchemaDialog, setShowSchemaDialog] = useState(false);

  useEffect(() => {
    if (!validationInput) {
      setValidationResult([]);
      return;
    }

    try {
      const jsonData = JSON.parse(validationInput);
      const schema = method['request-schema'];
      const errors = JsonSchemaService.validate(schema, jsonData);
      setValidationResult(errors);
    } catch (error) {
      setValidationResult(['Invalid JSON format']);
    }
  }, [validationInput, method]);

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

  const handleRequestBodyChange = (value: string) => {
    setRequestBody(value);
    try {
      // Validate JSON format
      JSON.parse(value);
    } catch (error) {
      // Invalid JSON - you could add error state handling here
    }
  };

  const handleSend = async () => {
    try {
      setLoading(true);
      console.log('[Request] Starting API call...');
      const startTime = performance.now();

      // Prepare URL with query parameters
      let url = '';
      if (method['namespace-account-method-url-override']) {
        // If method has URL override, concatenate with account URL
        url = (selectedAccount['namespace-account-url-override'] || '') + 
              method['namespace-account-method-url-override'];
      } else {
        // Otherwise use namespace URL
        url = namespace['namespace-url'];
      }

      const validQueryParams = queryParams.filter(p => p.key && p.value);
      if (validQueryParams.length > 0) {
        const params = new URLSearchParams();
        validQueryParams.forEach(p => params.append(p.key, p.value));
        url += `${url.includes('?') ? '&' : '?'}${params.toString()}`;
      }

      // Prepare headers
      const validHeaders = headers.filter(h => h.key && h.value);
      const headerObj = Object.fromEntries(validHeaders.map(h => [h.key, h.value]));

      // Prepare request object
      let parsedBody = {};
      try {
        parsedBody = JSON.parse(requestBody);
      } catch (error) {
        console.error('Invalid JSON in request body');
        return;
      }

      const apiRequest = {
        url,
        method: method['namespace-account-method-type'],
        headers: headerObj,
        ...(method['namespace-account-method-type'] !== 'GET' && { body: parsedBody })
      };

      // Make the API call through proxy
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/openApi/proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiRequest)
      });

      const responseData = await response.json();
      const endTime = performance.now();

      const apiResponse: ApiResponse = {
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
        time: Math.round(endTime - startTime)
      };

      setResponseHeaders(apiResponse.headers);
      setResponse(apiResponse.data);

      // Generate and save both request and response schemas
      if (response.ok) {
        try {
          console.log('[Schema] Generating and saving schemas');
          
          // Generate both schemas
          const requestSchema = JsonSchemaService.generateSchema(parsedBody);
          const responseSchema = JsonSchemaService.generateSchema(apiResponse.data);
          
          // Update Firebase with both schemas
          const methodRef = doc(db, 'namespace-account-method', method['method-id']);
          await updateDoc(methodRef, {
            'request-schema': requestSchema,
            'response-schema': responseSchema,
            'sample-request': parsedBody,
            'sample-response': apiResponse.data,
            'last-updated': new Date().toISOString()
          });

          // Update local method state
          method['request-schema'] = requestSchema;
          method['response-schema'] = responseSchema;
          method['sample-request'] = parsedBody;
          method['sample-response'] = apiResponse.data;
        } catch (error) {
          console.error('[Schema] Error saving schemas:', error);
        }
      }
    } catch (error) {
      console.error('[Error] Request failed:', error);
      setResponse({ error: 'Failed to send request' });
    } finally {
      setLoading(false);
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-medium text-lg">Test API: {method['namespace-account-method-name']}</h3>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-4">
              <div>
                <span className="font-medium">Namespace:</span> {namespace['namespace-name']}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Account:</span>
                <select
                  value={selectedAccount.id}
                  onChange={(e) => {
                    const account = accounts.find(a => a.id === e.target.value);
                    if (account) {
                      setSelectedAccount(account);
                      // Reset headers with new account's headers
                      setHeaders([
                        ...(account['namespace-account-header'] || []),
                        ...(method['namespace-account-method-header'] || []),
                        { key: '', value: '' }
                      ]);
                    }
                  }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account['namespace-account-name']}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="font-medium">Method:</span> {method['namespace-account-method-type']}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX />
          </button>
        </div>

        {/* Main content area - Split into left and right panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel - API Testing */}
          <div className="w-1/2 p-6 overflow-auto border-r">
            {/* URL Display */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">URL</h4>
              <div className="text-sm font-mono bg-gray-50 p-2 rounded break-all">
                {method['namespace-account-method-url-override'] 
                  ? `${selectedAccount['namespace-account-url-override'] || ''}${method['namespace-account-method-url-override']}`
                  : namespace['namespace-url']
                }
              </div>
            </div>

            {/* Request Tabs */}
            <div className="border-b mb-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('params')}
                  className={`px-4 py-2 ${activeTab === 'params' ? 'border-b-2 border-[#ff6b4a] text-[#ff6b4a]' : 'text-gray-600'}`}
                >
                  Query Params
                </button>
                <button
                  onClick={() => setActiveTab('headers')}
                  className={`px-4 py-2 ${activeTab === 'headers' ? 'border-b-2 border-[#ff6b4a] text-[#ff6b4a]' : 'text-gray-600'}`}
                >
                  Headers
                </button>
                <button
                  onClick={() => setActiveTab('body')}
                  className={`px-4 py-2 ${activeTab === 'body' ? 'border-b-2 border-[#ff6b4a] text-[#ff6b4a]' : 'text-gray-600'}`}
                >
                  Body
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
              {activeTab === 'params' && (
                <div className="space-y-2">
                  {queryParams.map((param, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={param.key}
                        onChange={(e) => {
                          const newParams = [...queryParams];
                          newParams[index].key = e.target.value;
                          setQueryParams(newParams);
                        }}
                        placeholder="Key"
                        className="flex-1 px-3 py-2 border rounded"
                      />
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) => {
                          const newParams = [...queryParams];
                          newParams[index].value = e.target.value;
                          setQueryParams(newParams);
                        }}
                        placeholder="Value"
                        className="flex-1 px-3 py-2 border rounded"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setQueryParams([...queryParams, { key: '', value: '' }])}
                    className="text-[#ff6b4a] hover:text-[#ff5436]"
                  >
                    + Add Parameter
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
                        onChange={(e) => {
                          const newHeaders = [...headers];
                          newHeaders[index].key = e.target.value;
                          setHeaders(newHeaders);
                        }}
                        placeholder="Key"
                        className="flex-1 px-3 py-2 border rounded"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => {
                          const newHeaders = [...headers];
                          newHeaders[index].value = e.target.value;
                          setHeaders(newHeaders);
                        }}
                        placeholder="Value"
                        className="flex-1 px-3 py-2 border rounded"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setHeaders([...headers, { key: '', value: '' }])}
                    className="text-[#ff6b4a] hover:text-[#ff5436]"
                  >
                    + Add Header
                  </button>
                </div>
              )}

              {activeTab === 'body' && (
                <div className="space-y-2">
                  <textarea
                    value={requestBody}
                    onChange={(e) => handleRequestBodyChange(e.target.value)}
                    className="w-full h-64 font-mono text-sm p-2 border rounded"
                    placeholder="Enter request body JSON..."
                    spellCheck={false}
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={loading}
              className="mt-4 w-full py-2 bg-[#ff6b4a] text-white rounded hover:bg-[#ff5436]"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>

          {/* Right panel - Schema & Response */}
          <div className="w-1/2 p-6 overflow-auto">
            {/* Response Tabs */}
            <div className="flex gap-4 border-b mb-4">
              <button
                onClick={() => setResponseTab('body')}
                className={`px-4 py-2 ${responseTab === 'body' ? 'border-b-2 border-[#ff6b4a] text-[#ff6b4a]' : 'text-gray-600'}`}
              >
                Response
              </button>
              <button
                onClick={() => {
                  setShowSchemaDialog(true);
                  setResponseTab('schema');
                }}
                className={`px-4 py-2 ${responseTab === 'schema' ? 'border-b-2 border-[#ff6b4a] text-[#ff6b4a]' : 'text-gray-600'}`}
              >
                Schema Validation
              </button>
            </div>

            {/* Response Content */}
            {responseTab === 'body' ? (
              <div className="space-y-4">
                <div className="flex gap-4 border-b">
                  <button
                    onClick={() => setResponseBodyTab('body')}
                    className={`px-4 py-2 ${responseBodyTab === 'body' ? 'border-b-2 border-[#ff6b4a] text-[#ff6b4a]' : 'text-gray-600'}`}
                  >
                    Response Body
                  </button>
                  <button
                    onClick={() => setResponseBodyTab('headers')}
                    className={`px-4 py-2 ${responseBodyTab === 'headers' ? 'border-b-2 border-[#ff6b4a] text-[#ff6b4a]' : 'text-gray-600'}`}
                  >
                    Response Headers
                  </button>
                </div>

                <div className="border rounded bg-gray-50 p-4 overflow-auto">
                  {responseBodyTab === 'body' ? (
                    response ? (
                      <JsonTreeView data={response} />
                    ) : (
                      <div className="text-gray-500 text-center">
                        No response yet. Click Send Request to test the API.
                      </div>
                    )
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(responseHeaders).map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="font-medium min-w-[200px]">{key}:</span>
                          <span className="text-gray-600">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Schema validation view is now in a separate dialog
              </div>
            )}

            {/* Schema Dialog */}
            {showSchemaDialog && (
              <RequestSchemaDialog
                title="Response Data & Schema"
                method={method}
                currentResponse={response}
                onClose={() => {
                  setShowSchemaDialog(false);
                  setResponseTab('body');
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestDialog; 