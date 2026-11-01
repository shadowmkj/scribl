import React, { useEffect, useRef, useState } from 'react';
import { useCameraStore } from '../../stores/useCameraStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { ScratchRenderer } from '../../core/engine/ScratchRenderer';
import { renderCommittedCanvas } from '../../core/engine/CanvasRenderer';
import { PointerRouter } from '../../core/input/PointerRouter';
import { MarqueeBox } from '../../core/input/ToolFSM';
import { InfiniteGrid } from './InfiniteGrid';
import { SelectionOverlay } from './SelectionOverlay';

const ERASER_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='7' fill='rgba(255,255,255,0.06)' stroke='%2394a3b8' stroke-width='1.2'/%3E%3Ccircle cx='10' cy='10' r='1' fill='%2394a3b8'/%3E%3C/svg%3E") 10 10, crosshair`;

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
  const isSpacePressed = useCameraStore((s) => s.isSpacePressed);
  const isPanning = useCameraStore((s) => s.isPanning);

  const [marqueeBox, setMarqueeBox] = useState<MarqueeBox | null>(null);
  const scratchRendererRef = useRef<ScratchRenderer>(new ScratchRenderer());
  const pointerRouterRef = useRef<PointerRouter | null>(null);

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
      pointerRouterRef.current = router;
    }
  }, []);

  // Redraw committed canvas
  useEffect(() => {
    const canvas = committedCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderCommittedCanvas(ctx, elements, elementIds, camera, width, height);
  }, [elements, elementIds, camera, width, height]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    zoomAt(e.clientX, e.clientY, camera.zoom * zoomFactor);
  };

  const dpr = window.devicePixelRatio || 1;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#090d16',
        touchAction: 'none',
        userSelect: 'none',
        cursor: isPanning
          ? 'grabbing'
          : isSpacePressed
            ? 'grab'
            : currentTool === 'eraser'
              ? ERASER_CURSOR
              : currentTool === 'pen'
                ? 'crosshair'
                : 'default',
      }}
      onWheel={handleWheel}
      onPointerDown={(e) => pointerRouterRef.current?.handlePointerDown(e.nativeEvent, containerRef.current!)}
      onPointerMove={(e) => pointerRouterRef.current?.handlePointerMove(e.nativeEvent)}
      onPointerUp={(e) => pointerRouterRef.current?.handlePointerUp(e.nativeEvent, containerRef.current!)}
    >
      <InfiniteGrid camera={camera} width={width} height={height} />

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
      />
    </div>
  );
};
