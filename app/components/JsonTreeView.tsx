import { useState } from 'react';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';

interface JsonTreeViewProps {
  data: any;
  level?: number;
  path?: (string | number)[];
  startLine?: number;
}

export default function JsonTreeView({ 
  data, 
  level = 0,
  path = [],
  startLine = 1
}: JsonTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [currentLine, setCurrentLine] = useState(startLine);
  const indent = level * 20;

  const toggleNode = (nodePath: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodePath)) {
      newExpanded.delete(nodePath);
    } else {
      newExpanded.add(nodePath);
    }
    setExpandedNodes(newExpanded);
  };

  const isExpanded = (nodePath: string) => expandedNodes.has(nodePath);

  const getNodeLength = (value: any): string => {
    if (Array.isArray(value)) {
      return `[${value.length}]`;
    }
    if (typeof value === 'object' && value !== null) {
      return `{${Object.keys(value).length}}`;
    }
    if (typeof value === 'string') {
      return `"${value.length}"`;
    }
    return '';
  };

  if (data === null) return (
    <div className="flex">
      <span className="w-8 text-right pr-2 text-gray-400 select-none text-xs">{currentLine}</span>
      <span className="text-gray-500">null</span>
    </div>
  );

  if (typeof data !== 'object') {
    return (
      <div className="flex">
        <span className="w-8 text-right pr-2 text-gray-400 select-none text-xs">{currentLine}</span>
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
  const nodePath = path.join('.');
  const nodeLength = getNodeLength(data);

  return (
    <div style={{ marginLeft: indent }}>
      <div className="flex items-center group">
        <span className="w-8 text-right pr-2 text-gray-400 select-none text-xs">{currentLine}</span>
        <button
          onClick={() => toggleNode(nodePath)}
          className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isExpanded(nodePath) ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
        </button>
        <span className="text-gray-800">
          {isArray ? '[' : '{'}
        </span>
        <span className="ml-1 text-xs text-gray-500">{nodeLength}</span>
      </div>
      
      {isExpanded(nodePath) && (
        <div className="ml-4">
          {items.map(([key, value], index) => (
            <div key={key} className="flex">
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="text-gray-800">
                    {isArray ? '' : (
                      <>
                        <span className="w-8 text-right pr-2 text-gray-400 select-none text-xs">
                          {currentLine + index + 1}
                        </span>
                        <span className="text-purple-600">{`"${key}"`}</span>
                        <span className="text-gray-600">: </span>
                      </>
                    )}
                  </span>
                  <JsonTreeView
                    data={value}
                    level={level + 1}
                    path={[...path, key]}
                    startLine={currentLine + index + 1}
                  />
                </div>
                {index !== items.length - 1 && (
                  <span className="text-gray-800">,</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex">
        <span className="w-8 text-right pr-2 text-gray-400 select-none text-xs">
          {currentLine + items.length + 1}
        </span>
        <span className="text-gray-800">
          {isArray ? ']' : '}'}
        </span>
      </div>
    </div>
  );
} 