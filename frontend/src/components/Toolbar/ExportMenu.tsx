import { useState, useRef, useEffect } from 'react';
import { Download, FileCode, Box, FileText } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { getExportUrl } from '../../api/client';
import type { ExportFormat } from '../../types';

interface FormatOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
}

const FORMATS: FormatOption[] = [
  { format: 'step', label: 'STEP', description: 'CAD interchange', icon: Box },
  { format: 'stl', label: 'STL', description: '3D printing', icon: Box },
  { format: 'obj', label: 'OBJ', description: 'Mesh with materials', icon: Box },
  { format: 'glb', label: 'GLB', description: 'Web 3D format', icon: Box },
  { format: 'py', label: 'Python', description: 'FreeCAD script', icon: FileCode },
];

export default function ExportMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const projectId = useAppStore((s) => s.projectId);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleExport = (format: ExportFormat) => {
    if (!projectId) return;
    const url = getExportUrl(projectId, format);
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={!projectId}
        className="p-2 rounded-md hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Export model"
      >
        <Download size={16} />
      </button>

      {open && projectId && (
        <div className="absolute right-0 top-full mt-1 bg-bg-panel border border-border rounded-lg shadow-xl py-1 z-50 min-w-[180px]">
          <div className="px-3 py-1.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">
            Export As
          </div>
          {FORMATS.map((opt) => (
            <button
              key={opt.format}
              onClick={() => handleExport(opt.format)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-bg-elevated transition-colors"
            >
              <opt.icon size={14} className="text-text-muted shrink-0" />
              <div>
                <div className="text-xs text-text-primary font-medium">{opt.label}</div>
                <div className="text-[10px] text-text-muted">{opt.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
