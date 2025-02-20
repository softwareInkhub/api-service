'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Tab } from '@headlessui/react';
import NamespaceForm from '../components/namespace/NamespaceForm';
import NamespaceAccountForm from '../components/namespace/NamespaceAccountForm';
import NamespaceMethodForm from '../components/namespace/NamespaceMethodForm';
import NamespaceList from '../components/namespace/NamespaceList';
import NamespaceAccountList from '../components/namespace/NamespaceAccountList';
import NamespaceMethodList from '../components/namespace/NamespaceMethodList';

export default function NamespaceManagement() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const tabs = ['Namespaces', 'Accounts', 'Methods'];

  const handleAdd = () => {
    setEditItem(null);
    setShowForm(true);
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditItem(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Namespace Management</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-[#ff6b4a] text-white rounded flex items-center gap-2"
        >
          <FiPlus /> Add {tabs[selectedTab].slice(0, -1)}
        </button>
      </div>

      <Tab.Group onChange={setSelectedTab}>
        <Tab.List className="flex border-b mb-6">
          {tabs.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                `px-6 py-3 text-sm font-medium border-b-2 ${
                  selected
                    ? 'text-[#ff6b4a] border-[#ff6b4a]'
                    : 'text-gray-500 border-transparent'
                }`
              }
            >
              {tab}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            {showForm ? (
              <NamespaceForm onClose={handleClose} editData={editItem} />
            ) : (
              <NamespaceList onEdit={handleEdit} />
            )}
          </Tab.Panel>
          <Tab.Panel>
            {showForm ? (
              <NamespaceAccountForm onClose={handleClose} editData={editItem} />
            ) : (
              <NamespaceAccountList onEdit={handleEdit} />
            )}
          </Tab.Panel>
          <Tab.Panel>
            {showForm ? (
              <NamespaceMethodForm onClose={handleClose} editData={editItem} />
            ) : (
              <NamespaceMethodList onEdit={handleEdit} />
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
} 