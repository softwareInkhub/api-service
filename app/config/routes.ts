import { RouteConfig } from '../types/route';

export const routes: RouteConfig[] = [
  // Schema Routes
  {
    method: 'POST',
    path: '/api/createSchema',
    description: 'Create new schema',
    group: 'schema'
  },
  {
    method: 'POST',
    path: '/api/getSchema',
    description: 'Get schema by ID',
    group: 'schema'
  },
  {
    method: 'GET',
    path: '/api/getAllSchemas',
    description: 'Get all schemas',
    group: 'schema'
  },
  {
    method: 'PUT',
    path: '/api/updateSchema',
    description: 'Update schema',
    group: 'schema'
  },
  {
    method: 'DELETE',
    path: '/api/deleteSchema',
    description: 'Delete schema',
    group: 'schema'
  },
  {
    method: 'PUT',
    path: '/api/updateSchemaTableRef',
    description: 'Update schema table reference',
    group: 'schema'
  },

  // Data Routes
  {
    method: 'POST',
    path: '/api/createTable',
    description: 'Create new table',
    group: 'data'
  },
  {
    method: 'POST',
    path: '/api/createData',
    description: 'Create new data',
    group: 'data'
  },
  {
    method: 'POST',
    path: '/api/getData',
    description: 'Get data by ID',
    group: 'data'
  },
  {
    method: 'PUT',
    path: '/api/updateData',
    description: 'Update data',
    group: 'data'
  },
  {
    method: 'DELETE',
    path: '/api/deleteData',
    description: 'Delete data',
    group: 'data'
  },
  {
    method: 'POST',
    path: '/api/getAllData',
    description: 'Get all data',
    group: 'data'
  },
  {
    method: 'POST',
    path: '/api/getChildSchemaData',
    description: 'Get child schema data',
    group: 'data'
  },
  {
    method: 'POST',
    path: '/api/searchChildData',
    description: 'Search child data',
    group: 'data'
  },

  // Client Routes
  {
    method: 'POST',
    path: '/api/clients/createClient',
    description: 'Create new client',
    group: 'clients'
  },
  {
    method: 'GET',
    path: '/api/clients/getAllClients',
    description: 'Get all clients',
    group: 'clients'
  },
  {
    method: 'GET',
    path: '/api/clients/getClientById/{id}',
    description: 'Get client by ID',
    group: 'clients'
  },
  {
    method: 'PUT',
    path: '/api/clients/updateClientById/{id}',
    description: 'Update client',
    group: 'clients'
  },
  {
    method: 'DELETE',
    path: '/api/clients/deleteClientById/{id}',
    description: 'Delete client',
    group: 'clients'
  }
]; 