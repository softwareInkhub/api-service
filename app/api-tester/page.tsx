'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSend, FiPlus, FiTrash2, FiClock, FiSearch, FiMaximize2, FiMinimize2, FiDownload, FiRefreshCw, FiCopy } from 'react-icons/fi';
import JsonTreeView from '../components/JsonTreeView';
import { NamespaceMethod } from '../types/namespace';
import { namespaceService } from '../services/namespaceService';
import { Namespace, NamespaceAccount } from '../types/namespace';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { SchemaEditor } from '../components/schema-editor/SchemaEditor';
import { saveSchema } from '../services/jsonSchemaService';

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

interface ApiExecution {
  uuid: string;
  'execution-status': string;
  'execution-start-time': string;
  'execution-time-taken': number;
  'execution-response-size': number;
  'response-status': number;
  'pagination-page': number;
  url: string;
  method: string;
}

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
  const [selectedMethod, setSelectedMethod] = useState<NamespaceMethod | null>(null);
  const [selectedNamespace, setSelectedNamespace] = useState<Namespace | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<NamespaceAccount | null>(null);
  const [loopLoading, setLoopLoading] = useState(false);
  const [iterationCount, setIterationCount] = useState<string>('');
  const [executions, setExecutions] = useState<ApiExecution[]>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [executionStartTime, setExecutionStartTime] = useState<number | null>(null);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [accounts, setAccounts] = useState<NamespaceAccount[]>([]);
  const [methods, setMethods] = useState<NamespaceMethod[]>([]);
  const [selectedNamespaceId, setSelectedNamespaceId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');

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

  useEffect(() => {
    loadNamespaces();
  }, []);

  useEffect(() => {
    if (selectedNamespaceId) {
      loadAccountsAndMethods(selectedNamespaceId);
    } else {
      setAccounts([]);
      setMethods([]);
      setSelectedAccountId('');
      setSelectedMethodId('');
    }
  }, [selectedNamespaceId]);

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
      console.log('[Request] Preparing to send request');
      
      // Validate required selections first
      if (!selectedMethod) {
        console.error('[Error] No method selected');
        setResponse({
          status: 400,
          data: { error: 'Please select a method before sending request' },
          headers: {},
          time: 0
        });
        return; // Exit early
      }

      setLoading(true);
      const startTime = performance.now();
      console.log('[Request] Current selected method:', selectedMethod);
      
      // Now we know selectedMethod exists
      const methodId = selectedMethod['method-id'];
      console.log('[Request] Using method ID:', methodId);

      // Build final URL with query parameters
      let finalUrl = url;
      const validQueryParams = queryParams.filter(p => p.key && p.value);
      if (validQueryParams.length > 0) {
        const params = new URLSearchParams();
        validQueryParams.forEach(p => params.append(p.key, p.value));
        finalUrl += `${finalUrl.includes('?') ? '&' : '?'}${params.toString()}`;
      }

      // Prepare headers
      const validHeaders = headers.filter(h => h.key && h.value);
      const headerObj = Object.fromEntries(validHeaders.map(h => [h.key, h.value]));

      // Prepare request object
      const apiRequest = {
        namespaceMethodId: methodId,
        namespaceId: selectedNamespace?.id || '',
        namespaceAccountId: selectedAccount?.id || '',
        method,
        url: finalUrl,
        queryParams: queryParams.filter(p => p.key).reduce((acc, { key, value }) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>),
        headers: headerObj,
        body: requestBody
      };

      console.log('[Request] Request configuration:', apiRequest);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/openApi/proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiRequest)
      });

      console.log('[Response] Status:', response.status);
      const responseData = await response.json();
      console.log('[Response] Data:', responseData);

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      console.log('[Response] Time taken:', responseTime, 'ms');

      // Update response state
      setResponse({
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
        time: responseTime
      });

      // Save to history
      const historyItem: RequestHistory = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        method,
        url,
        queryParams: queryParams.filter(p => p.key),
        headers: headers.filter(h => h.key),
        body: apiRequest,
        response: {
          status: response.status,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries())
        }
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 50));

      // Save sample data if method is selected
      if (response.ok && selectedMethod['method-id']) {
        try {
          console.log('[Sample] Saving request/response samples for method:', selectedMethod['method-id']);
          
          // Save raw request and response without wrapping
          const sampleRequest = requestBody;
          const sampleResponse = responseData;

          // Update Firebase with raw data
          const methodRef = doc(db, 'namespace-account-method', selectedMethod['method-id']);
          await updateDoc(methodRef, {
            'sample-request': sampleRequest,
            'sample-response': sampleResponse
          });

          console.log('[Sample] Successfully saved sample data');
        } catch (error) {
          console.error('[Sample] Error saving sample data:', error);
        }
      }

      // Inside handleSend function, where we save the schemas
      if (selectedMethod['method-id']) {
        try {
          const methodRef = doc(db, 'namespace-account-method', selectedMethod['method-id']);
          
          // Save both request and response schemas to the method document
          await updateDoc(methodRef, {
            'request-schema': {
              type: 'object',
              properties: {
                method: { type: 'string' },
                endpoint: { type: 'string' },
                headers: { type: 'object' },
                body: requestBody ? 
                  (typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody) : 
                  { type: 'object' }
              }
            },
            'response-schema': {
              type: 'object',
              properties: {
                status: { type: 'number' },
                data: responseData ? inferSchema(responseData) : { type: 'object' }
              }
            }
          });

          console.log('[Schema] Saved request and response schemas for method:', selectedMethod['method-id']);
        } catch (error) {
          console.error('[Schema] Error saving schemas:', error);
        }
      }

    } catch (error) {
      console.error('[Error] Request failed:', error);
      setResponse({
        status: 500,
        data: { error: 'Failed to send request' },
        headers: {},
        time: 0
      });
    } finally {
      console.log('[Request] Request cycle complete');
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

  const handleMethodSelect = (methodId: string) => {
    const methodToSelect = methods.find(m => m.id === methodId);
    if (!methodToSelect) return;

    // Set the selected method first
    setSelectedMethod({
      ...methodToSelect,
      'method-id': methodId
    });

    // Reset all request data first
    setQueryParams([{ key: '', value: '' }]);
    setHeaders([{ key: '', value: '' }]);
    setRequestBody({});
    setUrl(''); // Reset URL first

    // Update the API terminal data
    setMethod(methodToSelect['namespace-account-method-type']);
    
    // Build fresh URL
    let builtUrl = '';
    const selectedAccount = accounts.find(a => a.id === selectedAccountId);
    const selectedNamespace = namespaces.find(n => n.id === selectedNamespaceId);

    if (methodToSelect['namespace-account-method-url-override']) {
      // If method has URL override, concatenate with account URL
      const accountBaseUrl = selectedAccount?.['namespace-account-url-override'] || '';
      const methodUrlOverride = methodToSelect['namespace-account-method-url-override'];
      
      // Ensure we don't double-concatenate URLs
      if (methodUrlOverride.startsWith('http')) {
        builtUrl = methodUrlOverride;
      } else {
        builtUrl = accountBaseUrl + (methodUrlOverride.startsWith('/') ? methodUrlOverride : '/' + methodUrlOverride);
      }
    } else {
      // Otherwise use namespace URL
      builtUrl = selectedNamespace?.['namespace-url'] || '';
    }
    
    // Set fresh URL
    setUrl(builtUrl);

    // Set method's query parameters if they exist
    if (methodToSelect['namespace-account-method-queryParams']?.length > 0) {
      setQueryParams([
        ...methodToSelect['namespace-account-method-queryParams'],
        { key: '', value: '' }
      ]);
    }
    
    // Merge headers from account and method
    const mergedHeaders = [
      ...(selectedAccount?.['namespace-account-header'] || []),
      ...(methodToSelect['namespace-account-method-header'] || []),
      { key: '', value: '' }
    ];
    setHeaders(mergedHeaders);

    // Set request body if it exists
    if (methodToSelect['sample-request']) {
      setRequestBody(methodToSelect['sample-request']);
    }

    setSelectedMethodId(methodId);
  };

  // Also update the namespace and account selection handlers
  const handleNamespaceSelect = (namespaceId: string) => {
    setSelectedNamespaceId(namespaceId);
    const namespace = namespaces.find(n => n.id === namespaceId);
    if (namespace) {
      setSelectedNamespace(namespace);
    }
    // Reset all dependent selections when namespace changes
    setSelectedAccount(null);
    setSelectedMethod(null);
    setSelectedAccountId('');
    setSelectedMethodId('');
  };

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccountId(accountId);
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setSelectedAccount(account);
      
      // If there's a selected method, update the URL with new account
      if (selectedMethod && selectedMethod['namespace-account-method-url-override']) {
        const builtUrl = (account['namespace-account-url-override'] || '') + 
                        selectedMethod['namespace-account-method-url-override'];
        setUrl(builtUrl);

        // Update headers with new account's headers
        setHeaders([
          ...(account['namespace-account-header'] || []),
          ...(selectedMethod['namespace-account-method-header'] || []),
          { key: '', value: '' }
        ]);
      }
    }
  };

  // Add useEffect to update URL when account changes
  useEffect(() => {
    if (selectedMethodId && selectedAccountId) {
      const selectedMethod = methods.find(m => m.id === selectedMethodId);
      if (selectedMethod?.['namespace-account-method-url-override']) {
        const selectedAccount = accounts.find(a => a.id === selectedAccountId);
        const builtUrl = (selectedAccount?.['namespace-account-url-override'] || '') + 
                        selectedMethod['namespace-account-method-url-override'];
        setUrl(builtUrl);
      }
    }
  }, [selectedAccountId, selectedMethodId, methods, accounts]);

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

  const fetchExecutions = async () => {
    if (!executionStartTime) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/openApi/executions/paginated/${executionStartTime}`);
      const data = await response.json();
      
      console.log('[Executions] Updated:', {
        count: data.length,
        statuses: data.map((exec: ApiExecution) => ({
          page: exec['pagination-page'],
          status: exec['execution-status'],
          time: exec['execution-time-taken']
        }))
      });
      
      setExecutions(data);
      
      if (data.every((exec: ApiExecution) => ['Completed', 'Failed'].includes(exec['execution-status']))) {
        console.log('[Executions] All pages completed, stopping poll');
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    } catch (error) {
      console.error('[Error] Fetching executions failed:', error);
    }
  };

  const handleSendLoop = async () => {
    try {
        setLoopLoading(true);
        setExecutionStartTime(Date.now());
        setCurrentExecutionId(null);
        setExecutions([]);
        
        const requestStartTime = performance.now();
        
        console.log('[Paginated] Starting request:', {
            method,
            url,
            maxIterations: iterationCount,
            queryParams,
            headers,
            body: requestBody
        });

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/openApi/proxy/paginated`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br'
            },
            body: JSON.stringify({
                namespaceMethodId: selectedMethod?.['method-id'] || '',
                namespaceId: selectedNamespace?.id || '',
                namespaceAccountId: selectedAccount?.id || '',
                method,
                url,
                maxIterations: iterationCount ? parseInt(iterationCount) : undefined,
                queryParams: queryParams.filter(p => p.key).reduce((acc, { key, value }) => {
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, string>),
                headers: headers.filter(h => h.key).reduce((acc, { key, value }) => {
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, string>),
                body: requestBody
            })
        });

        const responseData = await response.json();
        const endTime = performance.now();
        const responseTime = Math.round(endTime - requestStartTime);

        if (!response.ok) {
            throw new Error(responseData.error || 'Failed to process request');
        }

        console.log('[Paginated] First iteration response:', {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            metadata: responseData.metadata,
            data: responseData.data,
            time: `${responseTime}ms`
        });

        if (responseData.metadata?.executionId) {
            console.log('[Execution] Starting background polling, ID:', responseData.metadata.executionId);
            setCurrentExecutionId(responseData.metadata.executionId);
            const interval = setInterval(fetchExecutions, 1000);
            setPollingInterval(interval);
        }

        setResponse({
            status: responseData.status,
            data: responseData.data || null,
            headers: Object.fromEntries(response.headers.entries()),
            time: `${responseTime}ms`
        });

    } catch (error) {
        console.error('[Error] Paginated request failed:', error);
        setResponse({
            status: 500,
            data: { 
                error: 'Paginated request failed', 
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            headers: {},
            time: '0ms'
        });
    } finally {
        setLoopLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const loadNamespaces = async () => {
    const data = await namespaceService.getNamespaces();
    setNamespaces(data);
  };

  const loadAccountsAndMethods = async (namespaceId: string) => {
    const [accountsData, methodsData] = await Promise.all([
      namespaceService.getNamespaceAccounts(namespaceId),
      namespaceService.getNamespaceMethods(namespaceId)
    ]);
    setAccounts(accountsData);
    setMethods(methodsData);
  };

  // Helper function to infer schema from data
  const inferSchema = (data: any): any => {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        items: data.length > 0 ? inferSchema(data[0]) : { type: 'object' }
      };
    }
    
    if (typeof data === 'object' && data !== null) {
      const properties: any = {};
      Object.entries(data).forEach(([key, value]) => {
        properties[key] = inferSchema(value);
      });
      return {
        type: 'object',
        properties
      };
    }

    return { type: typeof data };
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
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
        {/* Namespace, Account, Method Selection */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Namespace
              </label>
              <select
                value={selectedNamespaceId}
                onChange={(e) => handleNamespaceSelect(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="">Select Namespace</option>
                {namespaces.map((ns) => (
                  <option key={ns.id} value={ns.id}>
                    {ns['namespace-name']}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => handleAccountSelect(e.target.value)}
                className="w-full border rounded p-2"
                disabled={!selectedNamespaceId}
              >
                <option value="">Select Account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc['namespace-account-name']}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Method
              </label>
              <select
                value={selectedMethodId}
                onChange={(e) => handleMethodSelect(e.target.value)}
                className="w-full border rounded p-2"
                disabled={!selectedNamespaceId}
              >
                <option value="">Select Method</option>
                {methods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method['namespace-account-method-name']}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSend}
                  disabled={loading || loopLoading}
                  className="px-4 py-2 bg-[#ff6b4a] text-white rounded-md flex items-center gap-2 hover:bg-[#ff5436] disabled:opacity-50"
                >
                  {loading ? 'Sending...' : (
                    <>
                      <FiSend /> Send
                    </>
                  )}
                </button>
                
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={iterationCount}
                    onChange={(e) => setIterationCount(e.target.value)}
                    placeholder="Max iterations"
                    className="w-32 px-2 py-1 border rounded text-sm"
                    min="1"
                  />
                  <button
                    onClick={handleSendLoop}
                    disabled={loading || loopLoading}
                    className="px-4 py-2 bg-[#4a90ff] text-white rounded-md flex items-center gap-2 hover:bg-[#3672ff] disabled:opacity-50"
                  >
                    {loopLoading ? 'Processing...' : (
                      <>
                        <FiRefreshCw /> Send Loop
                      </>
                    )}
                  </button>
                </div>
              </div>
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

            {/* Response Section */}
            <div className="mt-4 border rounded-lg overflow-hidden bg-white shadow-sm">
              {/* Status Header */}
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">Response</h3>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">{response?.time}ms</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    response?.status < 300 ? 'bg-green-100 text-green-800' :
                    response?.status < 400 ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Status: {response?.status}
                  </span>
                </div>
              </div>

              {/* Content Area - Fixed Height */}
              <div className="grid grid-cols-2 divide-x h-[400px]">
                {/* Response Body */}
                <div className="flex flex-col">
                  <div className="px-4 py-2 border-b bg-gray-50 flex items-center justify-between">
                    <span className="font-medium text-gray-700">Body</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(response?.data, null, 2))}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Copy Response"
                    >
                      <FiCopy size={16} />
                    </button>
                  </div>
                  <div className="p-4 overflow-auto h-[calc(400px-40px)]">
                    {response?.data && (
                      <JsonTreeView
                        data={response.data}
                        expandLevel={3}
                        className="border rounded bg-gray-50 p-3"
                      />
                    )}
                  </div>
                </div>

                {/* Response Headers */}
                <div className="flex flex-col">
                  <div className="px-4 py-2 border-b bg-gray-50 flex items-center justify-between">
                    <span className="font-medium text-gray-700">Headers</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(
                        Object.entries(response?.headers || {})
                          .map(([key, value]) => `${key}: ${value}`)
                          .join('\n')
                      )}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Copy Headers"
                    >
                      <FiCopy size={16} />
                    </button>
                  </div>
                  <div className="p-4 overflow-auto h-[calc(400px-40px)]">
                    <JsonTreeView
                      data={response?.headers || {}}
                      expandLevel={3}
                      className="border rounded bg-gray-50 p-3"
                    />
                  </div>
                </div>
              </div>
            </div>

            {executions.length > 0 && (
              <div className="mt-4 border rounded-lg bg-white p-4 shadow-sm">
                <h3 className="text-lg font-medium mb-4">Execution Details</h3>
                <div className="space-y-4">
                  {executions.map((execution, index) => (
                    <div key={execution.uuid} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Execution #{index + 1}</span>
                        <span className={`px-2 py-1 rounded text-sm ${
                          execution['execution-status'] === 'Completed' ? 'bg-green-100 text-green-800' :
                          execution['execution-status'] === 'Failed' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {execution['execution-status']}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><span className="font-medium">Start Time:</span> {new Date(execution['execution-start-time']).toLocaleString()}</p>
                          <p><span className="font-medium">Duration:</span> {execution['execution-time-taken']}ms</p>
                          <p><span className="font-medium">Response Size:</span> {execution['execution-response-size']} bytes</p>
                        </div>
                        <div>
                          <p><span className="font-medium">Status:</span> {execution['response-status']}</p>
                          <p><span className="font-medium">URL:</span> {execution.url}</p>
                          <p><span className="font-medium">Method:</span> {execution.method}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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