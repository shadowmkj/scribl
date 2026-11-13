import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCameraStore } from '../../stores/useCameraStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { ShapeElement, StrokeElement } from '../../types/canvas';
import { ScratchRenderer } from '../engine/ScratchRenderer';
import { PointerRouter } from './PointerRouter';

describe('PointerRouter - Zoom Tool', () => {
  let router: PointerRouter;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.setPointerCapture = vi.fn();
    container.releasePointerCapture = vi.fn();

    const scratch = new ScratchRenderer();
    router = new PointerRouter(scratch);

    useCameraStore.setState({
      camera: { x: 0, y: 0, zoom: 1.0 },
      viewportWidth: 1000,
      viewportHeight: 800,
      isSpacePressed: false,
      isPanning: false,
    });

    useToolStore.setState({
      currentTool: 'zoom',
      zoomMode: 'scrubby',
      editingText: null,
    });
  });

  it('performs scrubby zoom on pointer drag', () => {
    // Pointer down at center (500, 400)
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 500,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    // Drag right by 120px to (620, 400)
    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 620,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
    );

    // Dragging right by 120px should double the zoom (~2.0)
    expect(useCameraStore.getState().camera.zoom).toBeCloseTo(2.0, 1);

    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 620,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
      }),
      container,
    );

    // Zoom should remain after pointer up
    expect(useCameraStore.getState().camera.zoom).toBeCloseTo(2.0, 1);
  });

  it('performs single click zoom in when clicking without dragging in scrubby mode', () => {
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 500,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    // Pointer up with minimal/no movement
    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 501,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
      }),
      container,
    );

    // Single click should zoom in by 1.25x
    expect(useCameraStore.getState().camera.zoom).toBeCloseTo(1.25, 2);
  });

  it('performs single click zoom out when Alt key is held in scrubby mode', () => {
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 500,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
        altKey: true,
      }),
      container,
    );

    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 500,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
        altKey: true,
      }),
      container,
    );

    // Single click with Alt should zoom out (1 / 1.25 = 0.8)
    expect(useCameraStore.getState().camera.zoom).toBeCloseTo(0.8, 2);
  });

  it('performs selection zoom framing when dragging a marquee box in selection mode', () => {
    useToolStore.setState({ zoomMode: 'selection' });

    let updatedMarquee: any = null;
    router.onMarqueeUpdate = (box) => {
      updatedMarquee = box;
    };

    // Center screen is (500, 400) which corresponds to world (0, 0)
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 400,
        clientY: 300,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    expect(updatedMarquee).not.toBeNull();
    expect(updatedMarquee?.type).toBe('zoom');

    // Drag marquee to (600, 500)
    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 600,
        clientY: 500,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
    );

    expect(updatedMarquee?.currentX).toBeDefined();

    // Release pointer to frame box
    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 600,
        clientY: 500,
        pointerId: 1,
        pointerType: 'mouse',
      }),
      container,
    );

    // Marquee should be cleared
    expect(router.marqueeBox).toBeNull();
    // Camera should have zoomed in to frame the selection
    expect(useCameraStore.getState().camera.zoom).toBeGreaterThan(1.0);
  });

  it('moves selected elements on drag and creates a single undo step on pointer up', async () => {
    const { useDocumentStore } = await import('../../stores/useDocumentStore');
    const docStore = useDocumentStore.getState();
    docStore.clearDocument();

    const testStroke = {
      id: 'drag-stroke-1',
      type: 'stroke' as const,
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      zIndex: 1,
      color: '#000',
      size: 4,
      thinning: 0.6,
      smoothing: 0.5,
      points: [
        { x: 0, y: 0, pressure: 0.5 },
        { x: 50, y: 50, pressure: 0.5 },
      ],
    };

    docStore.addElement(testStroke);
    docStore.setSelected(['drag-stroke-1']);

    useToolStore.setState({ currentTool: 'select' });

    // Pointer down at (525, 425), which corresponds to world (25, 25) - directly on the stroke
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 525,
        clientY: 425,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    // Multiple drag moves (simulating 60Hz/240Hz pointer events)
    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 545,
        clientY: 435,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
    );

    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 565,
        clientY: 450,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
    );

    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 585,
        clientY: 465,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
    );

    // Pointer up at final position (+60 in x, +40 in y)
    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 585,
        clientY: 465,
        pointerId: 1,
        pointerType: 'mouse',
      }),
      container,
    );

    const moved = useDocumentStore.getState();
    expect(moved.elements['drag-stroke-1'].x).toBe(60);
    expect(moved.elements['drag-stroke-1'].y).toBe(40);

    // ONE undo must snap the element completely back to place A (0, 0)
    moved.undo();
    const undone = useDocumentStore.getState();
    expect(undone.elements['drag-stroke-1'].x).toBe(0);
    expect(undone.elements['drag-stroke-1'].y).toBe(0);

    // ONE redo must snap the element back to place B (60, 40)
    undone.redo();
    const redone = useDocumentStore.getState();
    expect(redone.elements['drag-stroke-1'].x).toBe(60);
    expect(redone.elements['drag-stroke-1'].y).toBe(40);
  });

  it('scales selection proportionally on SE corner handle drag with single undo step', async () => {
    const { useDocumentStore } = await import('../../stores/useDocumentStore');
    const docStore = useDocumentStore.getState();
    docStore.clearDocument();

    const testStroke = {
      id: 'scale-stroke-1',
      type: 'stroke' as const,
      x: 0,
      y: 0,
      width: 40,
      height: 40,
      zIndex: 1,
      color: '#000',
      size: 4,
      thinning: 0.6,
      smoothing: 0.5,
      points: [
        { x: 0, y: 0, pressure: 0.5 },
        { x: 40, y: 40, pressure: 0.5 },
      ],
    };

    docStore.addElement(testStroke);
    docStore.setSelected(['scale-stroke-1']);

    useToolStore.setState({ currentTool: 'select' });

    // Center screen is (500, 400), which corresponds to world (0, 0).
    // The SE corner of stroke [0..40, 0..40] is at world (40, 40), which maps to screen (540, 440).
    // Pointer down on SE handle at (540, 440)
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 540,
        clientY: 440,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    // Drag SE corner to screen (580, 480) -> world (80, 80), scaling by 2.0x
    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 580,
        clientY: 480,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
    );

    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 580,
        clientY: 480,
        pointerId: 1,
        pointerType: 'mouse',
      }),
      container,
    );

    const scaled = useDocumentStore.getState();
    expect(scaled.elements['scale-stroke-1'].width).toBe(80);
    expect(scaled.elements['scale-stroke-1'].height).toBe(80);
    expect((scaled.elements['scale-stroke-1'] as StrokeElement).size).toBe(8); // Scaled proportionally

    // Exactly 1 undo restores original dimensions
    scaled.undo();
    const undone = useDocumentStore.getState();
    expect(undone.elements['scale-stroke-1'].width).toBe(40);
    expect(undone.elements['scale-stroke-1'].height).toBe(40);
    expect((undone.elements['scale-stroke-1'] as StrokeElement).size).toBe(4);
  });

  it('rotates selection around center when r is held with single undo step', async () => {
    const { useDocumentStore } = await import('../../stores/useDocumentStore');
    const docStore = useDocumentStore.getState();
    docStore.clearDocument();

    const testStroke = {
      id: 'rotate-stroke-1',
      type: 'stroke' as const,
      x: 10,
      y: 10,
      width: 20,
      height: 20,
      zIndex: 1,
      color: '#000',
      size: 4,
      thinning: 0.6,
      smoothing: 0.5,
      points: [
        { x: 10, y: 20, pressure: 0.5 },
        { x: 30, y: 20, pressure: 0.5 },
      ],
    };

    docStore.addElement(testStroke);
    docStore.setSelected(['rotate-stroke-1']);

    useToolStore.setState({ currentTool: 'select' });

    // Enable rotation mode via r key
    router.isRotateKeyHeld = true;

    // Center of stroke [10..30, 10..30] is world (20, 20), screen (520, 420).
    // Pointer down at world (40, 20) -> screen (540, 420), which is angle 0 relative to center
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 540,
        clientY: 420,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    // Drag to world (20, 40) -> screen (520, 440), rotating by +90 degrees (Math.PI / 2)
    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 520,
        clientY: 440,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
    );

    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 520,
        clientY: 440,
        pointerId: 1,
        pointerType: 'mouse',
      }),
      container,
    );

    const rotated = useDocumentStore.getState();
    // After 90 deg rotation, horizontal line (10, 20)->(30, 20) becomes vertical line
    expect((rotated.elements['rotate-stroke-1'] as StrokeElement).points[0].x).toBeCloseTo(20, 1);
    expect((rotated.elements['rotate-stroke-1'] as StrokeElement).points[1].x).toBeCloseTo(20, 1);

    // Exactly 1 undo restores original horizontal line
    rotated.undo();
    const undone = useDocumentStore.getState();
    expect((undone.elements['rotate-stroke-1'] as StrokeElement).points[0].y).toBeCloseTo(20, 1);
    expect((undone.elements['rotate-stroke-1'] as StrokeElement).points[1].y).toBeCloseTo(20, 1);
  });

  it('triggers startEditingText when pointer down occurs with active text tool', () => {
    useToolStore.setState({
      currentTool: 'text',
      color: '#e11d48',
      fontSize: 36,
      editingText: null,
    });

    // Click at screen (500, 400) -> world (0, 0) since camera is at (0, 0)
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 500,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    const editing = useToolStore.getState().editingText;
    expect(editing).toBeTruthy();
    expect(editing?.x).toBe(0);
    expect(editing?.y).toBe(0);
    expect(editing?.fontSize).toBe(36);
    expect(editing?.color).toBe('#e11d48');
    expect(editing?.text).toBe('');
  });

  it('triggers startEditingText when double-clicking a text element in select mode', () => {
    const textEl = {
      id: 'text-1',
      type: 'text' as const,
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      zIndex: 1,
      text: 'Existing Note',
      fontSize: 24,
      fontFamily: 'system-ui, sans-serif',
      color: '#ffffff',
      lineHeight: 1.25,
    };

    useDocumentStore.setState({
      elements: { 'text-1': textEl },
      elementIds: ['text-1'],
      selectedIds: ['text-1'],
    });

    useToolStore.setState({
      currentTool: 'select',
      editingText: null,
    });

    // Double-click at screen (520, 420) -> world (20, 20) which is inside text-1 [0, 0, 100, 40]
    router.handleDoubleClick(
      new MouseEvent('dblclick', {
        clientX: 520,
        clientY: 420,
        button: 0,
      }),
    );

    const editing = useToolStore.getState().editingText;
    expect(editing).toBeTruthy();
    expect(editing?.elementId).toBe('text-1');
    expect(editing?.text).toBe('Existing Note');
    expect(editing?.fontSize).toBe(24);
    expect(useDocumentStore.getState().selectedIds).toEqual([]);
  });

  it('triggers startEditingText for existing element when clicked with active text tool', () => {
    const textEl = {
      id: 'text-2',
      type: 'text' as const,
      x: 50,
      y: 50,
      width: 100,
      height: 40,
      zIndex: 1,
      text: 'Click to Edit Note',
      fontSize: 20,
      fontFamily: 'normal',
      color: '#0284c7',
      lineHeight: 1.25,
    };

    useDocumentStore.setState({
      elements: { 'text-2': textEl },
      elementIds: ['text-2'],
      selectedIds: [],
    });

    useToolStore.setState({
      currentTool: 'text',
      editingText: null,
    });

    // Single click at screen (560, 460) -> world (60, 60), inside text-2
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 560,
        clientY: 460,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    const editing = useToolStore.getState().editingText;
    expect(editing).toBeTruthy();
    expect(editing?.elementId).toBe('text-2');
    expect(editing?.text).toBe('Click to Edit Note');
    expect(editing?.fontSize).toBe(20);
    expect(editing?.color).toBe('#0284c7');
  });
});

describe('PointerRouter - Shape Drawing', () => {
  let router: PointerRouter;
  let container: HTMLDivElement;
  let scratch: ScratchRenderer;

  beforeEach(() => {
    container = document.createElement('div');
    container.setPointerCapture = vi.fn();
    container.releasePointerCapture = vi.fn();

    scratch = new ScratchRenderer();
    router = new PointerRouter(scratch);

    useDocumentStore.getState().clearDocument();

    useCameraStore.setState({
      camera: { x: 0, y: 0, zoom: 1.0 },
      viewportWidth: 1000,
      viewportHeight: 800,
      isSpacePressed: false,
      isPanning: false,
    });

    useToolStore.setState({
      currentTool: 'rectangle',
      color: '#0284c7',
      fillColor: 'transparent',
      strokeSize: 4,
      strokeStyle: 'solid',
      editingText: null,
    });
  });

  it('draws a rectangle and commits to document store on pointer up', () => {
    // Screen (600, 500) at camera (0,0) with 1000x800 viewport -> world (100, 100)
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 600,
        clientY: 500,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    // Screen (750, 600) -> world (250, 200)
    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 750,
        clientY: 600,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
    );

    // Check preview during drag
    expect(scratch.getShapePreview()).toBeDefined();
    expect(scratch.getShapePreview()?.width).toBe(150);
    expect(scratch.getShapePreview()?.height).toBe(100);

    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 750,
        clientY: 600,
        pointerId: 1,
        pointerType: 'mouse',
      }),
      container,
    );

    const doc = useDocumentStore.getState();
    expect(doc.elementIds.length).toBe(1);
    const element = doc.elements[doc.elementIds[0]] as ShapeElement;
    expect(element.type).toBe('shape');
    expect(element.shapeType).toBe('rectangle');
    expect(element.x).toBe(100);
    expect(element.y).toBe(100);
    expect(element.width).toBe(150);
    expect(element.height).toBe(100);
    expect(element.strokeColor).toBe('#0284c7');
    expect(element.strokeWidth).toBe(4);
    expect(element.strokeStyle).toBe('solid');

    // Scratch preview should be cleared on pointer up
    expect(scratch.getShapePreview()).toBeNull();

    // Shape should be selected and tool transitioned to select (visual mode)
    expect(doc.selectedIds).toEqual([element.id]);
    expect(useToolStore.getState().currentTool).toBe('select');
  });

  it('constrains rectangle to square when Shift is held', () => {
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 600,
        clientY: 500,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
        shiftKey: true,
      }),
      container,
    );

    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 750,
        clientY: 580,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
        shiftKey: true,
      }),
    );

    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 750,
        clientY: 580,
        pointerId: 1,
        pointerType: 'mouse',
        shiftKey: true,
      }),
      container,
    );

    const element = useDocumentStore.getState()
      .elements[useDocumentStore.getState().elementIds[0]] as ShapeElement;
    expect(element.width).toBe(element.height);
    expect(element.width).toBe(150);
  });

  it('expands from center when Alt is held', () => {
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 600,
        clientY: 500,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
        altKey: true,
      }),
      container,
    );

    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 700,
        clientY: 550,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
        altKey: true,
      }),
    );

    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 700,
        clientY: 550,
        pointerId: 1,
        pointerType: 'mouse',
        altKey: true,
      }),
      container,
    );

    const element = useDocumentStore.getState()
      .elements[useDocumentStore.getState().elementIds[0]] as ShapeElement;
    // Start was world (100, 100). Cursor was world (200, 150), dx = 100, dy = 50.
    // Center is (100, 100), width = 200, height = 100, top-left x = 0, y = 50.
    expect(element.x).toBe(0);
    expect(element.y).toBe(50);
    expect(element.width).toBe(200);
    expect(element.height).toBe(100);
  });

  it('draws an arrow with startPoint and endPoint', () => {
    useToolStore.setState({ currentTool: 'arrow' });

    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 500,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 600,
        clientY: 500,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
    );

    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 600,
        clientY: 500,
        pointerId: 1,
        pointerType: 'mouse',
      }),
      container,
    );

    const doc = useDocumentStore.getState();
    expect(doc.elementIds.length).toBe(1);
    const element = doc.elements[doc.elementIds[0]] as ShapeElement;
    expect(element.shapeType).toBe('arrow');
    expect(element.startPoint).toEqual({ x: 0, y: 0 });
    expect(element.endPoint).toEqual({ x: 100, y: 100 });
  });

  it('snaps line angle to 15-degree increments when Shift is held', () => {
    useToolStore.setState({ currentTool: 'line' });

    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 500,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
        shiftKey: true,
      }),
      container,
    );

    // Vector is (100, 10) -> angle ~5.7 degrees (< 7.5 deg), should snap to 0 degrees (horizontal)
    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 600,
        clientY: 410,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
        shiftKey: true,
      }),
    );

    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 600,
        clientY: 410,
        pointerId: 1,
        pointerType: 'mouse',
        shiftKey: true,
      }),
      container,
    );

    const element = useDocumentStore.getState()
      .elements[useDocumentStore.getState().elementIds[0]] as ShapeElement;
    expect(element.endPoint?.y).toBeCloseTo(0, 1);
  });

  it('selects newly drawn shape and allows moving it immediately in visual mode', () => {
    // 1. Draw a rectangle
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 600,
        clientY: 500,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 700,
        clientY: 580,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
    );

    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 700,
        clientY: 580,
        pointerId: 1,
        pointerType: 'mouse',
      }),
      container,
    );

    const doc = useDocumentStore.getState();
    const shapeId = doc.elementIds[0];
    expect(doc.selectedIds).toEqual([shapeId]);
    expect(useToolStore.getState().currentTool).toBe('select');

    // 2. Immediately drag to move the shape
    // Pointer down on the shape at world (120, 120) -> screen (620, 520)
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 620,
        clientY: 520,
        pointerId: 2,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );
    expect(router.getState()).toBe('DRAGGING_SELECTION');

    // Drag by +40px X and +30px Y to screen (660, 550)
    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 660,
        clientY: 550,
        pointerId: 2,
        pointerType: 'mouse',
        buttons: 1,
      }),
    );

    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 660,
        clientY: 550,
        pointerId: 2,
        pointerType: 'mouse',
      }),
      container,
    );

    const movedElement = useDocumentStore.getState().elements[shapeId] as ShapeElement;
    expect(movedElement.x).toBe(140); // 100 + 40
    expect(movedElement.y).toBe(130); // 100 + 30
  });

  it('preserves user selected strokeSize when a stroke is resized and erased', () => {
    // 1. Initial stroke drawn with size 4 (Regular)
    const initialStroke: StrokeElement = {
      id: 'stroke-resize-erase',
      type: 'stroke',
      points: [
        { x: 100, y: 100, pressure: 0.5 },
        { x: 200, y: 200, pressure: 0.5 },
      ],
      color: '#0284c7',
      size: 4,
      thinning: 0.5,
      smoothing: 0.5,
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      zIndex: 1,
    };

    useDocumentStore.setState({
      elements: { [initialStroke.id]: initialStroke },
      elementIds: [initialStroke.id],
      selectedIds: [initialStroke.id],
    });
    useToolStore.setState({ currentTool: 'select', strokeSize: 4 });

    // 2. Stroke is resized / scaled (e.g. enlarged to size 18.5)
    const enlargedStroke: StrokeElement = {
      ...initialStroke,
      size: 18.5,
      width: 250,
      height: 250,
      points: [
        { x: 100, y: 100, pressure: 0.5 },
        { x: 350, y: 350, pressure: 0.5 },
      ],
    };
    useDocumentStore.setState({
      elements: { [enlargedStroke.id]: enlargedStroke },
    });

    // Selecting it again must not change strokeSize
    useDocumentStore.getState().setSelected([enlargedStroke.id]);
    expect(useToolStore.getState().strokeSize).toBe(4);

    // 3. User switches to eraser tool and erases the enlarged stroke
    useToolStore.setState({ currentTool: 'eraser' });

    // Erase point at world (150, 150) -> screen (650, 550)
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 650,
        clientY: 550,
        pointerId: 10,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    // Stroke should be erased (deleted)
    expect(useDocumentStore.getState().elements[enlargedStroke.id]).toBeUndefined();

    // 4. Taking pen again - strokeSize must remain 4, NOT 18.5!
    useToolStore.setState({ currentTool: 'pen' });
    expect(useToolStore.getState().strokeSize).toBe(4);
  });

  it('eraser tool ignores locked elements and deletes unlocked elements underneath', () => {
    const lockedRect: ShapeElement = {
      id: 'locked_box',
      type: 'shape',
      shapeType: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      zIndex: 2,
      strokeColor: '#000',
      fillColor: '#fff',
      strokeWidth: 2,
      strokeStyle: 'solid',
      locked: true,
    };

    const unlockedStroke: StrokeElement = {
      id: 'unlocked_line',
      type: 'stroke',
      x: 120,
      y: 120,
      width: 100,
      height: 100,
      zIndex: 1,
      color: '#ff0000',
      size: 4,
      thinning: 0.6,
      smoothing: 0.5,
      points: [
        { x: 120, y: 120, pressure: 0.5 },
        { x: 220, y: 220, pressure: 0.5 },
      ],
      locked: false,
    };

    useDocumentStore.setState({
      elements: {
        locked_box: lockedRect,
        unlocked_line: unlockedStroke,
      },
      elementIds: ['unlocked_line', 'locked_box'],
      selectedIds: [],
    });

    useToolStore.setState({ currentTool: 'eraser' });

    // Erase point at world (150, 150) -> screen (650, 550)
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 650,
        clientY: 550,
        pointerId: 11,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    const doc = useDocumentStore.getState();
    // locked_box must survive
    expect(doc.elements['locked_box']).toBeDefined();
    // unlocked_line must be erased
    expect(doc.elements['unlocked_line']).toBeUndefined();
  });

  it('select tool selects locked element on click but prevents dragging', () => {
    const lockedRect: ShapeElement = {
      id: 'locked_box',
      type: 'shape',
      shapeType: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      zIndex: 1,
      strokeColor: '#000',
      fillColor: '#fff',
      strokeWidth: 2,
      strokeStyle: 'solid',
      locked: true,
    };

    useDocumentStore.setState({
      elements: { locked_box: lockedRect },
      elementIds: ['locked_box'],
      selectedIds: [],
    });

    useToolStore.setState({ currentTool: 'select' });

    // Click at world (150, 150) -> screen (650, 550)
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 650,
        clientY: 550,
        pointerId: 12,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    // Locked element should be selected
    expect(useDocumentStore.getState().selectedIds).toEqual(['locked_box']);

    // Attempt to drag to screen (700, 600) -> world (200, 200)
    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 700,
        clientY: 600,
        pointerId: 12,
        pointerType: 'mouse',
        buttons: 1,
      }),
    );

    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 700,
        clientY: 600,
        pointerId: 12,
        pointerType: 'mouse',
      }),
      container,
    );

    // Locked element should NOT have moved
    expect(useDocumentStore.getState().elements['locked_box'].x).toBe(100);
    expect(useDocumentStore.getState().elements['locked_box'].y).toBe(100);
  });
});
