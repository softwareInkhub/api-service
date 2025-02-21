'use client';

import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronRight, FiSave } from 'react-icons/fi';
import ExpandableCard from '../components/shared/ExpandableCard';
import EditableTable from '../components/shared/EditableTable';
import type { 
  Namespace, 
  NamespaceAccount, 
  NamespaceMethod, 
  NamespaceTemplate,
  KeyValuePair 
} from '../types/namespace';
import { HttpMethod } from '../types/namespace';
import KeyValueTable from '../components/shared/KeyValueTable';
import TemplateSection from '../components/namespace/TemplateSection';
import TabHeader from '../components/shared/TabHeader';
import TemplateMapping from '../components/namespace/TemplateMapping';

export default function NamespaceManagement() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [accounts, setAccounts] = useState<Record<string, NamespaceAccount[]>>({});
  const [methods, setMethods] = useState<Record<string, NamespaceMethod[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [expandedMethodId, setExpandedMethodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<NamespaceTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('Namespaces');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NamespaceTemplate | null>(null);

  useEffect(() => {
    loadNamespaces();
    loadTemplates();
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
        id: doc.id,
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
      const id = uuidv4();
      const newMethod = {
        id,
        'namespace-id': namespaceId,
        'namespace-account-method-name': 'New Method',
        'namespace-account-method-type': HttpMethod.GET,
        'namespace-account-method-url-override': '',
        'namespace-account-method-queryParams': []
      };
      await setDoc(doc(db, 'namespace-account-method', id), newMethod);
      loadAccountsAndMethods(namespaceId);
    } catch (error) {
      console.error('Error adding method:', error);
    }
  };

  const handleUpdateMethod = async (methodId: string, namespaceId: string, key: string, value: string) => {
    try {
      await updateDoc(doc(db, 'namespace-account-method', methodId), {
        [key]: value
      });
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
      const { id, ...methodData } = method;
      await addDoc(collection(db, 'namespace-account-method'), {
        ...methodData,
        'namespace-account-method-name': `${methodData['namespace-account-method-name']} (Copy)`,
        'namespace-account-method-id': uuidv4()
      });
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

  const loadTemplates = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'namespace-templates'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NamespaceTemplate[];
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreateTemplate = async (namespace: Namespace) => {
    try {
      const templateId = uuidv4();
      const namespaceAccounts = accounts[namespace.id] ?? [];
      const namespaceMethods = methods[namespace.id] ?? [];

      const template: NamespaceTemplate = {
        id: templateId,
        name: `${namespace['namespace-name']} Template`,
        template: {
          namespace: {
            'namespace-name': namespace['namespace-name'] || '',
            'namespace-url': namespace['namespace-url'] || '',
            'namespace-id': namespace.id
          },
          accounts: namespaceAccounts.map(account => ({
            'namespace-account-name': account['namespace-account-name'] || '',
            'namespace-account-url-override': account['namespace-account-url-override'] || '',
            'namespace-account-header': account['namespace-account-header'] || [],
            'namespace-account-id': account.id,
            'namespace-id': account['namespace-id']
          })),
          methods: namespaceMethods.map(method => ({
            'namespace-account-method-name': method['namespace-account-method-name'] || '',
            'namespace-account-method-type': method['namespace-account-method-type'] || HttpMethod.GET,
            'namespace-account-method-url-override': method['namespace-account-method-url-override'] || '',
            'namespace-account-method-queryParams': method['namespace-account-method-queryParams'] || [],
            'namespace-account-method-id': method.id,
            'namespace-id': method['namespace-id']
          }))
        }
      };

      await setDoc(doc(db, 'namespace-templates', templateId), template);
      loadTemplates();
      alert('Template created successfully!');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template');
    }
  };

  const handleApplyTemplate = async (
    template: NamespaceTemplate,
    mapping: {
      namespaceId?: string;
      accountMappings: Record<string, string>;
      methodMappings: Record<string, string>;
    }
  ) => {
    try {
      let namespaceId = mapping.namespaceId;

      // Create new namespace if needed
      if (!namespaceId) {
        namespaceId = uuidv4();
        const namespace = {
          id: namespaceId,
          ...template.template.namespace
        };
        await setDoc(doc(db, 'namespace', namespaceId), namespace);
      }

      // Create or update accounts
      for (const templateAccount of template.template.accounts) {
        const existingAccountId = mapping.accountMappings[templateAccount['namespace-account-name']];
        if (existingAccountId) {
          await updateDoc(doc(db, 'namespace-account', existingAccountId), templateAccount);
        } else {
          const accountId = uuidv4();
          await setDoc(doc(db, 'namespace-account', accountId), {
            id: accountId,
            ...templateAccount,
            'namespace-id': namespaceId
          });
        }
      }

      // Create or update methods
      for (const templateMethod of template.template.methods) {
        const existingMethodId = mapping.methodMappings[templateMethod['namespace-account-method-name']];
        if (existingMethodId) {
          await updateDoc(doc(db, 'namespace-account-method', existingMethodId), templateMethod);
        } else {
          const methodId = uuidv4();
          await setDoc(doc(db, 'namespace-account-method', methodId), {
            id: methodId,
            ...templateMethod,
            'namespace-id': namespaceId
          });
        }
      }

      loadNamespaces();
    } catch (error) {
      console.error('Error applying template:', error);
    }
  };

  const setShowMapping = (template: NamespaceTemplate) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="p-6">
      <TabHeader 
        tabs={['Namespaces', 'Templates']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'Namespaces' ? (
        // Namespaces View
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
                actions={
                  <button
                    onClick={() => handleCreateTemplate(namespace)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <FiSave /> Create Template
                  </button>
                }
              >
                <div className="space-y-6">
                  {/* Namespace Details */}
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

                  {/* Accounts Section */}
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
                          <EditableTable
                            data={account}
                            onUpdate={(key, value) => handleUpdateAccount(account.id, namespace.id, key, value)}
                            excludeKeys={['id', 'namespace-account-header']}
                            readOnlyKeys={['namespace-id']}
                          />
                          <KeyValueTable
                            data={account['namespace-account-header']}
                            onUpdate={(headers) => handleUpdateHeaders(account.id, namespace.id, headers)}
                            title="Headers"
                            allowJsonValue={false}
                          />
                        </ExpandableCard>
                      ))}
                    </div>
                  </div>

                  {/* Methods Section */}
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
                          key={method.id}
                          title={method['namespace-account-method-name']}
                          subtitle={method['namespace-account-method-url-override']}
                          isExpanded={expandedMethodId === method.id}
                          onToggle={() => setExpandedMethodId(expandedMethodId === method.id ? null : method.id)}
                          onDelete={() => handleDeleteMethod(method.id, namespace.id)}
                          onDuplicate={() => handleDuplicateMethod(method, namespace.id)}
                        >
                          <EditableTable
                            data={method}
                            onUpdate={(key, value) => handleUpdateMethod(method.id, namespace.id, key, value)}
                            excludeKeys={['id', 'namespace-account-method-queryParams']}
                            readOnlyKeys={['namespace-id']}
                            enumFields={{
                              'namespace-account-method-type': HttpMethod
                            }}
                          />
                          <KeyValueTable
                            data={method['namespace-account-method-queryParams']}
                            onUpdate={(params) => handleUpdateQueryParams(method.id, namespace.id, params)}
                            title="Query Parameters"
                            allowJsonValue={false}
                          />
                        </ExpandableCard>
                      ))}
                    </div>
                  </div>
                </div>
              </ExpandableCard>
            ))}
          </div>
        </div>
      ) : (
        // Templates View
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Template Management</h1>
          </div>

          <div className="space-y-4">
            {templates.map((template) => (
              <ExpandableCard
                key={template.id}
                title={template.name}
                subtitle={template.template.namespace['namespace-url']}
                isExpanded={expandedTemplateId === template.id}
                onToggle={() => setExpandedTemplateId(expandedTemplateId === template.id ? null : template.id)}
                onApply={async () => setShowMapping(template)}
              >
                <div className="space-y-4">
                  {/* Namespace Section */}
                  <div>
                    <h3 className="font-medium mb-2">Namespace</h3>
                    <EditableTable
                      data={template.template.namespace}
                      onUpdate={async () => {}}
                      readOnly={true}
                    />
                  </div>

                  {/* Accounts Section */}
                  <div>
                    <h3 className="font-medium mb-2">Accounts</h3>
                    {template.template.accounts.map((account, index) => (
                      <div key={index} className="mb-4">
                        <EditableTable
                          data={account}
                          onUpdate={async () => {}}
                          readOnly={true}
                        />
                        <KeyValueTable
                          data={account['namespace-account-header']}
                          onUpdate={async () => {}}
                          title="Headers"
                          readOnly={true}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Methods Section */}
                  <div>
                    <h3 className="font-medium mb-2">Methods</h3>
                    {template.template.methods.map((method, index) => (
                      <div key={index} className="mb-4">
                        <EditableTable
                          data={method}
                          onUpdate={async () => {}}
                          readOnly={true}
                        />
                        <KeyValueTable
                          data={method['namespace-account-method-queryParams']}
                          onUpdate={async () => {}}
                          title="Query Parameters"
                          readOnly={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </ExpandableCard>
            ))}
          </div>
        </div>
      )}

      {/* Add Template Mapping Modal */}
      {selectedTemplate && (
        <TemplateMapping
          template={selectedTemplate}
          existingNamespaces={namespaces}
          existingAccounts={Object.values(accounts).flat()}
          existingMethods={Object.values(methods).flat()}
          onMapComplete={handleApplyTemplate}
        />
      )}
    </div>
  );
} 