import Editor from '@monaco-editor/react';
import { Code2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';

export default function CodePanel() {
  const code = useAppStore((s) => s.code);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5">
          <Code2 size={13} className="text-text-muted" />
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Generated Code
          </span>
        </div>
        {code && (
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
          </button>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        {code ? (
          <Editor
            language="python"
            value={code}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              padding: { top: 8 },
              renderLineHighlight: 'none',
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
              },
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted gap-2 px-6">
            <Code2 size={28} strokeWidth={1.5} className="opacity-40" />
            <p className="text-xs text-center leading-relaxed">
              Generated FreeCAD code will appear here when you submit a prompt
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
