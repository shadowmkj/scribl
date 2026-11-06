import { useCameraStore } from '../../stores/useCameraStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { Camera, CanvasElement, ToolType } from '../../types/canvas';
import {
  calculateBoxFitCamera,
  calculateScrubbyZoom,
  screenToWorld,
  worldToScreen,
} from '../camera/cameraMath';
import { getFontFamilyId } from '../engine/fontConstants';
import { hitTestMarquee, hitTestPoint } from '../engine/HitTester';
import { createStrokeElement } from '../engine/InkingEngine';
import { ScratchRenderer } from '../engine/ScratchRenderer';
import { commitEditingText } from '../engine/textCommit';
import {
  computeSelectionBounds,
  HandleType,
  hitTestHandles,
  rotateElement,
  scaleElement,
} from '../geometry/transformMath';
import { FSMState, MarqueeBox } from './ToolFSM';

export class PointerRouter {
  private state: FSMState = 'IDLE';
  private scratchRenderer: ScratchRenderer;
  private isPenTouching: boolean = false;
  private activePointerId: number | null = null;
  private lastDragWorld: { x: number; y: number; } = { x: 0, y: 0 };
  private dragTotalDelta: { x: number; y: number; } = { x: 0, y: 0 };
  private zoomStartScreen: { x: number; y: number; } = { x: 0, y: 0 };
  private zoomInitialCamera: Camera = { x: 0, y: 0, zoom: 1 };
  private zoomHasDragged: boolean = false;
  public marqueeBox: MarqueeBox | null = null;
  public onMarqueeUpdate?: (box: MarqueeBox | null) => void;
  public isRotateKeyHeld: boolean = false;
  public rotationAngle: number | null = null;
  public onRotationUpdate?: (angle: number | null) => void;

  private transformInitialElements: Record<string, CanvasElement> = {};
  private activeHandle: HandleType | null = null;
  private resizeAnchor: { x: number; y: number; } = { x: 0, y: 0 };
  private resizeStartDist: { dx: number; dy: number; } = { dx: 1, dy: 1 };
  private resizeCenter: { x: number; y: number; } = { x: 0, y: 0 };
  private rotationCenter: { x: number; y: number; } = { x: 0, y: 0 };
  private rotationStartAngle: number = 0;

  constructor(scratchRenderer: ScratchRenderer) {
    this.scratchRenderer = scratchRenderer;
  }

  public getState(): FSMState {
    return this.state;
  }

  public getActiveHandle(): HandleType | null {
    return this.activeHandle;
  }

  handlePointerDown(e: PointerEvent, container: HTMLElement) {
    if (useToolStore.getState().editingText) {
      commitEditingText();
      return;
    }

    // Palm Rejection: If stylus pen is active, drop any finger touch events
    if (this.isPenTouching && e.pointerType === 'touch') {
      return;
    }

    if (e.pointerType === 'pen') {
      this.isPenTouching = true;
    }

    const camera = useCameraStore.getState().camera;
    const width = useCameraStore.getState().viewportWidth;
    const height = useCameraStore.getState().viewportHeight;
    const worldPoint = screenToWorld(e.clientX, e.clientY, camera, width, height);

    // Hardware Stylus Eraser recognition (buttons === 32 or eraser button)
    const isHardwareEraser = e.pointerType === 'pen' && (e.buttons === 32 || e.button === 5);
    const activeTool: ToolType = isHardwareEraser ? 'eraser' : useToolStore.getState().currentTool;

    const isSpacePressed = useCameraStore.getState().isSpacePressed;
    // Spacebar held, Middle Click, or Shift+LeftClick = Pan
    if (isSpacePressed || e.buttons === 4 || (e.shiftKey && e.buttons === 1)) {
      container.setPointerCapture(e.pointerId);
      this.activePointerId = e.pointerId;
      this.state = 'PANNING';
      useCameraStore.getState().setIsPanning(true);
      this.lastDragWorld = { x: e.clientX, y: e.clientY };
      return;
    }

    if (activeTool === 'text') {
      const toolStore = useToolStore.getState();
      const doc = useDocumentStore.getState();
      doc.setSelected([]);
      toolStore.startEditingText({
        x: worldPoint.x,
        y: worldPoint.y,
        text: '',
        fontSize: toolStore.fontSize || 24,
        fontFamily: toolStore.fontFamily || 'handwritten',
        color: toolStore.color,
      });
      return;
    }

    container.setPointerCapture(e.pointerId);
    this.activePointerId = e.pointerId;

    if (activeTool === 'pen') {
      this.state = 'DRAWING';
      const pressure = e.pointerType === 'pen' ? e.pressure : 0.5;
      const color = useToolStore.getState().color;
      const size = useToolStore.getState().strokeSize;
      this.scratchRenderer.startStroke({ ...worldPoint, pressure }, color, size);
      this.scratchRenderer.render(camera, width, height);
    } else if (activeTool === 'eraser') {
      this.state = 'ERASING';
      this.scratchRenderer.startEraserTrail(worldPoint);
      this.performEraseAt(worldPoint);
    } else if (activeTool === 'select') {
      const doc = useDocumentStore.getState();

      // 1. If elements are selected, check for Corner Handle Hit or Rotation Trigger
      if (doc.selectedIds.length > 0) {
        const bounds = computeSelectionBounds(doc.elements, doc.selectedIds);
        if (bounds) {
          const screenHandles = {
            nw: worldToScreen(bounds.minX, bounds.minY, camera, width, height),
            ne: worldToScreen(bounds.maxX, bounds.minY, camera, width, height),
            se: worldToScreen(bounds.maxX, bounds.maxY, camera, width, height),
            sw: worldToScreen(bounds.minX, bounds.maxY, camera, width, height),
          };

          const hitHandle = hitTestHandles({ x: e.clientX, y: e.clientY }, screenHandles, 12);
          if (hitHandle) {
            this.state = 'RESIZING_SELECTION';
            this.activeHandle = hitHandle;

            // Snapshot selected elements
            this.transformInitialElements = {};
            for (const id of doc.selectedIds) {
              if (doc.elements[id]) {
                this.transformInitialElements[id] = { ...doc.elements[id] };
              }
            }

            // Determine opposite corner anchor
            let anchor = { x: bounds.centerX, y: bounds.centerY };
            if (hitHandle === 'nw') anchor = { x: bounds.maxX, y: bounds.maxY };
            else if (hitHandle === 'ne') anchor = { x: bounds.minX, y: bounds.maxY };
            else if (hitHandle === 'se') anchor = { x: bounds.minX, y: bounds.minY };
            else if (hitHandle === 'sw') anchor = { x: bounds.maxX, y: bounds.minY };

            this.resizeAnchor = anchor;
            this.resizeCenter = { x: bounds.centerX, y: bounds.centerY };
            this.resizeStartDist = {
              dx: worldPoint.x - anchor.x,
              dy: worldPoint.y - anchor.y,
            };
            return;
          }

          if (this.isRotateKeyHeld) {
            this.state = 'ROTATING_SELECTION';
            this.transformInitialElements = {};
            for (const id of doc.selectedIds) {
              if (doc.elements[id]) {
                this.transformInitialElements[id] = { ...doc.elements[id] };
              }
            }
            this.rotationCenter = { x: bounds.centerX, y: bounds.centerY };
            this.rotationStartAngle = Math.atan2(
              worldPoint.y - bounds.centerY,
              worldPoint.x - bounds.centerX,
            );
            this.rotationAngle = 0;
            this.onRotationUpdate?.(0);
            return;
          }

          // Check if clicked inside selection bounds for dragging
          if (
            worldPoint.x >= bounds.minX
            && worldPoint.x <= bounds.maxX
            && worldPoint.y >= bounds.minY
            && worldPoint.y <= bounds.maxY
          ) {
            this.state = 'DRAGGING_SELECTION';
            this.lastDragWorld = worldPoint;
            this.dragTotalDelta = { x: 0, y: 0 };
            return;
          }
        }
      }

      // 2. Element hit test
      const hitId = hitTestPoint(doc.elements, doc.elementIds, worldPoint);

      if (hitId) {
        if (!doc.selectedIds.includes(hitId)) {
          doc.setSelected(e.shiftKey ? [...doc.selectedIds, hitId] : [hitId]);
        } else {
          const el = doc.elements[hitId];
          if (el && el.type === 'text') {
            const toolStore = useToolStore.getState();
            toolStore.setColor(el.color);
            toolStore.setFontSize(el.fontSize);
            toolStore.setFontFamily(getFontFamilyId(el.fontFamily));
          } else if (el && el.type === 'stroke') {
            const toolStore = useToolStore.getState();
            toolStore.setColor(el.color);
            toolStore.setStrokeSize(el.size);
          }
        }
        this.state = 'DRAGGING_SELECTION';
        this.lastDragWorld = worldPoint;
        this.dragTotalDelta = { x: 0, y: 0 };
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
    } else if (activeTool === 'zoom') {
      const zoomMode = useToolStore.getState().zoomMode;
      const effectiveMode = e.shiftKey
        ? (zoomMode === 'scrubby' ? 'selection' : 'scrubby')
        : zoomMode;

      this.zoomStartScreen = { x: e.clientX, y: e.clientY };
      this.zoomInitialCamera = { ...camera };
      this.zoomHasDragged = false;

      if (effectiveMode === 'scrubby') {
        this.state = 'ZOOMING_SCRUB';
      } else {
        this.state = 'ZOOMING_SELECTION';
        this.marqueeBox = {
          startX: worldPoint.x,
          startY: worldPoint.y,
          currentX: worldPoint.x,
          currentY: worldPoint.y,
          type: 'zoom',
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

    if (this.state === 'ZOOMING_SCRUB') {
      const dist = Math.hypot(
        e.clientX - this.zoomStartScreen.x,
        e.clientY - this.zoomStartScreen.y,
      );
      if (dist > 3) {
        this.zoomHasDragged = true;
      }
      const updatedCamera = calculateScrubbyZoom(
        this.zoomStartScreen.x,
        this.zoomStartScreen.y,
        e.clientX,
        this.zoomInitialCamera,
        width,
        height,
      );
      useCameraStore.setState({ camera: updatedCamera });
      return;
    }

    if (this.state === 'ZOOMING_SELECTION' && this.marqueeBox) {
      const dist = Math.hypot(
        e.clientX - this.zoomStartScreen.x,
        e.clientY - this.zoomStartScreen.y,
      );
      if (dist > 3) {
        this.zoomHasDragged = true;
      }
      const worldPoint = screenToWorld(e.clientX, e.clientY, camera, width, height);
      this.marqueeBox.currentX = worldPoint.x;
      this.marqueeBox.currentY = worldPoint.y;
      this.onMarqueeUpdate?.({ ...this.marqueeBox });
      return;
    }

    // Coalesced events for high-rate inking
    const coalesced = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    const events = coalesced.length > 0 ? coalesced : [e];

    for (const ev of events) {
      const worldPoint = screenToWorld(ev.clientX, ev.clientY, camera, width, height);

      if (this.state === 'DRAWING') {
        const pressure = ev.pointerType === 'pen' ? ev.pressure : 0.5;
        this.scratchRenderer.addPoint({ ...worldPoint, pressure });
      } else if (this.state === 'ERASING') {
        this.scratchRenderer.addEraserTrailPoint(worldPoint);
        this.performEraseAt(worldPoint);
      } else if (this.state === 'DRAGGING_SELECTION') {
        const dx = worldPoint.x - this.lastDragWorld.x;
        const dy = worldPoint.y - this.lastDragWorld.y;
        this.dragTotalDelta.x += dx;
        this.dragTotalDelta.y += dy;
        useDocumentStore.getState().translateSelected(dx, dy);
        this.lastDragWorld = worldPoint;
      } else if (this.state === 'RESIZING_SELECTION') {
        const anchor = ev.altKey ? this.resizeCenter : this.resizeAnchor;
        const dx = worldPoint.x - anchor.x;
        const dy = worldPoint.y - anchor.y;
        const startDx = this.resizeStartDist.dx;
        const startDy = this.resizeStartDist.dy;

        let sx = startDx !== 0 ? dx / startDx : 1;
        let sy = startDy !== 0 ? dy / startDy : 1;

        // Proportional constraint (default, unless Shift is held)
        if (!ev.shiftKey) {
          const signX = sx < 0 ? -1 : 1;
          const signY = sy < 0 ? -1 : 1;
          const mag = Math.max(Math.abs(sx), Math.abs(sy));
          sx = mag * signX;
          sy = mag * signY;
        }

        const updated: Record<string, CanvasElement> = {};
        for (const [id, initialEl] of Object.entries(this.transformInitialElements)) {
          updated[id] = scaleElement(initialEl, anchor, sx, sy);
        }
        useDocumentStore.getState().transformSelectedLive(updated);
      } else if (this.state === 'ROTATING_SELECTION') {
        const currentAngle = Math.atan2(
          worldPoint.y - this.rotationCenter.y,
          worldPoint.x - this.rotationCenter.x,
        );
        let deltaAngle = currentAngle - this.rotationStartAngle;

        // Snap to 15 degrees if Shift is held
        if (ev.shiftKey) {
          const snapRad = (15 * Math.PI) / 180;
          deltaAngle = Math.round(deltaAngle / snapRad) * snapRad;
        }

        this.rotationAngle = deltaAngle;
        this.onRotationUpdate?.(deltaAngle);

        const updated: Record<string, CanvasElement> = {};
        for (const [id, initialEl] of Object.entries(this.transformInitialElements)) {
          updated[id] = rotateElement(initialEl, this.rotationCenter, deltaAngle);
        }
        useDocumentStore.getState().transformSelectedLive(updated);
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

    if (this.state === 'PANNING') {
      useCameraStore.getState().setIsPanning(false);
    } else if (this.state === 'DRAWING') {
      const points = this.scratchRenderer.finishStroke();
      this.scratchRenderer.clear(width, height);

      if (points.length >= 2) {
        const color = useToolStore.getState().color;
        const size = useToolStore.getState().strokeSize;
        const zIndex = useDocumentStore.getState().elementIds.length + 1;
        const element = createStrokeElement(points, color, size, zIndex);
        useDocumentStore.getState().addElement(element);
      }
    } else if (this.state === 'DRAGGING_SELECTION') {
      if (this.dragTotalDelta.x !== 0 || this.dragTotalDelta.y !== 0) {
        useDocumentStore.getState().commitMoveSelected(
          this.dragTotalDelta.x,
          this.dragTotalDelta.y,
        );
      }
      this.dragTotalDelta = { x: 0, y: 0 };
    } else if (this.state === 'RESIZING_SELECTION' || this.state === 'ROTATING_SELECTION') {
      const current = useDocumentStore.getState().elements;
      useDocumentStore.getState().commitTransformSelected(
        this.transformInitialElements,
        current,
      );
      this.transformInitialElements = {};
      this.rotationAngle = null;
      this.onRotationUpdate?.(null);
      this.activeHandle = null;

      const doc = useDocumentStore.getState();
      if (doc.selectedIds.length === 1) {
        const el = doc.elements[doc.selectedIds[0]];
        if (el && el.type === 'text') {
          useToolStore.getState().setFontSize(el.fontSize);
        }
      }
    } else if (this.state === 'ERASING') {
      this.scratchRenderer.stopEraserTrail();
    } else if (this.state === 'SELECTING_MARQUEE') {
      this.marqueeBox = null;
      this.onMarqueeUpdate?.(null);
    } else if (this.state === 'ZOOMING_SCRUB') {
      if (!this.zoomHasDragged) {
        const factor = e.altKey ? 1 / 1.25 : 1.25;
        useCameraStore.getState().zoomAt(
          this.zoomStartScreen.x,
          this.zoomStartScreen.y,
          this.zoomInitialCamera.zoom * factor,
        );
      }
    } else if (this.state === 'ZOOMING_SELECTION') {
      if (this.marqueeBox) {
        const screenStart = worldToScreen(
          this.marqueeBox.startX,
          this.marqueeBox.startY,
          useCameraStore.getState().camera,
          width,
          height,
        );
        const dist = Math.hypot(e.clientX - screenStart.x, e.clientY - screenStart.y);

        if (dist > 10) {
          const minX = Math.min(this.marqueeBox.startX, this.marqueeBox.currentX);
          const minY = Math.min(this.marqueeBox.startY, this.marqueeBox.currentY);
          const maxX = Math.max(this.marqueeBox.startX, this.marqueeBox.currentX);
          const maxY = Math.max(this.marqueeBox.startY, this.marqueeBox.currentY);

          const fitCam = calculateBoxFitCamera(
            { minX, minY, maxX, maxY },
            width,
            height,
            0.9,
          );
          useCameraStore.setState({ camera: fitCam });
        } else {
          const factor = e.altKey ? 1 / 1.25 : 1.25;
          useCameraStore.getState().zoomAt(
            this.zoomStartScreen.x,
            this.zoomStartScreen.y,
            useCameraStore.getState().camera.zoom * factor,
          );
        }

        this.marqueeBox = null;
        this.onMarqueeUpdate?.(null);
      }
    }

    this.state = 'IDLE';
  }

  handleDoubleClick(e: MouseEvent) {
    if (useToolStore.getState().editingText) {
      commitEditingText();
    }

    const activeTool = useToolStore.getState().currentTool;
    if (activeTool !== 'select') return;

    const camera = useCameraStore.getState().camera;
    const width = useCameraStore.getState().viewportWidth;
    const height = useCameraStore.getState().viewportHeight;
    const worldPoint = screenToWorld(e.clientX, e.clientY, camera, width, height);

    const doc = useDocumentStore.getState();
    const hitId = hitTestPoint(doc.elements, doc.elementIds, worldPoint);
    if (!hitId) return;

    const el = doc.elements[hitId];
    if (el && el.type === 'text') {
      doc.setSelected([]);
      const fontId = getFontFamilyId(el.fontFamily);
      useToolStore.getState().setFontFamily(fontId);
      useToolStore.getState().startEditingText({
        elementId: el.id,
        x: el.x,
        y: el.y,
        text: el.text,
        fontSize: el.fontSize,
        fontFamily: fontId,
        color: el.color,
      });
    }
  }

  private performEraseAt(worldPoint: { x: number; y: number; }) {
    const doc = useDocumentStore.getState();
    const hitId = hitTestPoint(doc.elements, doc.elementIds, worldPoint, 12);
    if (hitId) {
      doc.setSelected([hitId]);
      doc.deleteSelected();
    }
  }
}
