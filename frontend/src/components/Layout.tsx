import TopBar from './Toolbar/TopBar';
import StatusBar from './Toolbar/StatusBar';
import Viewport from './Viewport/Viewport';
import CodePanel from './CodePanel/CodePanel';
import PromptPanel from './PromptPanel/PromptPanel';
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
          className="shrink-0 bg-bg-panel flex flex-col overflow-hidden"
          style={{ width: left.width }}
        >
          <CodePanel />
        </div>

        <ResizeHandle onMouseDown={left.onMouseDown} />

        {/* Viewport (Center) */}
        <div className="flex-1 relative bg-bg-primary min-w-0">
          <Viewport />
        </div>

        <ResizeHandle onMouseDown={right.onMouseDown} />

        {/* Prompt Panel (Right) */}
        <div
          className="shrink-0 bg-bg-panel flex flex-col overflow-hidden"
          style={{ width: right.width }}
        >
          <PromptPanel />
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
