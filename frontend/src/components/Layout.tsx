import TopBar from './Toolbar/TopBar';
import StatusBar from './Toolbar/StatusBar';
import Viewport from './Viewport/Viewport';
import { useResizable } from '../hooks/useResizable';

function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="w-1 cursor-col-resize bg-border hover:bg-accent transition-colors shrink-0"
      onMouseDown={onMouseDown}
    />
  );
}

export default function Layout() {
  const left = useResizable(320, 200, 600, 'left');
  const right = useResizable(360, 240, 600, 'right');

  return (
    <div className="flex flex-col h-screen w-screen bg-bg-primary">
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Code Panel (Left) */}
        <div
          className="shrink-0 bg-bg-panel border-r border-border flex flex-col"
          style={{ width: left.width }}
        >
          <div className="h-9 flex items-center px-3 border-b border-border">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Code</span>
          </div>
          <div className="flex-1 flex items-center justify-center text-text-muted text-xs">
            Code panel
          </div>
        </div>

        <ResizeHandle onMouseDown={left.onMouseDown} />

        {/* Viewport (Center) */}
        <div className="flex-1 relative bg-bg-primary min-w-0">
          <Viewport />
        </div>

        <ResizeHandle onMouseDown={right.onMouseDown} />

        {/* Prompt Panel (Right) */}
        <div
          className="shrink-0 bg-bg-panel border-l border-border flex flex-col"
          style={{ width: right.width }}
        >
          <div className="h-9 flex items-center px-3 border-b border-border">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Prompt</span>
          </div>
          <div className="flex-1 flex items-center justify-center text-text-muted text-xs">
            Prompt panel
          </div>
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
