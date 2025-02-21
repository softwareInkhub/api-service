'use client';

import Modal from '../shared/Modal';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Record<string, any>;
}

export default function ViewModal({ isOpen, onClose, title, data }: ViewModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="grid grid-cols-2 gap-2">
            <div className="font-medium">{key}</div>
            <div>{JSON.stringify(value)}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
} 