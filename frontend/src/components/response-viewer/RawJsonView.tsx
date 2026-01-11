import Editor from '@monaco-editor/react';
import { useTheme } from '../../hooks/useTheme';

interface RawJsonViewProps {
  data: unknown;
}

export function RawJsonView({ data }: RawJsonViewProps) {
  const { resolvedTheme } = useTheme();
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className="border border-border rounded-md overflow-hidden">
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
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
      />
    </div>
  );
}
