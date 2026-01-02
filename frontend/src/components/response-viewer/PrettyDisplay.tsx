import JsonView from '@uiw/react-json-view';

interface PrettyDisplayProps {
  data: any;
}

export function PrettyDisplay({ data }: PrettyDisplayProps) {
  return (
    <div className="border border-gray-300 rounded-md p-4 bg-gray-50 overflow-x-auto">
      <JsonView
        value={data}
        collapsed={1}
        displayDataTypes={false}
        displayObjectSize={true}
        enableClipboard={true}
        style={{
          fontSize: '13px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          backgroundColor: 'transparent',
        }}
      />
    </div>
  );
}
