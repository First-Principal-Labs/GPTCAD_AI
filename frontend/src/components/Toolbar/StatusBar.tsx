import { useAppStore } from '../../stores/appStore';

export default function StatusBar() {
  const isGenerating = useAppStore((s) => s.isGenerating);
  const error = useAppStore((s) => s.error);

  return (
    <div className="h-7 flex items-center justify-between px-4 border-t border-border bg-bg-panel text-xs shrink-0">
      <div className="flex items-center gap-2">
        {isGenerating ? (
          <>
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span className="text-warning">Generating...</span>
          </>
        ) : error ? (
          <>
            <div className="w-2 h-2 rounded-full bg-error" />
            <span className="text-error">Error</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-text-muted">Ready</span>
          </>
        )}
      </div>
      <div className="text-text-muted">
        GPTCAD v0.1.0
      </div>
    </div>
  );
}
