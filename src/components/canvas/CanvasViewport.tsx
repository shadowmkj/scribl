import React, { useEffect, useRef, useState } from 'react';
import { worldToScreen } from '../../core/camera/cameraMath';
import { renderCommittedCanvas } from '../../core/engine/CanvasRenderer';
import { ScratchRenderer } from '../../core/engine/ScratchRenderer';
import {
  computeSelectionBounds,
  HandleType,
  hitTestHandles,
} from '../../core/geometry/transformMath';
import { PointerRouter } from '../../core/input/PointerRouter';
import { MarqueeBox } from '../../core/input/ToolFSM';
import { useCameraStore } from '../../stores/useCameraStore';
import { useConfigStore } from '../../stores/useConfigStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { InfiniteGrid } from './InfiniteGrid';
import { SelectionOverlay } from './SelectionOverlay';

const ERASER_CURSOR =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='7' fill='rgba(255,255,255,0.06)' stroke='%2394a3b8' stroke-width='1.2'/%3E%3Ccircle cx='10' cy='10' r='1' fill='%2394a3b8'/%3E%3C/svg%3E") 10 10, crosshair`;

export const CanvasViewport: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const committedCanvasRef = useRef<HTMLCanvasElement>(null);
  const scratchCanvasRef = useRef<HTMLCanvasElement>(null);

  const camera = useCameraStore((s) => s.camera);
  const width = useCameraStore((s) => s.viewportWidth);
  const height = useCameraStore((s) => s.viewportHeight);
  const setDimensions = useCameraStore((s) => s.setDimensions);
  const zoomAt = useCameraStore((s) => s.zoomAt);

  const elements = useDocumentStore((s) => s.elements);
  const elementIds = useDocumentStore((s) => s.elementIds);
  const selectedIds = useDocumentStore((s) => s.selectedIds);
  const currentTool = useToolStore((s) => s.currentTool);
  const editingText = useToolStore((s) => s.editingText);
  const isSpacePressed = useCameraStore((s) => s.isSpacePressed);
  const isPanning = useCameraStore((s) => s.isPanning);
  const dotGrid = useConfigStore((s) => s.config.options.dot_grid);
  const theme = useConfigStore((s) => s.config.theme);
  const themeMode = theme.active?.mode || 'dark';

  const [marqueeBox, setMarqueeBox] = useState<MarqueeBox | null>(null);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [rotationAngle, setRotationAngle] = useState<number | null>(null);
  const [isRotateKeyHeld, setIsRotateKeyHeld] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<HandleType | null>(null);

  const scratchRendererRef = useRef<ScratchRenderer>(new ScratchRenderer());
  const pointerRouterRef = useRef<PointerRouter | null>(null);

  // Track Alt key for zoom-out cursor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.altKey) {
        setIsAltPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || !e.altKey) {
        setIsAltPressed(false);
      }
    };
    const handleBlur = () => {
      setIsAltPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Track 'r' key for rotation mode when selection is active (Visual mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((e.key === 'r' || e.key === 'R') && selectedIds.length > 0) {
        if (pointerRouterRef.current) {
          pointerRouterRef.current.isRotateKeyHeld = true;
        }
        setIsRotateKeyHeld(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        if (pointerRouterRef.current) {
          pointerRouterRef.current.isRotateKeyHeld = false;
        }
        setIsRotateKeyHeld(false);
      }
    };

    const handleBlur = () => {
      if (pointerRouterRef.current) {
        pointerRouterRef.current.isRotateKeyHeld = false;
      }
      setIsRotateKeyHeld(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [selectedIds.length]);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setIsRotateKeyHeld(false);
      if (pointerRouterRef.current) {
        pointerRouterRef.current.isRotateKeyHeld = false;
      }
    }
  }, [selectedIds.length]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions(rect.width, rect.height);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setDimensions]);

  // Init scratch renderer and router
  useEffect(() => {
    if (scratchCanvasRef.current) {
      scratchRendererRef.current.init(scratchCanvasRef.current);
      const router = new PointerRouter(scratchRendererRef.current);
      router.onMarqueeUpdate = setMarqueeBox;
      router.onRotationUpdate = setRotationAngle;
      pointerRouterRef.current = router;
    }
  }, []);

  // Redraw committed canvas
  useEffect(() => {
    const canvas = committedCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderCommittedCanvas(
      ctx,
      elements,
      elementIds,
      camera,
      width,
      height,
      dpr,
      editingText?.elementId,
      themeMode,
    );
  }, [elements, elementIds, camera, width, height, editingText?.elementId, themeMode]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    zoomAt(e.clientX, e.clientY, camera.zoom * zoomFactor);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    pointerRouterRef.current?.handlePointerMove(e.nativeEvent);

    if (
      pointerRouterRef.current?.getState() === 'IDLE'
      && currentTool === 'select'
      && selectedIds.length > 0
    ) {
      const bounds = computeSelectionBounds(elements, selectedIds);
      if (bounds) {
        const screenHandles = {
          nw: worldToScreen(bounds.minX, bounds.minY, camera, width, height),
          ne: worldToScreen(bounds.maxX, bounds.minY, camera, width, height),
          se: worldToScreen(bounds.maxX, bounds.maxY, camera, width, height),
          sw: worldToScreen(bounds.minX, bounds.maxY, camera, width, height),
        };
        const hit = hitTestHandles({ x: e.clientX, y: e.clientY }, screenHandles, 12);
        setHoveredHandle(hit);
        return;
      }
    }
    if (hoveredHandle !== null) {
      setHoveredHandle(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointerRouterRef.current?.handlePointerUp(e.nativeEvent, containerRef.current!);
    setHoveredHandle(null);
  };

  const handlePointerLeave = () => {
    setHoveredHandle(null);
  };

  const dpr = window.devicePixelRatio || 1;

  let cursorStyle = 'default';
  if (isPanning) {
    cursorStyle = 'grabbing';
  } else if (isSpacePressed) {
    cursorStyle = 'grab';
  } else if (currentTool === 'eraser') {
    cursorStyle = ERASER_CURSOR;
  } else if (currentTool === 'text' || editingText !== null) {
    cursorStyle = 'text';
  } else if (currentTool === 'pen') {
    cursorStyle = 'crosshair';
  } else if (currentTool === 'zoom') {
    cursorStyle = isAltPressed ? 'zoom-out' : 'zoom-in';
  } else if (currentTool === 'select') {
    const fsmState = pointerRouterRef.current?.getState() ?? 'IDLE';
    if (fsmState === 'ROTATING_SELECTION' || isRotateKeyHeld) {
      cursorStyle = 'crosshair';
    } else if (fsmState === 'RESIZING_SELECTION') {
      const handle = pointerRouterRef.current?.getActiveHandle();
      cursorStyle = handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize';
    } else if (fsmState === 'DRAGGING_SELECTION') {
      cursorStyle = 'move';
    } else if (hoveredHandle) {
      cursorStyle = hoveredHandle === 'nw' || hoveredHandle === 'se'
        ? 'nwse-resize'
        : 'nesw-resize';
    } else {
      cursorStyle = 'default';
    }
  }

  return (
    <div
      ref={containerRef}
      data-testid='canvas-viewport'
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--color-canvas-bg, #090d16)',
        touchAction: 'none',
        userSelect: 'none',
        cursor: cursorStyle,
      }}
      onWheel={handleWheel}
      onPointerDown={(e) =>
        pointerRouterRef.current?.handlePointerDown(e.nativeEvent, containerRef.current!)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onDoubleClick={(e) => pointerRouterRef.current?.handleDoubleClick(e.nativeEvent)}
    >
      {dotGrid && <InfiniteGrid camera={camera} width={width} height={height} />}

      {/* Committed Canvas Layer */}
      <canvas
        ref={committedCanvasRef}
        width={width * dpr}
        height={height * dpr}
        style={{
          position: 'absolute',
          inset: 0,
          width: `${width}px`,
          height: `${height}px`,
        }}
      />

      {/* Active Scratch Canvas Layer */}
      <canvas
        ref={scratchCanvasRef}
        width={width * dpr}
        height={height * dpr}
        style={{
          position: 'absolute',
          inset: 0,
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: 'none',
        }}
      />

      {/* SVG Selection & Marquee Overlay */}
      <SelectionOverlay
        elements={elements}
        selectedIds={selectedIds}
        camera={camera}
        width={width}
        height={height}
        marqueeBox={marqueeBox}
        rotationAngle={rotationAngle}
        editingTextElementId={editingText?.elementId ?? (editingText ? '__new__' : null)}
      />
    </div>
  );
};
