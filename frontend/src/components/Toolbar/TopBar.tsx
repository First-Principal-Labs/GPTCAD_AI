import { useState, useRef } from 'react';
import { FolderOpen, Plus, Check, Pencil } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { renameProject } from '../../api/client';
import ExportMenu from './ExportMenu';
import ProjectListModal from './ProjectListModal';

export default function TopBar() {
  const projectId = useAppStore((s) => s.projectId);
  const projectName = useAppStore((s) => s.projectName);
  const setProjectName = useAppStore((s) => s.setProjectName);
  const resetProject = useAppStore((s) => s.resetProject);

  const [projectsOpen, setProjectsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    if (!projectId) return;
    setEditValue(projectName);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const finishEditing = async () => {
    setEditing(false);
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === projectName || !projectId) return;
    setProjectName(trimmed);
    try {
      await renameProject(projectId, trimmed);
    } catch {
      // revert on failure
      setProjectName(projectName);
    }
  };

  return (
    <>
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

          {/* Editable project name */}
          {editing ? (
            <form
              onSubmit={(e) => { e.preventDefault(); finishEditing(); }}
              className="flex items-center gap-1"
            >
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={finishEditing}
                className="bg-bg-elevated border border-border rounded px-2 py-0.5 text-sm text-text-primary focus:outline-none focus:border-accent w-48"
              />
              <button
                type="submit"
                className="p-1 rounded hover:bg-bg-elevated text-accent"
              >
                <Check size={14} />
              </button>
            </form>
          ) : (
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 group"
              title={projectId ? 'Click to rename' : ''}
            >
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                {projectName}
              </span>
              {projectId && (
                <Pencil size={11} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* New project */}
          <button
            onClick={resetProject}
            className="p-2 rounded-md hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
            title="New project"
          >
            <Plus size={16} />
          </button>

          {/* Open project list */}
          <button
            onClick={() => setProjectsOpen(true)}
            className="p-2 rounded-md hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
            title="Open project"
          >
            <FolderOpen size={16} />
          </button>

          {/* Export menu */}
          <ExportMenu />
        </div>
      </div>

      <ProjectListModal open={projectsOpen} onClose={() => setProjectsOpen(false)} />
    </>
  );
}
