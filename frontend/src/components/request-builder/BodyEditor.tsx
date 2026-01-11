import Editor from '@monaco-editor/react';
import { useTheme } from '../../hooks/useTheme';

interface BodyEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function BodyEditor({ value, onChange }: BodyEditorProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Request Body</h3>
      <div className="border border-border rounded-md overflow-hidden">
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
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Enter valid JSON for the request body
      </p>
    </div>
  );
}
