'use client';

import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { db } from '../../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

interface NamespaceAccount {
  id: string;
  'namespace-id': string;
  'namespace-name': string;
  'namespace-account-id': string;
  'namespace-account-url-override': string;
  'namespace-account-header': any[];
}

export default function NamespaceAccountList({ onEdit }: { onEdit: (item: NamespaceAccount) => void }) {
  const [accounts, setAccounts] = useState<NamespaceAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'namespace-account'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NamespaceAccount[];
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'namespace-account', id));
      setAccounts(accounts.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {accounts.map((account) => (
        <div key={account.id} className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{account['namespace-name']}</h3>
              <p className="text-sm text-gray-500">{account['namespace-account-url-override']}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(account)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <FiEdit2 />
              </button>
              <button
                onClick={() => handleDelete(account.id)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 