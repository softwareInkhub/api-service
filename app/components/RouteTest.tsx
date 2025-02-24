'use client';

import { useState } from 'react';
import { RouteConfig, RequestBody, ApiResponse } from '../types/route';
import { FiCopy, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import JsonEditor from '../components/schema-editor/JsonEditor';

interface RouteTestProps {
  route: RouteConfig;
}

export default function RouteTest({ route }: RouteTestProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Set default request body based on route
  const getDefaultRequestBody = () => {
    switch (route.path) {
      case '/api/createSchema':
        return JSON.stringify({
          schemaName: "TestSchema",
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              age: { type: "number" }
            }
          }
        }, null, 2);

      case '/api/getSchema':
      case '/api/deleteSchema':
        return JSON.stringify({
          uuid: "<schema_uuid>"
        }, null, 2);

      case '/api/updateSchema':
        return JSON.stringify({
          uuid: "<schema_uuid>",
          updateData: {
            schemaName: "UpdatedSchema",
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                age: { type: "number" },
                email: { type: "string" }
              }
            }
          }
        }, null, 2);

      case '/api/createData':
        return JSON.stringify({
          schemaId: "<schema_uuid>",
          data: {
            name: "John Doe",
            age: 30
          }
        }, null, 2);

      case '/api/getData':
      case '/api/deleteData':
        return JSON.stringify({
          schemaId: "<schema_uuid>",
          uuid: "<data_uuid>"
        }, null, 2);

      case '/api/updateData':
        return JSON.stringify({
          schemaId: "<schema_uuid>",
          uuid: "<data_uuid>",
          data: {
            name: "Jane Doe",
            age: 25
          }
        }, null, 2);

      case '/api/getAllData':
        return JSON.stringify({
          schemaId: "<schema_uuid>"
        }, null, 2);

      case '/api/getChildSchemaData':
        return JSON.stringify({
          parentSchemaId: "<parent_schema_uuid>",
          childSchemaId: "<child_schema_uuid>"
        }, null, 2);

      case '/api/searchChildData':
        return JSON.stringify({
          childSchemaId: "<child_schema_uuid>",
          query: "search_term"
        }, null, 2);

      default:
        return '{}';
    }
  };

  const [requestBody, setRequestBody] = useState(getDefaultRequestBody());
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'bg-[#61affe] hover:bg-[#4fa3ef]',
      POST: 'bg-[#49cc90] hover:bg-[#41b883]',
      PUT: 'bg-[#fca130] hover:bg-[#f59324]',
      DELETE: 'bg-[#f93e3e] hover:bg-[#e53935]'
    };
    return colors[method as keyof typeof colors] || 'bg-gray-500';
  };

  const getMethodBg = (method: string) => {
    const colors = {
      GET: 'bg-[#ebf3fb]',
      POST: 'bg-[#e8f6f0]',
      PUT: 'bg-[#fff6eb]',
      DELETE: 'bg-[#fae7e7]'
    };
    return colors[method as keyof typeof colors] || 'bg-gray-50';
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      let url = route.path;
      
      // For getClientById, updateClient, and deleteClient, convert path param to query param
      if (route.path.includes('{id}')) {
        const baseUrl = route.path.split('/{id}')[0];
        url = `${baseUrl}?id=${pathParams.id}`;
      }

      url = `${process.env.NEXT_PUBLIC_API_URL}${url}`;

      let body: RequestBody = {};
      try {
        body = JSON.parse(requestBody);
      } catch (e) {
        console.error('Invalid JSON:', e);
        setResponse({
          status: 400,
          statusText: 'Error',
          headers: {},
          data: null,
          error: 'Invalid JSON in request body'
        });
        return;
      }

      // Log request details
      console.log('Request:', {
        url,
        method: route.method,
        body: route.method !== 'GET' ? body : undefined
      });

      const response = await fetch(url, {
        method: route.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: route.method !== 'GET' ? JSON.stringify(body) : undefined,
      });

      const responseData = await response.json();
      
      // Get response headers
      const headers: { [key: string]: string } = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Log response details
      console.log('Response:', {
        status: response.status,
        data: responseData
      });

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers,
        data: responseData
      });
    } catch (error) {
      console.error('Error:', error);
      setResponse({
        status: 500,
        statusText: 'Error',
        headers: {},
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestRoute = async (route: string) => {
    setLoading(true);
    try {
      let response: Response | undefined;
      
      switch (route) {
        case 'getAllClients':
          response = await fetch('/api/client/getAllClients');
          break;
          
        case 'getClientById':
          response = await fetch('/api/client/getClientById');
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
      setResponse({
        status: 500,
        statusText: 'Error',
        headers: {},
        data: null,
        error: 'Failed to test route'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg bg-white shadow-sm mb-4">
      {/* Route Header */}
      <div className="p-4 flex items-center justify-between">
        <div className={`${getMethodBg(route.method)} transition-colors duration-200`}>
          <div className="flex items-center p-2">
            <span className={`${getMethodColor(route.method)} px-3 py-1 rounded text-white font-medium transition-colors duration-200`}>
              {route.method}
            </span>
            <span className="ml-3 font-mono text-sm text-gray-700">{route.path}</span>
            <span className="ml-4 text-gray-600 text-sm">{route.description}</span>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-auto p-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isExpanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t">
          <div className="p-4">
            {/* Parameters Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-700">Parameters</h3>
                <button
                  onClick={handleTest}
                  className="px-4 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors"
                >
                  Try it out
                </button>
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 border bg-gray-50 text-gray-600 font-medium">Name</th>
                    <th className="text-left p-3 border bg-gray-50 text-gray-600 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {route.path.split('/').map(part => {
                    if (part.startsWith('{') && part.endsWith('}')) {
                      const param = part.slice(1, -1);
                      return (
                        <tr key={param} className="border-b">
                          <td className="p-3 border align-top">
                            <div>
                              <span className="font-mono text-sm">{param}</span>
                              <span className="text-red-500 ml-1">*</span>
                              <div className="text-xs text-gray-500 mt-1">
                                integer($int64)
                                <br />
                                (path)
                              </div>
                            </div>
                          </td>
                          <td className="p-3 border">
                            <input
                              type="text"
                              className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              value={pathParams[param] || ''}
                              onChange={(e) => setPathParams({
                                ...pathParams,
                                [param]: e.target.value
                              })}
                              placeholder={`ID of ${param} that needs to be updated`}
                            />
                          </td>
                        </tr>
                      );
                    }
                    return null;
                  })}
                </tbody>
              </table>
            </div>

            {/* Request Body Section */}
            {route.method !== 'GET' && (
              <div className="mb-6">
                <div className="mb-2">
                  <div className="flex items-center">
                    <span className="text-gray-700">body</span>
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    object
                    <br />
                    (body)
                  </div>
                </div>
                <div className="flex items-center mb-2">
                  <span className="text-sm text-gray-600">Parameter content type:</span>
                  <select className="ml-2 text-sm border rounded-md p-1.5">
                    <option>application/json</option>
                  </select>
                </div>
                <div className="relative">
                  <div className="text-xs text-gray-500 mb-2">
                    Example Value | Model
                  </div>
                  <div className="bg-[#1e1e1e] text-white rounded p-4">
                    <pre className="font-mono text-sm whitespace-pre">
                      {route.path === '/api/clients/createClient' ? 
`{
  // Request body fields
  "clientName": "string",

  // Auto-generated fields (for reference)
  "uuid": "auto-generated",
  "createdAt": "auto-generated",
  "createdBy": "system",
  "tags": [],
  "status": {
    "isActive": true,
    "lastUpdated": "auto-generated"
  }
}`
                        : requestBody}
                    </pre>
                  </div>
                  <textarea
                    className="w-full h-48 p-3 border rounded-md font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all mt-2"
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder="Enter request body..."
                  />
                </div>
              </div>
            )}

            {/* Response Section */}
            {response && (
              <div className="border-t">
                {/* Response Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-700">Response</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        response.status < 300 ? 'bg-green-100 text-green-800' :
                        response.status < 400 ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {response.status} {response.statusText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Response Content */}
                <div className="grid grid-cols-2 divide-x">
                  {/* Response Body */}
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-700">Response Body</h4>
                      <button
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(response.data, null, 2))}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy Response"
                      >
                        <FiCopy size={16} />
                      </button>
                    </div>
                    <div className="h-[400px]">
                      <JsonEditor
                        value={response.data}
                        onChange={() => {}}
                        readOnly={true}
                      />
                    </div>
                  </div>

                  {/* Response Headers */}
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-700">Response Headers</h4>
                      <button
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(response.headers, null, 2))}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy Headers"
                      >
                        <FiCopy size={16} />
                      </button>
                    </div>
                    <div className="h-[400px] overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-4 font-medium text-gray-600">Header</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-600">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {Object.entries(response.headers).map(([key, value]) => (
                            <tr key={key} className="hover:bg-gray-50">
                              <td className="py-2 px-4 font-mono text-gray-600">{key}</td>
                              <td className="py-2 px-4 font-mono text-gray-800">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}