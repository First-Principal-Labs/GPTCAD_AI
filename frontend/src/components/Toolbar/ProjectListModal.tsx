import { useEffect, useState } from 'react';
import { X, Trash2, Loader2, FolderOpen, Plus } from 'lucide-react';
import { listProjects, getProject, deleteProject } from '../../api/client';
import { useAppStore } from '../../stores/appStore';
import type { ProjectSummary } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProjectListModal({ open, onClose }: Props) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const setProjectId = useAppStore((s) => s.setProjectId);
  const setProjectName = useAppStore((s) => s.setProjectName);
  const setModelUrl = useAppStore((s) => s.setModelUrl);
  const setCode = useAppStore((s) => s.setCode);
  const setCurrentVersion = useAppStore((s) => s.setCurrentVersion);
  const resetProject = useAppStore((s) => s.resetProject);

  useEffect(() => {
    if (open) {
      setLoading(true);
      listProjects()
        .then(setProjects)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleOpen = async (project: ProjectSummary) => {
    try {
      const detail = await getProject(project.id);
      setProjectId(detail.id);
      setProjectName(detail.name);

      // Load the latest version
      if (detail.versions.length > 0) {
        const latest = detail.versions[detail.versions.length - 1];
        setModelUrl(latest.model_url);
        setCode(latest.code || '');
        setCurrentVersion(latest.version);
      }
      onClose();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleNew = () => {
    resetProject();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-bg-panel border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-accent" />
            <span className="text-sm font-medium text-text-primary">Projects</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNew}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-accent hover:bg-bg-elevated rounded-md transition-colors"
            >
              <Plus size={12} />
              New
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-bg-elevated text-text-muted"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-text-muted" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs">
              No projects yet. Create one by submitting a prompt.
            </div>
          ) : (
            <div className="space-y-1">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-bg-elevated cursor-pointer group transition-colors"
                  onClick={() => handleOpen(project)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate">
                      {project.name}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {project.version_count} version{project.version_count !== 1 ? 's' : ''}
                      {' · '}
                      {new Date(project.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                    disabled={deletingId === project.id}
                    className="p-1 rounded text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                    title="Delete project"
                  >
                    {deletingId === project.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
