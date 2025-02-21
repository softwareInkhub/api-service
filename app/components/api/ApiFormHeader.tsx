'use client';

import { useState, useEffect } from 'react';
import { FiCheck } from 'react-icons/fi';
import { Namespace, NamespaceAccount, NamespaceMethod } from '../../types/namespace';
import { namespaceService } from '../../services/namespaceService';

interface ApiFormHeaderProps {
  onMethodSelect: (method: NamespaceMethod) => void;
}

export default function ApiFormHeader({ onMethodSelect }: ApiFormHeaderProps) {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [accounts, setAccounts] = useState<NamespaceAccount[]>([]);
  const [methods, setMethods] = useState<NamespaceMethod[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  useEffect(() => {
    loadNamespaces();
  }, []);

  useEffect(() => {
    if (selectedNamespace) {
      console.group('Namespace Selection');
      console.log('Selected Namespace ID:', selectedNamespace);
      const namespace = namespaces.find(ns => ns['namespace-id'] === selectedNamespace);
      console.log('Namespace Details:', {
        name: namespace?.['namespace-name'],
        url: namespace?.['namespace-url']
      });
      console.groupEnd();
      
      loadAccountsAndMethods(selectedNamespace);
    } else {
      setAccounts([]);
      setMethods([]);
      setSelectedAccount('');
      setSelectedMethod('');
    }
  }, [selectedNamespace]);

  const loadNamespaces = async () => {
    const data = await namespaceService.getNamespaces();
    console.group('Loading Namespaces');
    console.log('Available Namespaces:', data.map(ns => ({
      id: ns['namespace-id'],
      name: ns['namespace-name']
    })));
    console.groupEnd();
    setNamespaces(data);
  };

  const loadAccountsAndMethods = async (namespaceId: string) => {
    const [accountsData, methodsData] = await Promise.all([
      namespaceService.getNamespaceAccounts(namespaceId),
      namespaceService.getNamespaceMethods(namespaceId)
    ]);

    console.group('Loading Data for Namespace');
    console.log('Available Accounts:', accountsData);
    console.log('Available Methods:', methodsData);
    console.groupEnd();

    setAccounts(accountsData);
    setMethods(methodsData);
  };

  const handleApply = () => {
    console.group('Applying Method Configuration');
    
    const selectedMethodData = methods.find(m => m.id === selectedMethod);
    if (selectedMethodData) {
      const namespace = namespaces.find(ns => ns['namespace-id'] === selectedNamespace);
      const account = accounts.find(acc => acc['namespace-account-id'] === selectedAccount);
      
      console.log('Full Configuration:', {
        namespace: {
          id: namespace?.['namespace-id'],
          name: namespace?.['namespace-name'],
          url: namespace?.['namespace-url']
        },
        account: {
          id: account?.['namespace-account-id'],
          name: account?.['namespace-account-name'],
          url: account?.['namespace-account-url-override'],
          headers: account?.['namespace-account-header']
        },
        method: selectedMethodData
      });
      
      onMethodSelect(selectedMethodData);
    } else {
      console.log('No method selected');
    }
    
    console.groupEnd();
  };

  return (
    <div className="bg-white border-b mb-4">
      <div className="container mx-auto">
        <div className="flex gap-4 items-end p-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Namespace</label>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option key="default-namespace" value="">Select Namespace</option>
              {namespaces.map((ns) => (
                <option key={ns.id} value={ns['namespace-id']}>
                  {ns['namespace-name']}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full border rounded p-2"
              disabled={!selectedNamespace}
            >
              <option key="default-account" value="">Select Account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc['namespace-account-id']}>
                  {acc['namespace-account-name']}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full border rounded p-2"
              disabled={!selectedNamespace}
            >
              <option key="default-method" value="">Select Method</option>
              {methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method['namespace-account-method-name']}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleApply}
            disabled={!selectedMethod}
            className={`px-4 py-2 rounded flex items-center gap-2 ${
              selectedMethod 
                ? 'bg-[#ff6b4a] text-white hover:bg-[#ff5436]' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <FiCheck />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
} 