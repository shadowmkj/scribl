import React, { useEffect, useRef, useState } from 'react';
import { screenToWorld, worldToScreen } from '../../core/camera/cameraMath';
import { renderCommittedCanvas } from '../../core/engine/CanvasRenderer';
import { ScratchRenderer } from '../../core/engine/ScratchRenderer';
import {
  computeSelectionBounds,
  HandleType,
  hitTestHandles,
} from '../../core/geometry/transformMath';
import { PointerRouter } from '../../core/input/PointerRouter';
import { MarqueeBox } from '../../core/input/ToolFSM';
import { importDrawingDocument } from '../../core/persistence/importers';
import { useCameraStore } from '../../stores/useCameraStore';
import { useConfigStore } from '../../stores/useConfigStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { ImportNotification } from '../ui/ImportToast';
import { InfiniteGrid } from './InfiniteGrid';
import { SelectionOverlay } from './SelectionOverlay';

const ERASER_CURSOR =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='7' fill='rgba(255,255,255,0.06)' stroke='%2394a3b8' stroke-width='1.2'/%3E%3Ccircle cx='10' cy='10' r='1' fill='%2394a3b8'/%3E%3C/svg%3E") 10 10, crosshair`;

export interface CanvasViewportProps {
  onImportNotification?: (notif: ImportNotification) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({ onImportNotification }) => {
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
  const [isDraggingFile, setIsDraggingFile] = useState(false);

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

  const handleDragEnter = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      setIsDraggingFile(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = importDrawingDocument(text, file.name);

        if (result.elements.length === 0) {
          if (result.discardedCount > 0) {
            onImportNotification?.({
              id: String(Date.now()),
              type: 'warning',
              message: `No supported elements found in ${file.name}`,
              details: `${result.discardedCount} unsupported items (${
                result.discardedTypes.join(', ')
              }) were discarded.`,
            });
          }
          return;
        }

        // Compute drop position in world coordinates
        const rect = containerRef.current?.getBoundingClientRect();
        const screenX = rect ? e.clientX - rect.left : e.clientX;
        const screenY = rect ? e.clientY - rect.top : e.clientY;
        const dropWorld = screenToWorld(screenX, screenY, camera, width, height);

        // Center elements at drop position
        const origCenterX = (result.bounds.minX + result.bounds.maxX) / 2;
        const origCenterY = (result.bounds.minY + result.bounds.maxY) / 2;
        const dx = dropWorld.x - origCenterX;
        const dy = dropWorld.y - origCenterY;

        const translatedElements = result.elements.map((el) => {
          if (el.type === 'stroke') {
            return {
              ...el,
              x: el.x + dx,
              y: el.y + dy,
              points: el.points.map((pt) => ({ ...pt, x: pt.x + dx, y: pt.y + dy })),
            };
          } else if (el.type === 'shape') {
            return {
              ...el,
              x: el.x + dx,
              y: el.y + dy,
              startPoint: el.startPoint
                ? { x: el.startPoint.x + dx, y: el.startPoint.y + dy }
                : undefined,
              endPoint: el.endPoint
                ? { x: el.endPoint.x + dx, y: el.endPoint.y + dy }
                : undefined,
            };
          } else if (el.type === 'text') {
            return {
              ...el,
              x: el.x + dx,
              y: el.y + dy,
            };
          }
          return el;
        });

        useDocumentStore.getState().insertElements(translatedElements);

        if (result.discardedCount > 0) {
          onImportNotification?.({
            id: String(Date.now()),
            type: 'warning',
            message: `Imported ${result.elements.length} elements from ${file.name}`,
            details: `${result.discardedCount} unsupported items (${
              result.discardedTypes.join(', ')
            }) were discarded.`,
          });
        } else {
          onImportNotification?.({
            id: String(Date.now()),
            type: 'success',
            message: `Imported ${result.elements.length} elements from ${file.name}`,
          });
        }
      } catch (err) {
        onImportNotification?.({
          id: String(Date.now()),
          type: 'error',
          message: `Failed to import ${file.name}`,
          details: err instanceof Error ? err.message : String(err),
        });
      }
    };
    reader.readAsText(file);
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
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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

      {/* Drag & Drop Visual Overlay */}
      {isDraggingFile && (
        <div
          data-testid='canvas-drop-overlay'
          style={{
            position: 'absolute',
            inset: 16,
            borderRadius: 16,
            border: '2px dashed var(--color-accent-light, #38bdf8)',
            background: 'rgba(56, 189, 248, 0.08)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'var(--color-accent, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)',
            }}
          >
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='#ffffff'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
              <polyline points='7 10 12 15 17 10' />
              <line x1='12' y1='15' x2='12' y2='3' />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                margin: '0 0 4px 0',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-text-primary, #f8fafc)',
              }}
            >
              Drop drawing to insert
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'var(--color-text-secondary, #94a3b8)',
              }}
            >
              Supports .scribl, .excalidraw, and .tldr files
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
