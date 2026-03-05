import Editor, { DiffEditor } from '@monaco-editor/react';
import {
  Code2, Copy, Check, Play, Pencil, Eye, GitCompareArrows, Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { runCode } from '../../api/client';

type ViewMode = 'view' | 'edit' | 'diff';

export default function CodePanel() {
  const code = useAppStore((s) => s.code);
  const previousCode = useAppStore((s) => s.previousCode);
  const projectId = useAppStore((s) => s.projectId);
  const setModelUrl = useAppStore((s) => s.setModelUrl);
  const setCode = useAppStore((s) => s.setCode);
  const setProjectId = useAppStore((s) => s.setProjectId);
  const setCurrentVersion = useAppStore((s) => s.setCurrentVersion);
  const setError = useAppStore((s) => s.setError);

  const [viewMode, setViewMode] = useState<ViewMode>('view');
  const [editedCode, setEditedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);

  const handleCopy = () => {
    const text = viewMode === 'edit' ? editedCode : code;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    setEditedCode(code);
    setViewMode('edit');
  };

  const handleRun = async () => {
    const codeToRun = viewMode === 'edit' ? editedCode : code;
    if (!codeToRun) return;
    setRunning(true);
    setError(null);

    try {
      const result = await runCode({
        code: codeToRun,
        project_id: projectId ?? undefined,
      });
      setProjectId(result.project_id);
      setModelUrl(result.model_url);
      setCode(result.code);
      setCurrentVersion(result.version);
      setViewMode('view');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setRunning(false);
    }
  };

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 12,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineNumbers: 'on' as const,
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    padding: { top: 8 },
    renderLineHighlight: 'none' as const,
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6,
    },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5">
          <Code2 size={13} className="text-text-muted" />
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            {viewMode === 'edit' ? 'Edit Code' : viewMode === 'diff' ? 'Diff View' : 'Generated Code'}
          </span>
        </div>

        {code && (
          <div className="flex items-center gap-0.5">
            {/* View mode */}
            <button
              onClick={() => setViewMode('view')}
              title="View mode"
              className={`p-1 rounded transition-colors ${
                viewMode === 'view'
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
              }`}
            >
              <Eye size={13} />
            </button>

            {/* Edit mode */}
            <button
              onClick={handleEdit}
              title="Edit mode"
              className={`p-1 rounded transition-colors ${
                viewMode === 'edit'
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
              }`}
            >
              <Pencil size={13} />
            </button>

            {/* Diff mode */}
            <button
              onClick={() => setViewMode('diff')}
              title="Diff view"
              disabled={!previousCode}
              className={`p-1 rounded transition-colors ${
                viewMode === 'diff'
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              <GitCompareArrows size={13} />
            </button>

            <div className="w-px h-4 bg-border mx-0.5" />

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
              title="Copy code"
            >
              {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            </button>

            {/* Run */}
            <button
              onClick={handleRun}
              disabled={running || (viewMode === 'edit' ? !editedCode : !code)}
              title="Run code"
              className="p-1 rounded text-accent hover:text-accent-hover hover:bg-bg-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {running ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Play size={13} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Editor area */}
      <div className="flex-1 min-h-0">
        {code ? (
          viewMode === 'diff' && previousCode ? (
            <DiffEditor
              original={previousCode}
              modified={code}
              language="python"
              theme="vs-dark"
              options={{
                ...editorOptions,
                readOnly: true,
                renderSideBySide: false,
              }}
            />
          ) : (
            <Editor
              language="python"
              value={viewMode === 'edit' ? editedCode : code}
              theme="vs-dark"
              onChange={(v) => {
                if (viewMode === 'edit') setEditedCode(v || '');
              }}
              options={{
                ...editorOptions,
                readOnly: viewMode !== 'edit',
              }}
            />
          )
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
