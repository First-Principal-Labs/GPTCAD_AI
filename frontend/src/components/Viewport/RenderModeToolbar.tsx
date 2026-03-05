import { Box, Grid3x3, Layers, Eye } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

const modes = [
  { id: 'shaded' as const, icon: Box, label: 'Shaded' },
  { id: 'wireframe' as const, icon: Grid3x3, label: 'Wireframe' },
  { id: 'shaded-wireframe' as const, icon: Layers, label: 'Shaded + Edges' },
  { id: 'xray' as const, icon: Eye, label: 'X-Ray' },
];

export default function RenderModeToolbar() {
  const renderMode = useAppStore((s) => s.renderMode);
  const setRenderMode = useAppStore((s) => s.setRenderMode);

  return (
    <div className="absolute top-3 left-3 flex gap-0.5 bg-bg-panel/90 backdrop-blur-sm rounded-lg border border-border p-0.5 z-10">
      {modes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setRenderMode(id)}
          title={label}
          className={`p-1.5 rounded-md transition-colors ${
            renderMode === id
              ? 'bg-accent text-white'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
          }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
