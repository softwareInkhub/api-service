'use client';

import { useState } from 'react';
import { RouteConfig, RequestBody, ApiResponse } from '../types/route';
import { FiCopy, FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface RouteTestProps {
  route: RouteConfig;
}

const routes = [
  {
    name: 'getAllClients',
    method: 'GET',
    path: '/api/client/getAllClients',
    description: 'Get all clients'
  },
  {
    name: 'getClientById',
    method: 'GET',
    path: '/api/client/getClientById',
    description: 'Get client by ID'
  },
  {
    name: 'updateClientById',
    method: 'PUT',
    path: '/api/client/updateClient',
    description: 'Update client'
  },
  {
    name: 'deleteClientById',
    method: 'DELETE',
    path: '/api/client/deleteClient',
    description: 'Delete client'
  },
  {
    name: 'createClient',
    method: 'POST',
    path: '/api/client/createClient',
    description: 'Create a new client',
    body: {
      clientName: 'Test Client'
    }
  },
];

export default function RouteTest({ route }: RouteTestProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Set default request body based on route
  const getDefaultRequestBody = () => {
    if (route.path === '/api/clients/createClient') {
      return JSON.stringify({
        clientName: "string", // Only field needed in request body
        // These fields will be added by backend:
        // uuid: "auto-generated",
        // createdAt: "auto-generated",
        // createdBy: "system",
        // tags: [],
        // status: {
        //   isActive: true,
        //   lastUpdated: "auto-generated"
        // }
      }, null, 2);
    }
    return '{}';
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

      const data = await response.json();
      
      // Log response details
      console.log('Response:', {
        status: response.status,
        data
      });

      setResponse({
        status: response.status,
        data,
      });
    } catch (error) {
      console.error('Error:', error);
      setResponse({
        status: 500,
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
      setResponse({ status: 500, data: null, error: 'Failed to test route' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
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
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-700">Responses</h3>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600">Response content type:</span>
                    <select className="ml-2 text-sm border rounded-md p-1.5">
                      <option>application/json</option>
                    </select>
                  </div>
                </div>
                <div className="relative">
                  <pre className="p-4 bg-gray-50 rounded-md border overflow-auto font-mono text-sm">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(response.data, null, 2))}
                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiCopy size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}