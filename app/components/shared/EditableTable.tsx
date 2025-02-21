'use client';

import { useState } from 'react';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { HttpMethod } from '../../types/namespace';

interface EditableTableProps {
  data: Record<string, any>;
  onUpdate: (key: string, value: string) => Promise<void>;
  excludeKeys?: string[];
  readOnlyKeys?: string[];
  enumFields?: Record<string, any>;
  readOnly?: boolean;
}

export default function EditableTable({ 
  data, 
  onUpdate, 
  excludeKeys = [],
  readOnlyKeys = [],
  enumFields = {},
  readOnly = false
}: EditableTableProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

  const handleSave = async (key: string) => {
    try {
      await onUpdate(key, editValue);
      setEditingKey(null);
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  const renderEditField = (key: string) => {
    if (enumFields[key]) {
      return (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="flex-1 px-2 py-1 border rounded"
          autoFocus
        >
          {Object.values(enumFields[key]).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="flex-1 px-2 py-1 border rounded"
        autoFocus
      />
    );
  };

  return (
    <div className="w-full">
      <table className="w-full">
        <tbody>
          {Object.entries(data)
            .filter(([key]) => !excludeKeys.includes(key))
            .map(([key, value]) => (
              <tr key={key} className="border-b last:border-b-0">
                <td className="py-2 w-1/3">
                  <span className="text-sm font-medium text-gray-600">
                    {key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                </td>
                <td className="py-2 w-2/3">
                  {readOnlyKeys.includes(key) ? (
                    <span className="text-gray-500">{String(value)}</span>
                  ) : (
                    editingKey === key ? (
                      <div className="flex items-center gap-2">
                        {renderEditField(key)}
                        <button
                          onClick={() => handleSave(key)}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <FiCheck size={14} />
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-1 rounded"
                        onClick={() => handleEdit(key, String(value))}
                      >
                        <span>{String(value)}</span>
                        <FiEdit2 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100" />
                      </div>
                    )
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
} 