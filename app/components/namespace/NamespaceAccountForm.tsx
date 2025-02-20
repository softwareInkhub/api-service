'use client';

import { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, addDoc, doc, updateDoc, getDocs } from 'firebase/firestore';

interface Namespace {
  id: string;
  'namespace-name': string;
  'namespace-url': string;
}

interface NamespaceAccountFormProps {
  onClose: () => void;
  editData?: {
    id: string;
    'namespace-id': string;
    'namespace-name': string;
    'namespace-account-id': string;
    'namespace-account-url-override': string;
    'namespace-account-header': any[];
  } | null;
}

export default function NamespaceAccountForm({ onClose, editData }: NamespaceAccountFormProps) {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState(editData?.['namespace-id'] || '');
  const [accountName, setAccountName] = useState(editData?.['namespace-name'] || '');
  const [urlOverride, setUrlOverride] = useState(editData?.['namespace-account-url-override'] || '');
  const [headers, setHeaders] = useState<any[]>(editData?.['namespace-account-header'] || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNamespaces();
  }, []);

  const loadNamespaces = async () => {
    const querySnapshot = await getDocs(collection(db, 'namespace'));
    setNamespaces(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Namespace[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        'namespace-id': selectedNamespace,
        'namespace-name': accountName,
        'namespace-account-url-override': urlOverride,
        'namespace-account-header': headers,
      };

      if (editData?.id) {
        await updateDoc(doc(db, 'namespace-account', editData.id), data);
      } else {
        await addDoc(collection(db, 'namespace-account'), data);
      }
      onClose();
    } catch (error) {
      console.error('Error saving account:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Namespace
        </label>
        <select
          value={selectedNamespace}
          onChange={(e) => setSelectedNamespace(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        >
          <option value="">Select Namespace</option>
          {namespaces.map((ns) => (
            <option key={ns.id} value={ns.id}>
              {ns['namespace-name']}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Account Name
        </label>
        <input
          type="text"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL Override
        </label>
        <input
          type="text"
          value={urlOverride}
          onChange={(e) => setUrlOverride(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[#ff6b4a] text-white rounded hover:bg-[#ff5436] disabled:opacity-50"
        >
          {loading ? 'Saving...' : editData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
} 