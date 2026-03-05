import { useState } from 'react';
import {
  Box, Circle, Globe, Triangle, Donut,
  Combine, Scissors, Layers3,
  Move, RotateCw,
  X, Loader2,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { manualOperation } from '../../api/client';

interface ToolDef {
  id: string;
  category: 'primitive' | 'boolean' | 'transform';
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  fields: { name: string; label: string; default: number }[];
}

const TOOLS: ToolDef[] = [
  // Primitives
  { id: 'box', category: 'primitive', icon: Box, label: 'Box', fields: [
    { name: 'width', label: 'W', default: 20 },
    { name: 'height', label: 'H', default: 20 },
    { name: 'depth', label: 'D', default: 20 },
  ]},
  { id: 'cylinder', category: 'primitive', icon: Circle, label: 'Cylinder', fields: [
    { name: 'radius', label: 'R', default: 10 },
    { name: 'height', label: 'H', default: 20 },
  ]},
  { id: 'sphere', category: 'primitive', icon: Globe, label: 'Sphere', fields: [
    { name: 'radius', label: 'R', default: 10 },
  ]},
  { id: 'cone', category: 'primitive', icon: Triangle, label: 'Cone', fields: [
    { name: 'radius1', label: 'R1', default: 10 },
    { name: 'radius2', label: 'R2', default: 0 },
    { name: 'height', label: 'H', default: 20 },
  ]},
  { id: 'torus', category: 'primitive', icon: Donut, label: 'Torus', fields: [
    { name: 'major_radius', label: 'R', default: 15 },
    { name: 'minor_radius', label: 'r', default: 4 },
  ]},
  // Booleans
  { id: 'union', category: 'boolean', icon: Combine, label: 'Union', fields: [
    { name: 'width', label: 'Tool W', default: 10 },
    { name: 'height', label: 'Tool H', default: 10 },
    { name: 'depth', label: 'Tool D', default: 10 },
    { name: 'x', label: 'X', default: 5 },
    { name: 'y', label: 'Y', default: 5 },
    { name: 'z', label: 'Z', default: 5 },
  ]},
  { id: 'cut', category: 'boolean', icon: Scissors, label: 'Cut', fields: [
    { name: 'width', label: 'Tool W', default: 10 },
    { name: 'height', label: 'Tool H', default: 10 },
    { name: 'depth', label: 'Tool D', default: 10 },
    { name: 'x', label: 'X', default: 5 },
    { name: 'y', label: 'Y', default: 5 },
    { name: 'z', label: 'Z', default: 5 },
  ]},
  { id: 'intersect', category: 'boolean', icon: Layers3, label: 'Intersect', fields: [
    { name: 'width', label: 'Tool W', default: 10 },
    { name: 'height', label: 'Tool H', default: 10 },
    { name: 'depth', label: 'Tool D', default: 10 },
    { name: 'x', label: 'X', default: 0 },
    { name: 'y', label: 'Y', default: 0 },
    { name: 'z', label: 'Z', default: 0 },
  ]},
  // Transforms
  { id: 'move', category: 'transform', icon: Move, label: 'Move', fields: [
    { name: 'x', label: 'X', default: 0 },
    { name: 'y', label: 'Y', default: 0 },
    { name: 'z', label: 'Z', default: 10 },
  ]},
  { id: 'rotate', category: 'transform', icon: RotateCw, label: 'Rotate', fields: [
    { name: 'angle', label: 'Angle', default: 45 },
  ]},
];

export default function ManualTools() {
  const [activeTool, setActiveTool] = useState<ToolDef | null>(null);
  const [params, setParams] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const projectId = useAppStore((s) => s.projectId);
  const code = useAppStore((s) => s.code);
  const setModelUrl = useAppStore((s) => s.setModelUrl);
  const setCode = useAppStore((s) => s.setCode);
  const setProjectId = useAppStore((s) => s.setProjectId);
  const setCurrentVersion = useAppStore((s) => s.setCurrentVersion);
  const setError = useAppStore((s) => s.setError);

  const openTool = (tool: ToolDef) => {
    if (tool.category !== 'primitive' && !code) return; // need existing code for booleans/transforms
    setActiveTool(tool);
    const defaults: Record<string, number> = {};
    tool.fields.forEach((f) => { defaults[f.name] = f.default; });
    setParams(defaults);
  };

  const handleSubmit = async () => {
    if (!activeTool) return;
    setLoading(true);
    setError(null);

    try {
      const reqParams: Record<string, number | string> = { ...params };

      // For booleans, wrap tool params
      if (activeTool.category === 'boolean') {
        const result = await manualOperation({
          operation: activeTool.id,
          category: 'boolean',
          params: {
            tool_type: 'box',
            tool_params: JSON.stringify(params),
            ...params,
          },
          project_id: projectId ?? undefined,
          existing_code: code || undefined,
        });
        setProjectId(result.project_id);
        setModelUrl(result.model_url);
        setCode(result.code);
        setCurrentVersion(result.version);
        setActiveTool(null);
        return;
      }

      const result = await manualOperation({
        operation: activeTool.id,
        category: activeTool.category,
        params: reqParams,
        project_id: projectId ?? undefined,
        existing_code: code || undefined,
      });

      setProjectId(result.project_id);
      setModelUrl(result.model_url);
      setCode(result.code);
      setCurrentVersion(result.version);
      setActiveTool(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const needsExistingCode = (tool: ToolDef) =>
    tool.category !== 'primitive' && !code;

  return (
    <>
      {/* Toolbar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-0.5 bg-bg-panel/90 backdrop-blur-sm rounded-lg border border-border p-1 z-10">
        {/* Primitives */}
        <div className="flex gap-0.5">
          {TOOLS.filter((t) => t.category === 'primitive').map((tool) => (
            <button
              key={tool.id}
              onClick={() => openTool(tool)}
              title={tool.label}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              <tool.icon size={14} />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-border self-center mx-0.5" />

        {/* Booleans */}
        <div className="flex gap-0.5">
          {TOOLS.filter((t) => t.category === 'boolean').map((tool) => (
            <button
              key={tool.id}
              onClick={() => openTool(tool)}
              title={needsExistingCode(tool) ? `${tool.label} (create a shape first)` : tool.label}
              disabled={needsExistingCode(tool)}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <tool.icon size={14} />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-border self-center mx-0.5" />

        {/* Transforms */}
        <div className="flex gap-0.5">
          {TOOLS.filter((t) => t.category === 'transform').map((tool) => (
            <button
              key={tool.id}
              onClick={() => openTool(tool)}
              title={needsExistingCode(tool) ? `${tool.label} (create a shape first)` : tool.label}
              disabled={needsExistingCode(tool)}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <tool.icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Parameter Popover */}
      {activeTool && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-bg-panel border border-border rounded-lg shadow-xl p-3 z-20 min-w-[220px]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-medium text-text-primary">{activeTool.label}</span>
            <button
              onClick={() => setActiveTool(null)}
              className="p-0.5 rounded hover:bg-bg-elevated text-text-muted"
            >
              <X size={12} />
            </button>
          </div>

          <div className="space-y-2">
            {activeTool.fields.map((field) => (
              <div key={field.name} className="flex items-center gap-2">
                <label className="text-[10px] text-text-muted w-10 shrink-0 text-right">
                  {field.label}
                </label>
                <input
                  type="number"
                  value={params[field.name] ?? field.default}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, [field.name]: parseFloat(e.target.value) || 0 }))
                  }
                  className="flex-1 bg-bg-elevated border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent w-0"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-3 w-full py-1.5 bg-accent hover:bg-accent-hover rounded-md text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Creating...
              </>
            ) : (
              `Create ${activeTool.label}`
            )}
          </button>
        </div>
      )}
    </>
  );
}
