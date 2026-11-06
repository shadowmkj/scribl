export type FSMState =
  | 'IDLE'
  | 'DRAWING'
  | 'DRAWING_SHAPE'
  | 'ERASING'
  | 'SELECTING_MARQUEE'
  | 'DRAGGING_SELECTION'
  | 'RESIZING_SELECTION'
  | 'ROTATING_SELECTION'
  | 'PANNING'
  | 'ZOOMING_SCRUB'
  | 'ZOOMING_SELECTION';

export interface MarqueeBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  type?: 'selection' | 'zoom';
}
