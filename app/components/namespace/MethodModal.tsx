'use client';

import Modal from '../shared/Modal';
import { NamespaceMethod, HttpMethod } from '../../types/namespace';

interface MethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<NamespaceMethod, 'namespace-account-method-id'>) => Promise<void>;
  namespaceId: string;
  initialData?: NamespaceMethod;
}

export default function MethodModal({ isOpen, onClose, onSave, namespaceId, initialData }: MethodModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Method' : 'Create Method'}>
      {/* Add form fields */}
    </Modal>
  );
} 