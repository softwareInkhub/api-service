'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const JSONEditor = dynamic(
  () => import('react-json-editor-ajrm').then(mod => mod.default),
  { ssr: false }
);

interface JsonEditorProps {
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
}

const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  readOnly = false
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (data: any) => {
    if (readOnly) return;
    
    try {
      const newValue = JSON.parse(data.json);
      setLocalValue(newValue);
      onChange(newValue);
    } catch (e) {
      // Invalid JSON, ignore
    }
  };

  return (
    <div className="border rounded-lg bg-gray-50">
      <JSONEditor
        placeholder={localValue}
        theme="light_mitsuketa_tribute"
        colors={{
          background: 'transparent',
          default: '#24292e',
          string: '#22863a',
          number: '#005cc5',
          colon: '#24292e',
          keys: '#d73a49',
          keys_whiteSpace: '#24292e',
          primitive: '#6f42c1'
        }}
        height="100%"
        width="100%"
        onChange={handleChange}
        viewOnly={readOnly}
      />
    </div>
  );
};

export default JsonEditor; 