'use client';

import Modal from '../shared/Modal';
import { NamespaceAccount } from '../../types/namespace';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<NamespaceAccount, 'namespace-account-id'>) => Promise<void>;
  namespaceId: string;
  namespaceName: string;
  initialData?: NamespaceAccount;
}

export default function AccountModal({ isOpen, onClose, onSave, namespaceId, namespaceName, initialData }: AccountModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Account' : 'Create Account'}>
      {/* Add form fields */}
    </Modal>
  );
} 