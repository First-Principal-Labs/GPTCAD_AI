import { useAppStore } from '../../stores/appStore';
import { Triangle, Hexagon, Box, Layers } from 'lucide-react';

export default function StatusBar() {
  const isGenerating = useAppStore((s) => s.isGenerating);
  const generationStatus = useAppStore((s) => s.generationStatus);
  const error = useAppStore((s) => s.error);
  const modelInfo = useAppStore((s) => s.modelInfo);
  const currentVersion = useAppStore((s) => s.currentVersion);
  const renderMode = useAppStore((s) => s.renderMode);

  return (
    <div className="h-7 flex items-center justify-between px-4 border-t border-border bg-bg-panel text-xs shrink-0">
      {/* Left: Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {isGenerating ? (
            <>
              <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              <span className="text-warning">{generationStatus || 'Generating...'}</span>
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

        {currentVersion > 0 && (
          <>
            <div className="w-px h-3.5 bg-border" />
            <div className="flex items-center gap-1 text-text-muted">
              <Layers size={11} />
              <span>v{currentVersion}</span>
            </div>
          </>
        )}
      </div>

      {/* Center: Model info */}
      <div className="flex items-center gap-3">
        {modelInfo && (
          <>
            <div className="flex items-center gap-1 text-text-muted" title="Faces">
              <Triangle size={10} />
              <span>{modelInfo.faces.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-text-muted" title="Vertices">
              <Hexagon size={10} />
              <span>{modelInfo.vertices.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-text-muted" title="Bounding box (mm)">
              <Box size={10} />
              <span>{modelInfo.bbox[0]} x {modelInfo.bbox[1]} x {modelInfo.bbox[2]}</span>
            </div>
          </>
        )}
      </div>

      {/* Right: Render mode + version */}
      <div className="flex items-center gap-2 text-text-muted">
        <span className="capitalize">{renderMode.replace('-', '+')}</span>
        <div className="w-px h-3.5 bg-border" />
        <span>GPTCAD v0.1.0</span>
      </div>
    </div>
  );
}
