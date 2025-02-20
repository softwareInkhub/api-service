'use client';

import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { db } from '../../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

interface Namespace {
  id: string;
  'namespace-name': string;
  'namespace-url': string;
}

export default function NamespaceList({ onEdit }: { onEdit: (item: Namespace) => void }) {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNamespaces();
  }, []);

  const loadNamespaces = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'namespace'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Namespace[];
      setNamespaces(data);
    } catch (error) {
      console.error('Error loading namespaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'namespace', id));
      setNamespaces(namespaces.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting namespace:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {namespaces.map((namespace) => (
        <div key={namespace.id} className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{namespace['namespace-name']}</h3>
              <p className="text-sm text-gray-500">{namespace['namespace-url']}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(namespace)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <FiEdit2 />
              </button>
              <button
                onClick={() => handleDelete(namespace.id)}
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