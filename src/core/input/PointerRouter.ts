import { ToolType } from '../../types/canvas';
import { screenToWorld } from '../camera/cameraMath';
import { ScratchRenderer } from '../engine/ScratchRenderer';
import { createStrokeElement } from '../engine/InkingEngine';
import { hitTestPoint, hitTestMarquee } from '../engine/HitTester';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { useCameraStore } from '../../stores/useCameraStore';
import { FSMState, MarqueeBox } from './ToolFSM';

export class PointerRouter {
  private state: FSMState = 'IDLE';
  private scratchRenderer: ScratchRenderer;
  private isPenTouching: boolean = false;
  private activePointerId: number | null = null;
  private lastDragWorld: { x: number; y: number } = { x: 0, y: 0 };
  public marqueeBox: MarqueeBox | null = null;
  public onMarqueeUpdate?: (box: MarqueeBox | null) => void;

  constructor(scratchRenderer: ScratchRenderer) {
    this.scratchRenderer = scratchRenderer;
  }

  handlePointerDown(e: PointerEvent, container: HTMLElement) {
    // Palm Rejection: If stylus pen is active, drop any finger touch events
    if (this.isPenTouching && e.pointerType === 'touch') {
      return;
    }

    if (e.pointerType === 'pen') {
      this.isPenTouching = true;
    }

    container.setPointerCapture(e.pointerId);
    this.activePointerId = e.pointerId;

    const camera = useCameraStore.getState().camera;
    const width = useCameraStore.getState().viewportWidth;
    const height = useCameraStore.getState().viewportHeight;
    const worldPoint = screenToWorld(e.clientX, e.clientY, camera, width, height);

    // Hardware Stylus Eraser recognition (buttons === 32 or eraser button)
    const isHardwareEraser = e.pointerType === 'pen' && (e.buttons === 32 || e.button === 5);
    const activeTool: ToolType = isHardwareEraser ? 'eraser' : useToolStore.getState().currentTool;

    // Spacebar held or Middle Click = Pan
    if (e.buttons === 4 || (e.shiftKey && e.buttons === 1)) {
      this.state = 'PANNING';
      this.lastDragWorld = { x: e.clientX, y: e.clientY };
      return;
    }

    if (activeTool === 'pen') {
      this.state = 'DRAWING';
      const pressure = e.pointerType === 'pen' ? e.pressure : 0.5;
      const color = useToolStore.getState().color;
      const size = useToolStore.getState().strokeSize;
      this.scratchRenderer.startStroke({ ...worldPoint, pressure }, color, size);
      this.scratchRenderer.render(camera, width, height);
    } else if (activeTool === 'eraser') {
      this.state = 'ERASING';
      this.performEraseAt(worldPoint);
    } else if (activeTool === 'select') {
      const doc = useDocumentStore.getState();
      const hitId = hitTestPoint(doc.elements, doc.elementIds, worldPoint);

      if (hitId) {
        if (!doc.selectedIds.includes(hitId)) {
          doc.setSelected(e.shiftKey ? [...doc.selectedIds, hitId] : [hitId]);
        }
        this.state = 'DRAGGING_SELECTION';
        this.lastDragWorld = worldPoint;
      } else {
        if (!e.shiftKey) {
          doc.setSelected([]);
        }
        this.state = 'SELECTING_MARQUEE';
        this.marqueeBox = {
          startX: worldPoint.x,
          startY: worldPoint.y,
          currentX: worldPoint.x,
          currentY: worldPoint.y,
        };
        this.onMarqueeUpdate?.(this.marqueeBox);
      }
    }
  }

  handlePointerMove(e: PointerEvent) {
    if (this.activePointerId !== e.pointerId) return;

    const camera = useCameraStore.getState().camera;
    const width = useCameraStore.getState().viewportWidth;
    const height = useCameraStore.getState().viewportHeight;

    if (this.state === 'PANNING') {
      const dx = e.clientX - this.lastDragWorld.x;
      const dy = e.clientY - this.lastDragWorld.y;
      useCameraStore.getState().panBy(-dx, -dy);
      this.lastDragWorld = { x: e.clientX, y: e.clientY };
      return;
    }

    // Coalesced events for high-rate inking
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];

    for (const ev of events) {
      const worldPoint = screenToWorld(ev.clientX, ev.clientY, camera, width, height);

      if (this.state === 'DRAWING') {
        const pressure = ev.pointerType === 'pen' ? ev.pressure : 0.5;
        this.scratchRenderer.addPoint({ ...worldPoint, pressure });
      } else if (this.state === 'ERASING') {
        this.performEraseAt(worldPoint);
      } else if (this.state === 'DRAGGING_SELECTION') {
        const dx = worldPoint.x - this.lastDragWorld.x;
        const dy = worldPoint.y - this.lastDragWorld.y;
        useDocumentStore.getState().moveSelected(dx, dy);
        this.lastDragWorld = worldPoint;
      } else if (this.state === 'SELECTING_MARQUEE' && this.marqueeBox) {
        this.marqueeBox.currentX = worldPoint.x;
        this.marqueeBox.currentY = worldPoint.y;
        this.onMarqueeUpdate?.({ ...this.marqueeBox });

        const doc = useDocumentStore.getState();
        const hitIds = hitTestMarquee(doc.elements, doc.elementIds, {
          minX: this.marqueeBox.startX,
          minY: this.marqueeBox.startY,
          maxX: this.marqueeBox.currentX,
          maxY: this.marqueeBox.currentY,
        });
        doc.setSelected(hitIds);
      }
    }

    if (this.state === 'DRAWING') {
      this.scratchRenderer.render(camera, width, height);
    }
  }

  handlePointerUp(e: PointerEvent, container: HTMLElement) {
    if (this.activePointerId !== e.pointerId) return;

    if (e.pointerType === 'pen') {
      this.isPenTouching = false;
    }

    container.releasePointerCapture(e.pointerId);
    this.activePointerId = null;

    const width = useCameraStore.getState().viewportWidth;
    const height = useCameraStore.getState().viewportHeight;

    if (this.state === 'DRAWING') {
      const points = this.scratchRenderer.finishStroke();
      this.scratchRenderer.clear(width, height);

      if (points.length >= 2) {
        const color = useToolStore.getState().color;
        const size = useToolStore.getState().strokeSize;
        const zIndex = useDocumentStore.getState().elementIds.length + 1;
        const element = createStrokeElement(points, color, size, zIndex);
        useDocumentStore.getState().addElement(element);
      }
    } else if (this.state === 'SELECTING_MARQUEE') {
      this.marqueeBox = null;
      this.onMarqueeUpdate?.(null);
    }

    this.state = 'IDLE';
  }

  private performEraseAt(worldPoint: { x: number; y: number }) {
    const doc = useDocumentStore.getState();
    const hitId = hitTestPoint(doc.elements, doc.elementIds, worldPoint, 12);
    if (hitId) {
      doc.setSelected([hitId]);
      doc.deleteSelected();
    }
  }
}
