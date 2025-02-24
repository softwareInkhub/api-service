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
  'namespace-account-method-name': string;
  'namespace-account-method-type': HttpMethod;
  'namespace-account-method-url-override': string;
  'namespace-account-method-queryParams': KeyValuePair[];
  'namespace-account-method-header'?: KeyValuePair[];
  'namespace-account-method-id': string;
  'namespace-id': string;
  'method-id': string;
  id?: string;
  'sample-request'?: any;
  'sample-response'?: any;
  'request-schema'?: JsonSchema;
  'response-schema'?: JsonSchema;
}

interface JsonSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}

// Add FirebaseMethod type for database operations
export interface FirebaseMethod {
  id: string;
  'namespace-account-method-name': string;
  'namespace-account-method-type': HttpMethod;
  'namespace-account-method-url-override': string;
  'namespace-account-method-queryParams': KeyValuePair[];
  'namespace-account-method-header'?: KeyValuePair[];
  'namespace-account-method-id': string;
  'namespace-id': string;
  'method-id'?: string;
  'sample-request'?: any;
  'sample-response'?: any;
  'request-schema'?: JsonSchema;
  'response-schema'?: JsonSchema;
} 