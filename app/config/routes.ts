import { RouteConfig } from '../types/route';

export const routes: RouteConfig[] = [
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
    path: '/api/clients/updateClient/{id}',
    description: 'Update client',
    group: 'clients'
  },
  {
    method: 'DELETE',
    path: '/api/clients/deleteClient/{id}',
    description: 'Delete client',
    group: 'clients'
  }
]; 