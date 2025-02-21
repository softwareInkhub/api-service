'use client';

import { useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { NamespaceTemplate } from '../../types/namespace';
import ExpandableCard from '../shared/ExpandableCard';
import EditableTable from '../shared/EditableTable';
import KeyValueTable from '../shared/KeyValueTable';

interface TemplateSectionProps {
  templates: NamespaceTemplate[];
  onApplyTemplate: (template: NamespaceTemplate) => Promise<void>;
}

export default function TemplateSection({ templates, onApplyTemplate }: TemplateSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  return (
    <div className="border-b">
      {/* Templates Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
          <h2 className="font-medium">Templates</h2>
        </div>
      </div>

      {/* Templates Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {templates.map((template) => (
            <ExpandableCard
              key={template.id}
              title={template.name}
              subtitle={template.template.namespace['namespace-url']}
              isExpanded={expandedTemplateId === template.id}
              onToggle={() => setExpandedTemplateId(expandedTemplateId === template.id ? null : template.id)}
              onApply={() => onApplyTemplate(template)}
            >
              {/* Namespace Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Namespace</h3>
                  <EditableTable
                    data={template.template.namespace}
                    onUpdate={async () => Promise.resolve()}
                    readOnly={true}
                  />
                </div>

                {/* Accounts Section */}
                {template.template.accounts.map((accountData, accountIndex) => (
                  <div key={accountIndex}>
                    <h3 className="font-medium mb-2">Account {accountIndex + 1}</h3>
                    <EditableTable
                      data={accountData}
                      onUpdate={async () => Promise.resolve()}
                      readOnly={true}
                    />
                    
                    <div className="mt-2">
                      <KeyValueTable
                        data={accountData['namespace-account-header']}
                        onUpdate={async () => Promise.resolve()}
                        title="Headers"
                        readOnly={true}
                      />
                    </div>
                  </div>
                ))}

                {/* Separate Methods Section */}
                <div>
                  <h3 className="font-medium mb-2">Methods</h3>
                  {template.template.methods.map((method, methodIndex) => (
                    <div key={methodIndex} className="mb-4">
                      <EditableTable
                        data={method}
                        onUpdate={async () => Promise.resolve()}
                        readOnly={true}
                      />
                      
                      <div className="mt-2">
                        <KeyValueTable
                          data={method['namespace-account-method-queryParams']}
                          onUpdate={async () => Promise.resolve()}
                          title="Query Parameters"
                          readOnly={true}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ExpandableCard>
          ))}
        </div>
      )}
    </div>
  );
} 