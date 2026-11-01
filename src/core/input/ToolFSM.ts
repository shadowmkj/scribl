export type FSMState =
  | 'IDLE'
  | 'DRAWING'
  | 'ERASING'
  | 'SELECTING_MARQUEE'
  | 'DRAGGING_SELECTION'
  | 'PANNING';

export interface MarqueeBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}
