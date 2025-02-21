'use client';

import React, { useState } from 'react';
import { NamespaceTemplate, Namespace, NamespaceAccount, NamespaceMethod } from '../../types/namespace';

interface TemplateMappingProps {
  template: NamespaceTemplate;
  existingNamespaces: Namespace[];
  existingAccounts: NamespaceAccount[];
  existingMethods: NamespaceMethod[];
  onMapComplete: (
    template: NamespaceTemplate,
    mapping: {
      namespaceId?: string;
      accountMappings: Record<string, string>;
      methodMappings: Record<string, string>;
    }
  ) => Promise<void>;
}

export default function TemplateMapping({
  template,
  existingNamespaces,
  existingAccounts,
  existingMethods,
  onMapComplete
}: TemplateMappingProps) {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('new');
  const [accountMappings, setAccountMappings] = useState<Record<string, string>>({});
  const [methodMappings, setMethodMappings] = useState<Record<string, string>>({});

  const findMatchingNamespace = () => {
    return existingNamespaces.find(n => 
      n['namespace-url'] === template.template.namespace['namespace-url']
    );
  };

  const findMatchingAccount = (templateAccount: typeof template.template.accounts[0]) => {
    return existingAccounts.find(a => {
      const headerMatch = templateAccount['namespace-account-header'].every(th =>
        a['namespace-account-header'].some(h => h.key === th.key && h.value === th.value)
      );
      return headerMatch && a['namespace-account-url-override'] === templateAccount['namespace-account-url-override'];
    });
  };

  const findMatchingMethod = (templateMethod: typeof template.template.methods[0]) => {
    return existingMethods.find(m => {
      const paramsMatch = templateMethod['namespace-account-method-queryParams'].every(tp =>
        m['namespace-account-method-queryParams'].some(p => p.key === tp.key && p.value === tp.value)
      );
      return paramsMatch && 
        m['namespace-account-method-type'] === templateMethod['namespace-account-method-type'] &&
        m['namespace-account-method-url-override'] === templateMethod['namespace-account-method-url-override'];
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Map Template</h2>
        
        {/* Namespace Selection */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Namespace</h3>
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="new">Create New Namespace</option>
            {existingNamespaces.map(n => (
              <option key={n.id} value={n.id}>{n['namespace-name']}</option>
            ))}
          </select>
        </div>

        {/* Account Mappings */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Account Mappings</h3>
          {template.template.accounts.map((templateAccount, index) => (
            <div key={index} className="mb-2">
              <select
                value={accountMappings[templateAccount['namespace-account-name']] || ''}
                onChange={(e) => setAccountMappings(prev => ({
                  ...prev,
                  [templateAccount['namespace-account-name']]: e.target.value
                }))}
                className="w-full border rounded p-2"
              >
                <option value="">Create New Account</option>
                {existingAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a['namespace-account-name']}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Method Mappings */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Method Mappings</h3>
          {template.template.methods.map((templateMethod, index) => (
            <div key={index} className="mb-2">
              <select
                value={methodMappings[templateMethod['namespace-account-method-name']] || ''}
                onChange={(e) => setMethodMappings(prev => ({
                  ...prev,
                  [templateMethod['namespace-account-method-name']]: e.target.value
                }))}
                className="w-full border rounded p-2"
              >
                <option value="">Create New Method</option>
                {existingMethods.map(m => (
                  <option key={m.id} value={m.id}>{m['namespace-account-method-name']}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onMapComplete(template, {
              namespaceId: selectedNamespace === 'new' ? undefined : selectedNamespace,
              accountMappings,
              methodMappings
            })}
            className="px-4 py-2 bg-[#ff6b4a] text-white rounded"
          >
            Apply Template
          </button>
        </div>
      </div>
    </div>
  );
} 