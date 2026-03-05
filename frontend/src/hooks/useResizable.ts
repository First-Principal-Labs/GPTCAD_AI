import { useCallback, useRef, useState } from 'react';

export function useResizable(initialWidth: number, min: number, max: number, direction: 'left' | 'right') {
  const [width, setWidth] = useState(initialWidth);
  const [collapsed, setCollapsed] = useState(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const prevWidth = useRef(initialWidth);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      if (prev) {
        // Expanding: restore previous width
        setWidth(prevWidth.current);
      } else {
        // Collapsing: save current width
        prevWidth.current = width;
        setWidth(0);
      }
      return !prev;
    });
  }, [width]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (collapsed) return;
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = ev.clientX - startX.current;
      const newWidth = direction === 'left'
        ? startWidth.current + delta
        : startWidth.current - delta;
      setWidth(Math.max(min, Math.min(max, newWidth)));
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [width, min, max, direction, collapsed]);

  const onDoubleClick = useCallback(() => {
    toggle();
  }, [toggle]);

  return { width: collapsed ? 0 : width, collapsed, toggle, onMouseDown, onDoubleClick };
}
