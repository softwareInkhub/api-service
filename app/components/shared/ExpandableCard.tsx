'use client';

import { FiChevronDown, FiChevronRight, FiEdit2, FiTrash2, FiCopy } from 'react-icons/fi';

interface ExpandableCardProps {
  title: string;
  subtitle?: string;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onApply?: () => Promise<void>;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function ExpandableCard({
  title,
  subtitle,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
  onApply,
  children,
  actions
}: ExpandableCardProps) {
  return (
    <div className="border rounded-lg bg-white">
      <div 
        className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 flex-1">
          {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
          <div>
            <div className="font-medium">{title}</div>
            {subtitle && (
              <div className="text-sm text-gray-500">{subtitle}</div>
            )}
          </div>
        </div>
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <FiCopy size={16} />
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <FiEdit2 size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this item?')) {
                  onDelete();
                }
              }}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-gray-100 rounded"
            >
              <FiTrash2 size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {actions}
        </div>
      </div>
      {isExpanded && children && (
        <div className="border-t p-4">
          {children}
        </div>
      )}
    </div>
  );
} 