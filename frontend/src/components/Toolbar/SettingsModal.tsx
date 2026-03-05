import { X, Monitor, Sparkles, Box, Hexagon } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

const STYLES = [
  {
    id: 'cad' as const,
    label: 'CAD',
    description: 'Matte finish with edge lines. Best for engineering visualization and geometry inspection.',
    icon: Monitor,
  },
  {
    id: 'studio' as const,
    label: 'Studio',
    description: 'Glossy metallic with studio lighting. Best for presentation and showcase renders.',
    icon: Sparkles,
  },
];

const ENGINES = [
  {
    id: 'threejs' as const,
    label: 'Three.js',
    description: 'React Three Fiber with postprocessing. Mature ecosystem, wide community support.',
    icon: Box,
  },
  {
    id: 'babylonjs' as const,
    label: 'Babylon.js',
    description: 'Microsoft Babylon engine. Strong PBR pipeline and native edge rendering.',
    icon: Hexagon,
  },
];

export default function SettingsModal({ open, onClose }: Props) {
  const visualStyle = useAppStore((s) => s.visualStyle);
  const setVisualStyle = useAppStore((s) => s.setVisualStyle);
  const renderEngine = useAppStore((s) => s.renderEngine);
  const setRenderEngine = useAppStore((s) => s.setRenderEngine);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-bg-panel border border-border rounded-xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium text-text-primary">Settings</span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-elevated text-text-muted"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Visual Style */}
          <div>
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider block mb-2">
              Visual Style
            </label>
            <div className="space-y-2">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setVisualStyle(style.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${
                    visualStyle === style.id
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-border hover:bg-bg-elevated'
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-md ${
                    visualStyle === style.id ? 'bg-accent/15 text-accent' : 'bg-bg-elevated text-text-muted'
                  }`}>
                    <style.icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${
                        visualStyle === style.id ? 'text-accent' : 'text-text-primary'
                      }`}>
                        {style.label}
                      </span>
                      {visualStyle === style.id && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">
                      {style.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Render Engine */}
          <div>
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider block mb-2">
              Render Engine
            </label>
            <div className="space-y-2">
              {ENGINES.map((eng) => (
                <button
                  key={eng.id}
                  onClick={() => setRenderEngine(eng.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${
                    renderEngine === eng.id
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-border hover:bg-bg-elevated'
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-md ${
                    renderEngine === eng.id ? 'bg-accent/15 text-accent' : 'bg-bg-elevated text-text-muted'
                  }`}>
                    <eng.icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${
                        renderEngine === eng.id ? 'text-accent' : 'text-text-primary'
                      }`}>
                        {eng.label}
                      </span>
                      {renderEngine === eng.id && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">
                      {eng.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
