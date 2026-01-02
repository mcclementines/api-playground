import Editor from '@monaco-editor/react';

interface RawJsonViewProps {
  data: any;
}

export function RawJsonView({ data }: RawJsonViewProps) {
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <Editor
        height="400px"
        defaultLanguage="json"
        value={jsonString}
        options={{
          readOnly: true,
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
  );
}
