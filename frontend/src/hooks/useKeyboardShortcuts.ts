import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

const RENDER_MODES = ['shaded', 'wireframe', 'shaded-wireframe', 'xray'] as const;

export function useKeyboardShortcuts() {
  const triggerFitView = useAppStore((s) => s.triggerFitView);
  const setRenderMode = useAppStore((s) => s.setRenderMode);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // F — Fit view (only when not in input)
      if (e.key === 'f' && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        triggerFitView();
        return;
      }

      // 1-4 — Render modes (only when not in input)
      if (!isInput && !e.ctrlKey && !e.metaKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4) {
          e.preventDefault();
          setRenderMode(RENDER_MODES[num - 1]);
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [triggerFitView, setRenderMode]);
}
