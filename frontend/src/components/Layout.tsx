import { Code2, MessageSquare, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import TopBar from './Toolbar/TopBar';
import StatusBar from './Toolbar/StatusBar';
import Viewport from './Viewport/Viewport';
import BabylonViewport from './Viewport/BabylonViewport';
import CodePanel from './CodePanel/CodePanel';
import PromptPanel from './PromptPanel/PromptPanel';
import { useResizable } from '../hooks/useResizable';
import { useAppStore } from '../stores/appStore';

function ResizeHandle({ onMouseDown, onDoubleClick }: {
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}) {
  return (
    <div
      className="w-1 cursor-col-resize bg-border hover:bg-accent transition-colors shrink-0"
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    />
  );
}

function CollapsedBar({ icon: Icon, label, onClick, side }: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
  side: 'left' | 'right';
}) {
  return (
    <div className="w-8 bg-bg-panel flex flex-col items-center shrink-0 border-border"
      style={{ borderRight: side === 'left' ? '1px solid' : undefined, borderLeft: side === 'right' ? '1px solid' : undefined }}
    >
      <button
        onClick={onClick}
        className="mt-2 p-1.5 rounded-md hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
        title={`Expand ${label}`}
      >
        {side === 'left' ? <PanelLeftOpen size={14} /> : <PanelRightOpen size={14} />}
      </button>
      <div className="mt-3 flex flex-col items-center gap-1">
        <Icon size={12} className="text-text-muted" />
        <span className="text-[9px] text-text-muted font-medium uppercase tracking-widest"
          style={{ writingMode: 'vertical-lr' }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export default function Layout() {
  const left = useResizable(320, 200, 600, 'left');
  const right = useResizable(360, 240, 600, 'right');
  const renderEngine = useAppStore((s) => s.renderEngine);

  return (
    <div className="flex flex-col h-screen w-screen bg-bg-primary">
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Code Panel (Left) */}
        {left.collapsed ? (
          <CollapsedBar icon={Code2} label="Code" onClick={left.toggle} side="left" />
        ) : (
          <>
            <div
              className="shrink-0 bg-bg-panel flex flex-col overflow-hidden transition-[width] duration-200"
              style={{ width: left.width }}
            >
              <CodePanel onCollapse={left.toggle} />
            </div>
            <ResizeHandle onMouseDown={left.onMouseDown} onDoubleClick={left.onDoubleClick} />
          </>
        )}

        {/* Viewport (Center) */}
        <div className="flex-1 relative bg-bg-primary min-w-0">
          {renderEngine === 'babylonjs' ? <BabylonViewport /> : <Viewport />}
        </div>

        {/* Prompt Panel (Right) */}
        {right.collapsed ? (
          <CollapsedBar icon={MessageSquare} label="Prompt" onClick={right.toggle} side="right" />
        ) : (
          <>
            <ResizeHandle onMouseDown={right.onMouseDown} onDoubleClick={right.onDoubleClick} />
            <div
              className="shrink-0 bg-bg-panel flex flex-col overflow-hidden transition-[width] duration-200"
              style={{ width: right.width }}
            >
              <PromptPanel onCollapse={right.toggle} />
            </div>
          </>
        )}
      </div>

      <StatusBar />
    </div>
  );
}
