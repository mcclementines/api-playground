import JsonView from '@uiw/react-json-view';
import { darkTheme } from '@uiw/react-json-view/dark';
import { lightTheme } from '@uiw/react-json-view/light';
import { useTheme } from '../../hooks/useTheme';

interface PrettyDisplayProps {
  data: unknown;
}

export function PrettyDisplay({ data }: PrettyDisplayProps) {
  const { resolvedTheme } = useTheme();
  const value = typeof data === 'object' && data !== null ? data : { value: data };

  return (
    <div className="border border-border rounded-md p-4 bg-card overflow-x-auto">
      <JsonView
        value={value}
        collapsed={1}
        displayDataTypes={false}
        displayObjectSize={true}
        enableClipboard={true}
        style={{
          ...(resolvedTheme === 'dark' ? darkTheme : lightTheme),
          fontSize: '13px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          backgroundColor: 'transparent',
        }}
      />
    </div>
  );
}
