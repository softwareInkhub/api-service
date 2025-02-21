'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiChevronDown } from 'react-icons/fi';
import { Namespace, NamespaceAccount, NamespaceMethod } from '../types/namespace';
import { namespaceService } from '../services/namespaceService';
import NamespaceModal from '../components/namespace/NamespaceModal';
import AccountModal from '../components/namespace/AccountModal';
import MethodModal from '../components/namespace/MethodModal';
import ViewModal from '../components/namespace/ViewModal';

interface HeaderSelectorProps {
  onMethodSelect: (method: NamespaceMethod) => void;
}

export default function NamespacePage({ onMethodSelect }: HeaderSelectorProps) {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [accounts, setAccounts] = useState<NamespaceAccount[]>([]);
  const [methods, setMethods] = useState<NamespaceMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNamespaceModal, setShowNamespaceModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [editingNamespace, setEditingNamespace] = useState<Namespace | null>(null);
  const [editingAccount, setEditingAccount] = useState<NamespaceAccount | null>(null);
  const [editingMethod, setEditingMethod] = useState<NamespaceMethod | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [viewingNamespace, setViewingNamespace] = useState<Namespace | null>(null);
  const [viewingAccount, setViewingAccount] = useState<NamespaceAccount | null>(null);
  const [viewingMethod, setViewingMethod] = useState<NamespaceMethod | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  // Load namespaces on mount
  useEffect(() => {
    loadNamespaces();
  }, []);

  // Load accounts and methods when namespace is selected
  useEffect(() => {
    if (selectedNamespace) {
      loadNamespaceAccounts(selectedNamespace);
      loadNamespaceMethods(selectedNamespace);
    } else {
      setAccounts([]);
      setMethods([]);
      setSelectedAccount('');
      setSelectedMethod('');
    }
  }, [selectedNamespace]);

  // Add this effect to reset modals when namespace selection changes
  useEffect(() => {
    setShowMethodModal(false);
    setShowAccountModal(false);
    setEditingMethod(null);
    setEditingAccount(null);
  }, [selectedNamespace]);

  // Add this useEffect to debug modal state changes
  useEffect(() => {
    if (showMethodModal) {
      console.log('Method modal opened by:', new Error().stack);
    }
  }, [showMethodModal]);

  const loadNamespaces = async () => {
    try {
      const data = await namespaceService.getNamespaces();
      setNamespaces(data);
    } catch (error) {
      console.error('Error loading namespaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNamespaceAccounts = async (namespaceId: string) => {
    const data = await namespaceService.getNamespaceAccounts(namespaceId);
    setAccounts(data);
  };

  const loadNamespaceMethods = async (namespaceId: string) => {
    const data = await namespaceService.getNamespaceMethods(namespaceId);
    setMethods(data);
  };

  const handleCreateNamespace = async (data: Omit<Namespace, 'namespace-id'>) => {
    try {
      await namespaceService.createNamespace(data);
      loadNamespaces();
      setShowNamespaceModal(false);
    } catch (error) {
      console.error('Error creating namespace:', error);
    }
  };

  const handleCreateAccount = async (data: Omit<NamespaceAccount, 'namespace-account-id'>) => {
    try {
      await namespaceService.createNamespaceAccount(data);
      if (selectedNamespace) {
        loadNamespaceAccounts(selectedNamespace);
      }
      setShowAccountModal(false);
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const handleCreateMethod = async (data: Omit<NamespaceMethod, 'namespace-account-method-id'>) => {
    try {
      await namespaceService.createNamespaceMethod(data);
      if (selectedNamespace) {
        loadNamespaceMethods(selectedNamespace);
      }
      setShowMethodModal(false);
    } catch (error) {
      console.error('Error creating method:', error);
    }
  };

  // Add delete handlers
  const handleDeleteNamespace = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this namespace?')) {
      try {
        await namespaceService.deleteNamespace(id);
        if (selectedNamespace === id) {
          setSelectedNamespace('');
        }
        loadNamespaces();
      } catch (error) {
        console.error('Error deleting namespace:', error);
      }
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await namespaceService.deleteNamespaceAccount(id);
        if (selectedNamespace) {
          loadNamespaceAccounts(selectedNamespace);
        }
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this method?')) {
      try {
        await namespaceService.deleteNamespaceMethod(id);
        if (selectedNamespace) {
          loadNamespaceMethods(selectedNamespace);
        }
      } catch (error) {
        console.error('Error deleting method:', error);
      }
    }
  };

  // Update the view handlers
  const handleViewNamespace = (namespace: Namespace) => {
    setViewingNamespace(namespace);
  };

  const handleViewAccount = (account: NamespaceAccount) => {
    setViewingAccount(account);
  };

  const handleViewMethod = (method: NamespaceMethod) => {
    setViewingMethod(method);
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    const selectedMethodData = methods.find(m => m['namespace-account-method-id'] === methodId);
    if (selectedMethodData) {
      onMethodSelect(selectedMethodData);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Namespace Management</h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Namespaces List */}
        <div className="col-span-3 border rounded-lg bg-white">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-medium">Namespaces</h2>
            <button
              onClick={() => {
                setEditingNamespace(null);
                setShowNamespaceModal(true);
              }}
              className="text-[#ff6b4a] hover:text-[#ff5436]"
            >
              <FiPlus />
            </button>
          </div>
          <div className="p-2">
            {namespaces.map(ns => (
              <div key={ns['namespace-id']} className="relative group">
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const newSelectedNamespace = selectedNamespace === ns['namespace-id'] ? '' : ns['namespace-id'];
                    setSelectedNamespace(newSelectedNamespace);
                    
                    if (newSelectedNamespace !== selectedNamespace) {
                      setShowMethodModal(false);
                      setShowAccountModal(false);
                      setEditingMethod(null);
                      setEditingAccount(null);
                    }
                  }}
                  className={`p-3 rounded-lg cursor-pointer relative ${
                    selectedNamespace === ns['namespace-id']
                      ? 'bg-[#ff6b4a] text-white'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{ns['namespace-name']}</div>
                  <div className="text-sm truncate">{ns['namespace-url']}</div>
                  
                  <div className={`absolute right-2 top-2 ${
                    selectedNamespace === ns['namespace-id'] ? 'flex' : 'hidden group-hover:flex'
                  } gap-1 z-10`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewNamespace(ns);
                      }}
                      className={`p-1 ${
                        selectedNamespace === ns['namespace-id'] 
                          ? 'text-white hover:text-blue-200' 
                          : 'text-gray-500 hover:text-blue-600'
                      }`}
                    >
                      <FiEye size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNamespace(ns);
                        setShowNamespaceModal(true);
                      }}
                      className={`p-1 ${
                        selectedNamespace === ns['namespace-id']
                          ? 'text-white hover:text-gray-200'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNamespace(ns['namespace-id']);
                      }}
                      className={`p-1 ${
                        selectedNamespace === ns['namespace-id']
                          ? 'text-white hover:text-red-200'
                          : 'text-gray-500 hover:text-red-600'
                      }`}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accounts List */}
        <div className="col-span-4 border rounded-lg bg-white">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-medium">Accounts</h2>
            {selectedNamespace && (
              <button
                onClick={() => {
                  setEditingAccount(null);
                  setShowAccountModal(true);
                }}
                className="text-[#ff6b4a] hover:text-[#ff5436]"
              >
                <FiPlus />
              </button>
            )}
          </div>
          <div className="p-2">
            {accounts.map(account => (
              <div key={account['namespace-account-id']} className="relative group">
                <div className="p-3 rounded-lg hover:bg-gray-50">
                  <div className="font-medium">{account['namespace-account-name']}</div>
                  <div className="text-sm text-gray-600">
                    {account['namespace-account-url-override']}
                  </div>
                </div>
                <div className="absolute right-2 top-2 hidden group-hover:flex gap-1">
                  <button
                    onClick={() => handleViewAccount(account)}
                    className="p-1 text-gray-500 hover:text-blue-600"
                  >
                    <FiEye size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAccount(account);
                      setShowAccountModal(true);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAccount(account['namespace-account-id']);
                    }}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Methods List */}
        <div className="col-span-5 border rounded-lg bg-white">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-medium">Methods</h2>
            {selectedNamespace && (
              <button
                onClick={() => {
                  setEditingMethod(null);
                  setShowMethodModal(true);
                }}
                className="text-[#ff6b4a] hover:text-[#ff5436]"
              >
                <FiPlus />
              </button>
            )}
          </div>
          <div className="p-2">
            {methods.map(method => (
              <div key={method['namespace-account-method-id']} className="relative group">
                <div className="p-3 rounded-lg hover:bg-gray-50">
                  <div className="font-medium">
                    {method['namespace-account-method-name']}
                  </div>
                  <div className="text-sm text-gray-600">
                    {method['namespace-account-method-url-override']}
                  </div>
                </div>
                <div className="absolute right-2 top-2 hidden group-hover:flex gap-1">
                  <button
                    onClick={() => handleViewMethod(method)}
                    className="p-1 text-gray-500 hover:text-blue-600"
                  >
                    <FiEye size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingMethod(method);
                      setShowMethodModal(true);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteMethod(method['namespace-account-method-id'])}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View Modals */}
        <ViewModal
          isOpen={!!viewingNamespace}
          onClose={() => setViewingNamespace(null)}
          title="View Namespace"
          data={viewingNamespace || {}}
        />

        <ViewModal
          isOpen={!!viewingAccount}
          onClose={() => setViewingAccount(null)}
          title="View Account"
          data={viewingAccount || {}}
        />

        <ViewModal
          isOpen={!!viewingMethod}
          onClose={() => setViewingMethod(null)}
          title="View Method"
          data={viewingMethod || {}}
        />

        {/* Edit Modals */}
        <NamespaceModal
          isOpen={showNamespaceModal}
          onClose={() => {
            setShowNamespaceModal(false);
            setEditingNamespace(null);
          }}
          onSave={handleCreateNamespace}
          initialData={editingNamespace || undefined}
        />

        {selectedNamespace && (
          <>
            <AccountModal
              isOpen={showAccountModal}
              onClose={() => {
                setShowAccountModal(false);
                setEditingAccount(null);
              }}
              onSave={handleCreateAccount}
              namespaceId={selectedNamespace}
              namespaceName={namespaces.find(n => n['namespace-id'] === selectedNamespace)?.['namespace-name'] || ''}
              initialData={editingAccount || undefined}
            />

            <MethodModal
              isOpen={showMethodModal}
              onClose={() => {
                setShowMethodModal(false);
                setEditingMethod(null);
              }}
              onSave={handleCreateMethod}
              namespaceId={selectedNamespace}
              initialData={editingMethod || undefined}
            />
          </>
        )}
      </div>

      <div className="flex gap-4 items-center p-4 bg-white border-t">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Namespace</label>
          <select
            value={selectedNamespace || ''}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Select Namespace</option>
            {namespaces.map((ns) => (
              <option key={ns['namespace-id']} value={ns['namespace-id']}>
                {ns['namespace-name']}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
          <select
            value={selectedAccount || ''}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full border rounded p-2"
            disabled={!selectedNamespace}
          >
            <option value="">Select Account</option>
            {accounts.map((acc) => (
              <option key={acc['namespace-account-id']} value={acc['namespace-account-id']}>
                {acc['namespace-account-name']}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
          <select
            value={selectedMethod}
            onChange={(e) => handleMethodSelect(e.target.value)}
            className="w-full border rounded p-2"
            disabled={!selectedAccount}
          >
            <option value="">Select Method</option>
            {methods.map((method) => (
              <option key={method['namespace-account-method-id']} value={method['namespace-account-method-id']}>
                {method['namespace-account-method-name']}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
} 