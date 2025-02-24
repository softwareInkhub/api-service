import { useState } from 'react';
import { FiX, FiSend, FiCopy, FiCheck } from 'react-icons/fi';
import { Namespace, NamespaceAccount, NamespaceMethod, KeyValuePair } from '../../types/namespace';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import JsonTreeView from '../JsonTreeView';
import { JsonSchemaService } from '../../services/jsonSchemaService';

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
type ResponseTab = 'body' | 'headers';

export default function ApiTestDialog({ 
  isOpen, 
  onClose, 
  method, 
  namespace, 
  accounts,
  initialAccount 
}: ApiTestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [requestBody, setRequestBody] = useState(method['sample-request'] || {});
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
      const apiRequest = {
        url,
        method: method['namespace-account-method-type'],
        headers: headerObj,
        ...(method['namespace-account-method-type'] !== 'GET' && { body: requestBody })
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

      // Save sample data
      if (response.ok) {
        try {
          console.log('[Sample] Saving request/response samples');
          const methodRef = doc(db, 'namespace-account-method', method['method-id']);
          await updateDoc(methodRef, {
            'sample-request': requestBody,
            'sample-response': apiResponse.data,
            'request-schema': JsonSchemaService.generateSchema(requestBody),
            'response-schema': JsonSchemaService.generateSchema(apiResponse.data)
          });
        } catch (error) {
          console.error('[Sample] Error saving sample data:', error);
        }
      }
    } catch (error) {
      console.error('[Error] Request failed:', error);
      setResponse({ error: 'Failed to send request' });
    } finally {
      setLoading(false);
    }
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

        {/* Content */}
        <div className="flex-1 p-6 grid grid-cols-2 gap-6 overflow-hidden">
          {/* Request Section */}
          <div className="flex flex-col">
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
                <textarea
                  value={JSON.stringify(requestBody, null, 2)}
                  onChange={(e) => {
                    try {
                      setRequestBody(JSON.parse(e.target.value));
                    } catch (error) {
                      // Handle invalid JSON
                    }
                  }}
                  className="w-full h-full font-mono text-sm p-2 border rounded"
                  spellCheck={false}
                />
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={loading}
              className="mt-4 px-4 py-2 bg-[#ff6b4a] text-white rounded flex items-center justify-center gap-2"
            >
              <FiSend /> {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>

          {/* Response Section */}
          <div className="flex flex-col">
            <div className="border-b mb-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setResponseTab('body')}
                  className={`px-4 py-2 ${responseTab === 'body' ? 'border-b-2 border-[#ff6b4a] text-[#ff6b4a]' : 'text-gray-600'}`}
                >
                  Response Body
                </button>
                <button
                  onClick={() => setResponseTab('headers')}
                  className={`px-4 py-2 ${responseTab === 'headers' ? 'border-b-2 border-[#ff6b4a] text-[#ff6b4a]' : 'text-gray-600'}`}
                >
                  Response Headers
                </button>
              </div>
            </div>

            <div className="flex-1 border rounded bg-gray-50 overflow-auto">
              {responseTab === 'body' ? (
                response ? (
                  <JsonTreeView data={response} />
                ) : (
                  <div className="text-gray-500 text-center mt-4">
                    No response yet. Click Send Request to test the API.
                  </div>
                )
              ) : (
                <div className="p-4">
                  {Object.entries(responseHeaders).map(([key, value]) => (
                    <div key={key} className="mb-2">
                      <span className="font-medium">{key}:</span> {value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 