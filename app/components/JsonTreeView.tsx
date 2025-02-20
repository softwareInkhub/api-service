import { useState } from 'react';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';

interface JsonTreeViewProps {
  data: any;
  level?: number;
  isLast?: boolean;
  startLine?: number;
}

export default function JsonTreeView({ 
  data, 
  level = 0, 
  isLast = true, 
  startLine = 1 
}: JsonTreeViewProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const indent = level * 20;
  const [lineNumber, setLineNumber] = useState(startLine);

  if (data === null) return (
    <div className="flex">
      <span className="w-8 text-right pr-2 text-gray-400 select-none text-xs">{lineNumber}</span>
      <span className="text-gray-500">null</span>
    </div>
  );

  if (typeof data !== 'object') {
    return (
      <div className="flex">
        <span className="w-8 text-right pr-2 text-gray-400 select-none text-xs">{lineNumber}</span>
        <span className={
          typeof data === 'string' ? 'text-green-600' :
          typeof data === 'number' ? 'text-blue-600' :
          typeof data === 'boolean' ? 'text-purple-600' : 'text-gray-600'
        }>
          {JSON.stringify(data)}
        </span>
      </div>
    );
  }

  const isArray = Array.isArray(data);
  const items = Object.entries(data);
  let currentLine = lineNumber;

  return (
    <div style={{ marginLeft: indent }}>
      <div className="flex items-center">
        <span className="w-8 text-right pr-2 text-gray-400 select-none text-xs">{currentLine++}</span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded"
          data-tree-toggle
          data-expanded={isExpanded}
        >
          {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
        </button>
        <span className="text-gray-800">
          {isArray ? '[' : '{'}
        </span>
      </div>
      
      {isExpanded && (
        <div className="ml-4">
          {items.map(([key, value], index) => (
            <div key={key} className="flex">
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="text-gray-800">
                    {isArray ? '' : (
                      <>
                        <span className="w-8 text-right pr-2 text-gray-400 select-none text-xs">
                          {currentLine++}
                        </span>
                        {`"${key}": `}
                      </>
                    )}
                  </span>
                  <JsonTreeView
                    data={value}
                    level={level + 1}
                    isLast={index === items.length - 1}
                    startLine={currentLine}
                  />
                </div>
                {!isLast && index !== items.length - 1 && (
                  <span className="text-gray-800">,</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginLeft: indent }}>
        <div className="flex">
          <span className="w-8 text-right pr-2 text-gray-400 select-none text-xs">{currentLine}</span>
          <span className="text-gray-800">
            {isArray ? ']' : '}'}
          </span>
        </div>
      </div>
    </div>
  );
} 