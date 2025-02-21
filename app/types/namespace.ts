export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

export interface KeyValuePair {
  key: string;
  value: string;
}

// New template interfaces
export interface NamespaceTemplate {
  id: string;
  name: string;
  template: {
    namespace: {
      'namespace-name': string;
      'namespace-url': string;
      'namespace-id': string;
    };
    accounts: Array<{
      'namespace-account-name': string;
      'namespace-account-url-override': string;
      'namespace-account-header': KeyValuePair[];
      'namespace-account-id': string;
      'namespace-id': string;
    }>;
    methods: Array<{
      'namespace-account-method-name': string;
      'namespace-account-method-type': HttpMethod;
      'namespace-account-method-url-override': string;
      'namespace-account-method-queryParams': KeyValuePair[];
      'namespace-account-method-id': string;
      'namespace-id': string;
    }>;
  };
}

export interface Namespace {
  id: string;
  'namespace-id': string;
  'namespace-name': string;
  'namespace-url': string;
}

export interface NamespaceAccount {
  id: string;
  'namespace-id': string;
  'namespace-account-id': string;
  'namespace-account-name': string;
  'namespace-account-url-override': string;
  'namespace-account-header': KeyValuePair[];
}

export interface NamespaceMethod {
  id: string;
  'namespace-id': string;
  'namespace-account-method-id': string;
  'namespace-account-method-name': string;
  'namespace-account-method-type': HttpMethod;
  'namespace-account-method-url-override': string;
  'namespace-account-method-queryParams': KeyValuePair[];
} 