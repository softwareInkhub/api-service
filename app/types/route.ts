export interface RouteConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  group: string;
}

export interface RequestBody {
  [key: string]: any;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: { [key: string]: string };
  data: any;
  error?: string;
} 