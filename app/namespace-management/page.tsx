'use client';

import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronRight, FiSave, FiDownload, FiCopy, FiCheck } from 'react-icons/fi';
import ExpandableCard from '../components/shared/ExpandableCard';
import EditableTable from '../components/shared/EditableTable';
import { 
  Namespace, 
  NamespaceAccount, 
  NamespaceMethod,
  KeyValuePair,
  FirebaseMethod
} from '../types/namespace';
import { HttpMethod } from '../types/namespace';
import KeyValueTable from '../components/shared/KeyValueTable';
import TabHeader from '../components/shared/TabHeader';
import { JsonSchemaService } from '../services/jsonSchemaService';
import { makeApiCall } from '../services/apiService';
import ApiTestDialog from '../components/namespace/ApiTestDialog';

const KeyValueEditor = ({ 
  pairs = [], 
  onChange, 
  title,
  methodId,
  accountId,
  collectionName
}: { 
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  title: string;
  methodId?: string;
  accountId?: string;
  collectionName: 'namespace-account-method' | 'namespace-account';
}) => {
  const [localPairs, setLocalPairs] = useState(pairs);
  const [isDirty, setIsDirty] = useState(false);

  const handleAdd = () => {
    setLocalPairs([...localPairs, { key: '', value: '' }]);
    setIsDirty(true);
  };

  const handleRemove = (index: number) => {
    setLocalPairs(localPairs.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleChange = (index: number, field: 'key' | 'value', value: string) => {
    const newPairs = [...localPairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    setLocalPairs(newPairs);
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const docRef = doc(db, collectionName, methodId || accountId || '');
      const updateField = collectionName === 'namespace-account-method' 
        ? (title === 'Headers' ? 'namespace-account-method-header' : 'namespace-account-method-queryParams')
        : 'namespace-account-header';
      
      await updateDoc(docRef, {
        [updateField]: localPairs
      });
      onChange(localPairs);
      setIsDirty(false);
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-700">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="text-sm text-[#ff6b4a] hover:text-[#ff5436] flex items-center gap-1"
          >
            <FiPlus size={14} /> Add Item
          </button>
          {isDirty && (
            <button
              onClick={handleSave}
              className="text-sm bg-[#ff6b4a] text-white px-3 py-1 rounded hover:bg-[#ff5436] flex items-center gap-1"
            >
              <FiSave size={14} /> Save Changes
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {localPairs.map((pair, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              value={pair.key}
              onChange={(e) => handleChange(index, 'key', e.target.value)}
              placeholder="Key"
              className="flex-1 px-3 py-2 border rounded text-sm"
            />
            <input
              type="text"
              value={pair.value}
              onChange={(e) => handleChange(index, 'value', e.target.value)}
              placeholder="Value"
              className="flex-1 px-3 py-2 border rounded text-sm"
            />
            <button
              onClick={() => handleRemove(index)}
              className="text-gray-400 hover:text-red-500"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function NamespaceManagement() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [accounts, setAccounts] = useState<Record<string, NamespaceAccount[]>>({});
  const [methods, setMethods] = useState<Record<string, NamespaceMethod[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [expandedMethodId, setExpandedMethodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonModalData, setJsonModalData] = useState<{ title: string; data: any } | null>(null);
  const [schemaTestData, setSchemaTestData] = useState<string>('');
  const [schemaValidationErrors, setSchemaValidationErrors] = useState<string[]>([]);
  const [editedData, setEditedData] = useState<string>('');
  const [editedSchema, setEditedSchema] = useState<string>('');
  const [topSectionHeight, setTopSectionHeight] = useState(45);
  const [middleSectionHeight, setMiddleSectionHeight] = useState(35);
  const [copiedState, setCopiedState] = useState<Record<string, boolean>>({
    data: false,
    schema: false,
    validate: false
  });
  const [showApiTest, setShowApiTest] = useState(false);
  const [selectedTestMethod, setSelectedTestMethod] = useState<NamespaceMethod | null>(null);

  useEffect(() => {
    loadNamespaces();
  }, []);

  useEffect(() => {
    if (expandedId) {
      loadAccountsAndMethods(expandedId);
    }
  }, [expandedId]);

  const loadNamespaces = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'namespace'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Namespace[];
      setNamespaces(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading namespaces:', error);
      setLoading(false);
    }
  };

  const loadAccountsAndMethods = async (namespaceId: string) => {
    try {
      // Load accounts
      const accountsQuery = query(collection(db, 'namespace-account'), where('namespace-id', '==', namespaceId));
      const accountsSnapshot = await getDocs(accountsQuery);
      const accountsData = accountsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NamespaceAccount[];
      setAccounts(prev => ({ ...prev, [namespaceId]: accountsData }));

      // Load methods
      const methodsQuery = query(collection(db, 'namespace-account-method'), where('namespace-id', '==', namespaceId));
      const methodsSnapshot = await getDocs(methodsQuery);
      const methodsData = methodsSnapshot.docs.map(doc => ({
        "method-id": doc.id,
        ...doc.data()
      })) as NamespaceMethod[];
      setMethods(prev => ({ ...prev, [namespaceId]: methodsData }));
    } catch (error) {
      console.error('Error loading accounts and methods:', error);
    }
  };

  const handleAddNamespace = async () => {
    try {
      const id = uuidv4();
      const newNamespace = {
        id,
        'namespace-name': 'New Namespace',
        'namespace-url': '',
      };
      await setDoc(doc(db, 'namespace', id), newNamespace);
      loadNamespaces();
    } catch (error) {
      console.error('Error adding namespace:', error);
    }
  };

  const handleUpdateNamespace = async (namespaceId: string, key: string, value: string) => {
    try {
      await updateDoc(doc(db, 'namespace', namespaceId), {
        [key]: value
      });
      loadNamespaces();
    } catch (error) {
      console.error('Error updating namespace:', error);
    }
  };

  const handleDeleteNamespace = async (namespaceId: string) => {
    if (!confirm('Are you sure you want to delete this namespace?')) return;
    try {
      await deleteDoc(doc(db, 'namespace', namespaceId));
      loadNamespaces();
    } catch (error) {
      console.error('Error deleting namespace:', error);
    }
  };

  const handleAddAccount = async (namespaceId: string) => {
    try {
      const id = uuidv4();
      const newAccount = {
        id,
        'namespace-id': namespaceId,
        'namespace-account-name': 'New Account',
        'namespace-account-url-override': '',
        'namespace-account-header': []
      };
      await setDoc(doc(db, 'namespace-account', id), newAccount);
      loadAccountsAndMethods(namespaceId);
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleUpdateAccount = async (accountId: string, namespaceId: string, key: string, value: string) => {
    try {
      await updateDoc(doc(db, 'namespace-account', accountId), {
        [key]: value
      });
      loadAccountsAndMethods(namespaceId);
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const handleDeleteAccount = async (accountId: string, namespaceId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    try {
      await deleteDoc(doc(db, 'namespace-account', accountId));
      loadAccountsAndMethods(namespaceId);
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const handleAddMethod = async (namespaceId: string) => {
    try {
      const methodId = uuidv4();
      const newMethod = {
        id: methodId,
        'method-id': methodId,
        'namespace-account-method-id': methodId,
        'namespace-id': namespaceId,
        'namespace-account-method-name': 'New Method',
        'namespace-account-method-type': HttpMethod.GET,
        'namespace-account-method-url-override': '',
        'namespace-account-method-queryParams': []
      };
      await setDoc(doc(db, 'namespace-account-method', methodId), newMethod);
      loadAccountsAndMethods(namespaceId);
    } catch (error) {
      console.error('Error adding method:', error);
    }
  };

  const handleUpdateMethod = async (methodId: string, namespaceId: string, key: string, value: any) => {
    try {
      const methodRef = doc(db, 'namespace-account-method', methodId);
      const updateData: Record<string, any> = { [key]: value };
      
      if (key === 'sample-request') {
        updateData['request-schema'] = JsonSchemaService.generateSchema(value);
      }
      if (key === 'sample-response') {
        updateData['sample-response'] = value;
        updateData['response-schema'] = JsonSchemaService.generateSchema(value);
      }

      await updateDoc(methodRef, updateData);
      loadAccountsAndMethods(namespaceId);
    } catch (error) {
      console.error('Error updating method:', error);
    }
  };

  const handleDeleteMethod = async (methodId: string, namespaceId: string) => {
    if (!confirm('Are you sure you want to delete this method?')) return;
    try {
      await deleteDoc(doc(db, 'namespace-account-method', methodId));
      loadAccountsAndMethods(namespaceId);
    } catch (error) {
      console.error('Error deleting method:', error);
    }
  };

  const handleDuplicateNamespace = async (namespace: Namespace) => {
    try {
      const { id, ...namespaceData } = namespace;
      await addDoc(collection(db, 'namespace'), {
        ...namespaceData,
        'namespace-id': uuidv4(),
        'namespace-name': `${namespaceData['namespace-name']} (Copy)`
      });
      loadNamespaces();
    } catch (error) {
      console.error('Error duplicating namespace:', error);
    }
  };

  const handleDuplicateAccount = async (account: NamespaceAccount, namespaceId: string) => {
    try {
      const { id, ...accountData } = account;
      await addDoc(collection(db, 'namespace-account'), {
        ...accountData,
        'namespace-account-name': `${accountData['namespace-account-name']} (Copy)`,
        'namespace-account-id': uuidv4()
      });
      loadAccountsAndMethods(namespaceId);
    } catch (error) {
      console.error('Error duplicating account:', error);
    }
  };

  const handleDuplicateMethod = async (method: NamespaceMethod, namespaceId: string) => {
    try {
      const newMethodId = uuidv4();
      
      // Omit schema and sample data fields first
      const {
        'sample-request': _req,
        'request-schema': _reqSchema,
        'sample-response': _res,
        'response-schema': _resSchema,
        ...baseMethod
      } = method;

      // Create new method data with null schemas
      const methodData: FirebaseMethod = {
        ...baseMethod,
        id: newMethodId,
        'method-id': newMethodId,
        'namespace-account-method-id': newMethodId,
        'namespace-account-method-name': `${method['namespace-account-method-name']} (Copy)`,
        'namespace-id': namespaceId,
        'sample-request': null,
        'sample-response': null
      };

      delete methodData['method-id'];
      await setDoc(doc(db, 'namespace-account-method', newMethodId), methodData);
      loadAccountsAndMethods(namespaceId);
    } catch (error) {
      console.error('Error duplicating method:', error);
    }
  };

  const handleUpdateHeaders = async (accountId: string, namespaceId: string, headers: KeyValuePair[]) => {
    try {
      await updateDoc(doc(db, 'namespace-account', accountId), {
        'namespace-account-header': headers
      });
      loadAccountsAndMethods(namespaceId);
    } catch (error) {
      console.error('Error updating headers:', error);
    }
  };

  const handleUpdateQueryParams = async (methodId: string, namespaceId: string, params: KeyValuePair[]) => {
    try {
      await updateDoc(doc(db, 'namespace-account-method', methodId), {
        'namespace-account-method-queryParams': params
      });
      loadAccountsAndMethods(namespaceId);
    } catch (error) {
      console.error('Error updating query params:', error);
    }
  };

  const showPrettyJson = (title: string, method: NamespaceMethod, type: 'request' | 'response') => {
    const data = type === 'request' ? 
      (method['sample-request'] || null) : 
      (method['sample-response'] || null);
    
    const schema = data ? JsonSchemaService.generateSchema(data) : null;
    
    setJsonModalData({
      title,
      data: {
        data,
        schema,
        methodId: method['method-id'],
        namespaceId: method['namespace-id']
      }
    });
    setEditedData(data ? JSON.stringify(data, null, 2) : '');
    setEditedSchema(schema ? JSON.stringify(schema, null, 2) : '');
    setSchemaTestData('');
    setSchemaValidationErrors([]);
    setShowJsonModal(true);
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedState(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleApiCall = async (method: NamespaceMethod, requestData: any) => {
    try {
      // Make the API call
      const response = await makeApiCall(method, requestData);
      
      // Generate schemas first
      const requestSchema = JsonSchemaService.generateSchema(requestData);
      const responseSchema = JsonSchemaService.generateSchema(response);
      
      // Update Firebase with complete method data
      const methodRef = doc(db, 'namespace-account-method', method['method-id']);
      const updateData = {
        'method-id': method['method-id'],
        'namespace-id': method['namespace-id'],
        'sample-request': requestData,
        'request-schema': requestSchema,
        'sample-response': response,
        'response-schema': responseSchema,
        'last-updated': new Date().toISOString()
      };

      // Use setDoc instead of updateDoc to ensure complete document update
      await setDoc(methodRef, updateData, { merge: true });

      // Refresh UI
      await loadAccountsAndMethods(method['namespace-id']);
      
      // Update modal if open
      if (showJsonModal && jsonModalData?.data?.methodId === method['method-id']) {
        const updatedMethod = {
          ...method,
          ...updateData
        };
        showPrettyJson(
          jsonModalData.title,
          updatedMethod,
          jsonModalData.title.toLowerCase().includes('response') ? 'response' : 'request'
        );
      }

      return response;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  return (
    <div className="p-6">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Namespace Management</h1>
          <button
            onClick={() => handleAddNamespace()}
            className="px-4 py-2 bg-[#ff6b4a] text-white rounded flex items-center gap-2"
          >
            <FiPlus /> Add Namespace
          </button>
        </div>

        <div className="space-y-4">
          {namespaces.map((namespace) => (
            <ExpandableCard
              key={namespace.id}
              title={namespace['namespace-name']}
              subtitle={namespace['namespace-url']}
              isExpanded={expandedId === namespace.id}
              onToggle={() => setExpandedId(expandedId === namespace.id ? null : namespace.id)}
              onDelete={() => handleDeleteNamespace(namespace.id)}
              onDuplicate={() => handleDuplicateNamespace(namespace)}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Namespace Details</h3>
                  <EditableTable
                    data={{
                      ...namespace,
                      'namespace-id': namespace.id
                    }}
                    onUpdate={(key, value) => handleUpdateNamespace(namespace.id, key, value)}
                    excludeKeys={[]}
                    readOnlyKeys={['id', 'namespace-id']}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Accounts</h3>
                    <button
                      onClick={() => handleAddAccount(namespace.id)}
                      className="text-sm text-[#ff6b4a] hover:text-[#ff5436] flex items-center gap-1"
                    >
                      <FiPlus /> Add Account
                    </button>
                  </div>
                  <div className="space-y-2">
                    {accounts[namespace.id]?.map((account) => (
                      <ExpandableCard
                        key={account.id}
                        title={account['namespace-account-name']}
                        subtitle={account['namespace-account-url-override']}
                        isExpanded={expandedAccountId === account.id}
                        onToggle={() => setExpandedAccountId(expandedAccountId === account.id ? null : account.id)}
                        onDelete={() => handleDeleteAccount(account.id, namespace.id)}
                        onDuplicate={() => handleDuplicateAccount(account, namespace.id)}
                      >
                        <div className="space-y-4">
                          <EditableTable
                            data={account}
                            onUpdate={(key, value) => handleUpdateAccount(account.id, namespace.id, key, value)}
                            excludeKeys={['id', 'namespace-account-header']}
                            readOnlyKeys={['namespace-id']}
                          />
                          <KeyValueEditor
                            pairs={account['namespace-account-header'] || []}
                            onChange={(newHeaders) => {
                              loadAccountsAndMethods(namespace.id);
                            }}
                            title="Headers"
                            accountId={account.id}
                            collectionName="namespace-account"
                          />
                        </div>
                      </ExpandableCard>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Methods</h3>
                    <button
                      onClick={() => handleAddMethod(namespace.id)}
                      className="text-sm text-[#ff6b4a] hover:text-[#ff5436] flex items-center gap-1"
                    >
                      <FiPlus /> Add Method
                    </button>
                  </div>
                  <div className="space-y-2">
                    {methods[namespace.id]?.map((method) => (
                      <ExpandableCard
                        key={method['method-id']}
                        title={method['namespace-account-method-name']}
                        subtitle={method['namespace-account-method-url-override']}
                        isExpanded={expandedMethodId === method['method-id']}
                        onToggle={() => setExpandedMethodId(
                          expandedMethodId === method['method-id'] ? null : (method['method-id'] || null)
                        )}
                        onDelete={() => method['method-id'] && handleDeleteMethod(method['method-id'], namespace.id)}
                        onDuplicate={() => handleDuplicateMethod(method, namespace.id)}
                      >
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Sample Request</label>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-gray-500 text-sm">[Sample Data Available]</span>
                              <button
                                onClick={() => showPrettyJson('Request Data & Schema', method, 'request')}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View JSON & Schema
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTestMethod(method);
                                  setShowApiTest(true);
                                }}
                                className="text-green-600 hover:text-green-800 text-sm ml-4"
                              >
                                Test API
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Sample Response</label>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-gray-500 text-sm">[Sample Data Available]</span>
                              <button
                                onClick={() => showPrettyJson('Response Data & Schema', method, 'response')}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View JSON & Schema
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <EditableTable
                            data={method}
                            onUpdate={(key, value) => handleUpdateMethod(method['method-id'], namespace.id, key, value)}
                            excludeKeys={['namespace-account-method-queryParams', 'namespace-account-method-header']}
                            readOnlyKeys={['namespace-id', 'method-id']}
                            enumFields={{
                              'namespace-account-method-type': HttpMethod
                            }}
                          />
                          <KeyValueEditor
                            pairs={method['namespace-account-method-queryParams'] || []}
                            onChange={(newParams) => {
                              loadAccountsAndMethods(namespace.id);
                            }}
                            title="Query Parameters"
                            methodId={method['method-id']}
                            collectionName="namespace-account-method"
                          />
                          <KeyValueEditor
                            pairs={method['namespace-account-method-header'] || []}
                            onChange={(newHeaders) => {
                              loadAccountsAndMethods(namespace.id);
                            }}
                            title="Headers"
                            methodId={method['method-id']}
                            collectionName="namespace-account-method"
                          />
                        </div>
                      </ExpandableCard>
                    ))}
                  </div>
                </div>
              </div>
            </ExpandableCard>
          ))}
        </div>
      </div>

      {showJsonModal && jsonModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="font-medium text-lg">{jsonModalData.title}</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    const dataBlob = new Blob([editedData], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'data.json';
                    a.click();
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <FiDownload /> Download JSON
                </button>
                <button
                  onClick={() => {
                    const schemaBlob = new Blob([editedSchema], { type: 'application/json' });
                    const url = URL.createObjectURL(schemaBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'schema.json';
                    a.click();
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <FiDownload /> Download Schema
                </button>
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex flex-col p-6 overflow-hidden h-full">
              <div 
                className="flex gap-6"
                style={{ height: `${topSectionHeight}%` }}
              >
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Sample Data</h4>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(jsonModalData.data.data, null, 2), 'data')}
                      className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
                    >
                      {copiedState.data ? (
                        <>
                          <FiCheck className="text-green-500" /> Copied!
                        </>
                      ) : (
                        <>
                          <FiCopy /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="flex-1 p-4 font-mono text-sm border rounded-lg bg-gray-50 overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(jsonModalData.data.data, null, 2)}
                  </pre>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">JSON Schema</h4>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(jsonModalData.data.schema, null, 2), 'schema')}
                      className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
                    >
                      {copiedState.schema ? (
                        <>
                          <FiCheck className="text-green-500" /> Copied!
                        </>
                      ) : (
                        <>
                          <FiCopy /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="flex-1 p-4 font-mono text-sm border rounded-lg bg-gray-50 overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(jsonModalData.data.schema, null, 2)}
                  </pre>
                </div>
              </div>

              <div 
                className="h-1 bg-gray-200 hover:bg-blue-500 cursor-ns-resize my-2"
                onMouseDown={(e) => {
                  const startY = e.clientY;
                  const startHeight = topSectionHeight;
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const delta = moveEvent.clientY - startY;
                    const newHeight = Math.max(30, Math.min(60, startHeight + (delta / window.innerHeight) * 100));
                    setTopSectionHeight(newHeight);
                    setMiddleSectionHeight(Math.max(20, 80 - newHeight - 20));
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />

              <div 
                className="flex flex-col"
                style={{ height: `${middleSectionHeight}%` }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Validate JSON</h4>
                  <button
                    onClick={() => copyToClipboard(schemaTestData, 'validate')}
                    className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
                  >
                    {copiedState.validate ? (
                      <>
                        <FiCheck className="text-green-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <FiCopy /> Copy
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={schemaTestData}
                  onChange={(e) => {
                    setSchemaTestData(e.target.value);
                    try {
                      setSchemaValidationErrors(
                        JsonSchemaService.validate(jsonModalData.data.schema, e.target.value)
                      );
                    } catch (e) {
                      setSchemaValidationErrors(['Invalid JSON format']);
                    }
                  }}
                  placeholder="Paste JSON to validate against schema..."
                  className="flex-1 p-4 font-mono text-sm border rounded-lg bg-gray-50"
                  spellCheck={false}
                />
              </div>

              <div 
                className="h-1 bg-gray-200 hover:bg-blue-500 cursor-ns-resize my-2"
                onMouseDown={(e) => {
                  const startY = e.clientY;
                  const startHeight = middleSectionHeight;
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const delta = moveEvent.clientY - startY;
                    const newHeight = Math.max(20, Math.min(40, startHeight + (delta / window.innerHeight) * 100));
                    setMiddleSectionHeight(newHeight);
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />

              <div className="flex-1 min-h-[15%] flex flex-col">
                <h4 className="font-medium mb-2">Validation Results</h4>
                <div className="flex-1 border rounded-lg bg-gray-50 p-4 overflow-y-auto">
                  {schemaValidationErrors.length > 0 ? (
                    <div className="text-red-600">
                      {schemaValidationErrors.map((error, i) => (
                        <div key={i} className="flex items-start gap-2 mb-1">
                          <span className="text-red-500">•</span>
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-green-600">JSON is valid</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApiTest && selectedTestMethod && (
        <ApiTestDialog
          isOpen={showApiTest}
          onClose={() => setShowApiTest(false)}
          method={selectedTestMethod}
          namespace={namespaces.find(n => n.id === selectedTestMethod['namespace-id'])!}
          accounts={accounts[selectedTestMethod['namespace-id']] || []}
          initialAccount={accounts[selectedTestMethod['namespace-id']]?.[0]}
        />
      )}
    </div>
  );
} 