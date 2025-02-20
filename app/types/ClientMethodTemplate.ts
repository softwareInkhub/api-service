export interface ClientMethodTemplate {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  queryParams: {
    key: string;
    value: string;
  }[];
  headers: {
    key: string;
    value: string;
  }[];
  requestBody: any;
  expectedResponse?: {
    body?: any;
    headers?: any;
    status?: number;
  };
  createdAt: number;
  updatedAt: number;
} 