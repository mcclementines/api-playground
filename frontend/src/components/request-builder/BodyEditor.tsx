import Editor from '@monaco-editor/react';

interface BodyEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function BodyEditor({ value, onChange }: BodyEditorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Request Body</h3>
      <div className="border border-gray-300 rounded-md overflow-hidden">
        <Editor
          height="200px"
          defaultLanguage="json"
          value={value}
          onChange={(newValue) => onChange(newValue || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            wrappingIndent: 'indent',
            automaticLayout: true,
            tabSize: 2,
          }}
          theme="vs-light"
        />
      </div>
      <p className="text-xs text-gray-500">
        Enter valid JSON for the request body
      </p>
    </div>
  );
}
