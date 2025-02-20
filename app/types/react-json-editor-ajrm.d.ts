declare module 'react-json-editor-ajrm' {
  interface JsonEditorProps {
    placeholder?: any;
    onChange?: (value: any) => void;
    viewOnly?: boolean;
    theme?: string;
    locale?: string;
    height?: string;
    width?: string;
  }
  
  const JsonEditor: React.FC<JsonEditorProps>;
  export default JsonEditor;
} 