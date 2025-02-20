'use client';

import { useState } from 'react';
import { db } from '../../config/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

interface NamespaceFormProps {
  onClose: () => void;
  editData?: {
    id: string;
    'namespace-name': string;
    'namespace-url': string;
  } | null;
}

export default function NamespaceForm({ onClose, editData }: NamespaceFormProps) {
  const [name, setName] = useState(editData?.['namespace-name'] || '');
  const [url, setUrl] = useState(editData?.['namespace-url'] || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editData?.id) {
        await updateDoc(doc(db, 'namespace', editData.id), {
          'namespace-name': name,
          'namespace-url': url,
        });
      } else {
        await addDoc(collection(db, 'namespace'), {
          'namespace-name': name,
          'namespace-url': url,
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving namespace:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Namespace Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Namespace URL
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
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