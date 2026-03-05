import { Download, Settings, FolderOpen } from 'lucide-react';

export default function TopBar() {
  return (
    <div className="h-12 flex items-center justify-between px-4 border-b border-border bg-bg-panel shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-xs">G</span>
          </div>
          <span className="text-base font-bold tracking-tight text-text-primary">
            GPTCAD
          </span>
        </div>
        <div className="w-px h-5 bg-border mx-1" />
        <span className="text-sm text-text-secondary">Untitled Project</span>
      </div>

      <div className="flex items-center gap-1">
        <button className="p-2 rounded-md hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors">
          <FolderOpen size={16} />
        </button>
        <button className="p-2 rounded-md hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors">
          <Download size={16} />
        </button>
        <button className="p-2 rounded-md hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors">
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}
