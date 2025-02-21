'use client';

import Modal from '../shared/Modal';
import { Namespace } from '../../types/namespace';

interface NamespaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Namespace, 'namespace-id'>) => Promise<void>;
  initialData?: Namespace;
}

export default function NamespaceModal({ isOpen, onClose, onSave, initialData }: NamespaceModalProps) {
  // Add modal implementation
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Namespace' : 'Create Namespace'}>
      {/* Add form fields */}
    </Modal>
  );
} 