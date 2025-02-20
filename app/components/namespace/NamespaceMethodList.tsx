'use client';

import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { db } from '../../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

interface NamespaceMethod {
  id: string;
  'namespace-account-method-id': string;
  'namespace-account-method-name': string;
  'namespace-id': string;
  'namespace-account-method-url-override': string;
  'namespace-account-method-queryParams': any[];
}

export default function NamespaceMethodList({ onEdit }: { onEdit: (item: NamespaceMethod) => void }) {
  const [methods, setMethods] = useState<NamespaceMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'namespace-account-method'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NamespaceMethod[];
      setMethods(data);
    } catch (error) {
      console.error('Error loading methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'namespace-account-method', id));
      setMethods(methods.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting method:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {methods.map((method) => (
        <div key={method.id} className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{method['namespace-account-method-name']}</h3>
              <p className="text-sm text-gray-500">{method['namespace-account-method-url-override']}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(method)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <FiEdit2 />
              </button>
              <button
                onClick={() => handleDelete(method.id)}
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