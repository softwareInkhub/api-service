'use client';

import { useState } from 'react';
import { FiSave } from 'react-icons/fi';
import { db } from '../../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { NamespaceTemplate, HttpMethod } from '../../types/namespace';

interface CreateTemplateButtonProps {
  clientMethod: {
    name: string;
    url: string;
    method: string;
    headers: Array<{ key: string; value: string }>;
    queryParams: Array<{ key: string; value: string }>;
  };
}

export default function CreateTemplateButton({ clientMethod }: CreateTemplateButtonProps) {
  const [saving, setSaving] = useState(false);

  const handleCreateTemplate = async () => {
    try {
      setSaving(true);
      const templateId = uuidv4();
      const accountId = uuidv4();
      const methodId = uuidv4();

      const template: NamespaceTemplate = {
        id: templateId,
        name: `${clientMethod.name} Template`,
        template: {
          namespace: {
            'namespace-name': clientMethod.name,
            'namespace-url': new URL(clientMethod.url).origin,
            'namespace-id': templateId
          },
          accounts: [{
            'namespace-account-name': 'Default Account',
            'namespace-account-url-override': '',
            'namespace-account-header': clientMethod.headers,
            'namespace-account-id': accountId,
            'namespace-id': templateId
          }],
          methods: [{
            'namespace-account-method-name': clientMethod.name,
            'namespace-account-method-type': clientMethod.method as HttpMethod,
            'namespace-account-method-url-override': clientMethod.url,
            'namespace-account-method-queryParams': clientMethod.queryParams,
            'namespace-account-method-id': methodId,
            'namespace-id': templateId
          }]
        }
      };

      await setDoc(doc(db, 'namespace-templates', templateId), template);
      alert('Template created successfully!');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleCreateTemplate}
      disabled={saving}
      className="px-4 py-2 bg-[#ff6b4a] text-white rounded flex items-center gap-2 hover:bg-[#ff5436] disabled:opacity-50"
    >
      <FiSave />
      {saving ? 'Saving...' : 'Save as Template'}
    </button>
  );
} 