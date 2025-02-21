'use client';

import { useState } from 'react';
import { FiEdit2, FiCheck, FiX, FiPlus } from 'react-icons/fi';
import { KeyValuePair } from '../../types/namespace';

interface KeyValueTableProps {
  data: KeyValuePair[];
  onUpdate: (newData: KeyValuePair[]) => Promise<void>;
  title: string;
  allowJsonValue?: boolean;
  readOnly?: boolean;
}

export default function KeyValueTable({ 
  data, 
  onUpdate, 
  title,
  allowJsonValue = true,
  readOnly = false
}: KeyValueTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [valueError, setValueError] = useState<string | null>(null);

  const validateValue = (value: string): boolean => {
    if (!allowJsonValue) return true;
    if (!value.trim()) return true;
    
    try {
      JSON.parse(value);
      setValueError(null);
      return true;
    } catch (error) {
      setValueError('Invalid JSON format');
      return false;
    }
  };

  const handleAdd = async () => {
    if (!newKey.trim()) {
      setValueError('Key is required');
      return;
    }
    
    // Check for duplicate keys
    if (data.some(item => item.key === newKey)) {
      setValueError('Duplicate key');
      return;
    }

    if (!validateValue(newValue)) return;

    const newData = [...data, { key: newKey, value: newValue }];
    await onUpdate(newData);
    setIsAdding(false);
    setNewKey('');
    setNewValue('');
    setValueError(null);
  };

  const handleSave = async (index: number) => {
    if (!validateValue(editValue)) return;
    const newData = [...data];
    newData[index] = { ...newData[index], value: editValue };
    await onUpdate(newData);
    setEditingIndex(null);
    setValueError(null);
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium">{title}</h4>
        <button
          onClick={() => setIsAdding(true)}
          className="text-sm text-[#ff6b4a] hover:text-[#ff5436] flex items-center gap-1"
        >
          <FiPlus /> Add Item
        </button>
      </div>
      <div className="border rounded">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 w-1/3">Key</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Value</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr className="border-t">
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="Enter key"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => {
                      setNewValue(e.target.value);
                      validateValue(e.target.value);
                    }}
                    className="w-full px-2 py-1 border rounded text-sm font-mono"
                    placeholder={allowJsonValue ? "Enter JSON value" : "Enter value"}
                  />
                </td>
                <td className="py-2 px-3 text-right">
                  <button
                    onClick={handleAdd}
                    className="p-1 text-green-600 hover:text-green-700"
                    disabled={!!valueError}
                  >
                    <FiCheck size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewKey('');
                      setNewValue('');
                      setValueError(null);
                    }}
                    className="p-1 text-red-600 hover:text-red-700"
                  >
                    <FiX size={14} />
                  </button>
                </td>
              </tr>
            )}
            {data.map((item, index) => (
              <tr key={index} className="border-t">
                <td className="py-2 px-3 text-sm">{item.key}</td>
                <td className="py-2 px-3">
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => {
                        setEditValue(e.target.value);
                        validateValue(e.target.value);
                      }}
                      className="w-full px-2 py-1 border rounded text-sm font-mono"
                    />
                  ) : (
                    <div 
                      className="text-sm font-mono cursor-pointer hover:bg-gray-50 p-1 rounded flex justify-between items-center group"
                      onClick={() => {
                        setEditingIndex(index);
                        setEditValue(item.value);
                      }}
                    >
                      <span>{item.value}</span>
                      <FiEdit2 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100" />
                    </div>
                  )}
                </td>
                <td className="py-2 px-3 text-right">
                  {editingIndex === index && (
                    <>
                      <button
                        onClick={() => handleSave(index)}
                        className="p-1 text-green-600 hover:text-green-700"
                        disabled={!!valueError}
                      >
                        <FiCheck size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingIndex(null);
                          setEditValue('');
                          setValueError(null);
                        }}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <FiX size={14} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {valueError && (
        <div className="mt-2 text-red-500 text-sm">
          {valueError}
        </div>
      )}
    </div>
  );
} 