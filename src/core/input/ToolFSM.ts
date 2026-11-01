export type FSMState =
  | 'IDLE'
  | 'DRAWING'
  | 'ERASING'
  | 'SELECTING_MARQUEE'
  | 'DRAGGING_SELECTION'
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
