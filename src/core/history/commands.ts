import { CanvasElement, ShapeElement } from '../../types/canvas';
import { Command, DocumentData } from '../../types/commands';

export class AddElementCommand implements Command {
  id = `add_${Date.now()}`;
  name = 'Add Element';

  constructor(private element: CanvasElement) {}

  execute(data: DocumentData): DocumentData {
    return {
      ...data,
      elements: { ...data.elements, [this.element.id]: this.element },
      elementIds: [...data.elementIds, this.element.id],
    };
  }

  undo(data: DocumentData): DocumentData {
    const { [this.element.id]: _, ...remaining } = data.elements;
    return {
      ...data,
      elements: remaining,
      elementIds: data.elementIds.filter((id) => id !== this.element.id),
      selectedIds: data.selectedIds.filter((id) => id !== this.element.id),
    };
  }
}

export class AddElementsCommand implements Command {
  id = `add_elements_${Date.now()}`;
  name = 'Add Elements';

  constructor(private elements: CanvasElement[]) {}

  execute(data: DocumentData): DocumentData {
    const newElements = { ...data.elements };
    const newElementIds = [...data.elementIds];
    const addedIds: string[] = [];

    for (const el of this.elements) {
      newElements[el.id] = el;
      newElementIds.push(el.id);
      addedIds.push(el.id);
    }

    return {
      ...data,
      elements: newElements,
      elementIds: newElementIds,
      selectedIds: addedIds,
    };
  }

  undo(data: DocumentData): DocumentData {
    const newElements = { ...data.elements };
    const toRemove = new Set(this.elements.map((e) => e.id));
    for (const id of toRemove) {
      delete newElements[id];
    }

    return {
      ...data,
      elements: newElements,
      elementIds: data.elementIds.filter((id) => !toRemove.has(id)),
      selectedIds: data.selectedIds.filter((id) => !toRemove.has(id)),
    };
  }
}

export class DeleteElementsCommand implements Command {
  id = `del_${Date.now()}`;
  name = 'Delete Elements';
  private deletedElements: CanvasElement[] = [];
  private deletedIndices: { id: string; index: number; }[] = [];

  constructor(
    private targetIds: string[],
    currentData: DocumentData,
  ) {
    this.targetIds.forEach((id) => {
      const el = currentData.elements[id];
      if (el) {
        this.deletedElements.push(el);
        this.deletedIndices.push({ id, index: currentData.elementIds.indexOf(id) });
      }
    });
  }

  execute(data: DocumentData): DocumentData {
    const newElements = { ...data.elements };
    const toRemove = new Set(this.targetIds);
    this.targetIds.forEach((id) => delete newElements[id]);

    return {
      ...data,
      elements: newElements,
      elementIds: data.elementIds.filter((id) => !toRemove.has(id)),
      selectedIds: data.selectedIds.filter((id) => !toRemove.has(id)),
    };
  }

  undo(data: DocumentData): DocumentData {
    const restored = { ...data.elements };
    const restoredIds = [...data.elementIds];

    this.deletedElements.forEach((el) => {
      restored[el.id] = el;
    });

    // Reinsert at original indices
    this.deletedIndices.forEach(({ id, index }) => {
      if (!restoredIds.includes(id)) {
        restoredIds.splice(Math.min(index, restoredIds.length), 0, id);
      }
    });

    return {
      ...data,
      elements: restored,
      elementIds: restoredIds,
    };
  }
}

export function applyElementDelta<T extends CanvasElement>(el: T, dx: number, dy: number): T {
  if (el.type === 'stroke') {
    const shiftedPoints = el.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
    return {
      ...el,
      x: el.x + dx,
      y: el.y + dy,
      points: shiftedPoints,
      cachedPath2D: undefined, // Will be recomputed on render
    };
  }
  if (el.type === 'shape') {
    const updated: ShapeElement = {
      ...el,
      x: el.x + dx,
      y: el.y + dy,
      cachedPath2D: undefined,
    };
    if (el.startPoint && el.endPoint) {
      updated.startPoint = { x: el.startPoint.x + dx, y: el.startPoint.y + dy };
      updated.endPoint = { x: el.endPoint.x + dx, y: el.endPoint.y + dy };
    }
    return updated as T;
  }
  return {
    ...el,
    x: el.x + dx,
    y: el.y + dy,
  };
}

export class MoveElementsCommand implements Command {
  id = `move_${Date.now()}`;
  name = 'Move Elements';

  constructor(
    private elementIds: string[],
    private deltaX: number,
    private deltaY: number,
  ) {}

  execute(data: DocumentData): DocumentData {
    return this.applyDelta(data, this.deltaX, this.deltaY);
  }

  undo(data: DocumentData): DocumentData {
    return this.applyDelta(data, -this.deltaX, -this.deltaY);
  }

  private applyDelta(data: DocumentData, dx: number, dy: number): DocumentData {
    const nextElements = { ...data.elements };

    for (const id of this.elementIds) {
      const el = nextElements[id];
      if (el) {
        nextElements[id] = applyElementDelta(el, dx, dy);
      }
    }

    return { ...data, elements: nextElements };
  }
}

export class TransformElementsCommand implements Command {
  id = `transform_${Date.now()}`;
  name = 'Transform Elements';

  constructor(
    private elementIds: string[],
    private initialElements: Record<string, CanvasElement>,
    private finalElements: Record<string, CanvasElement>,
  ) {}

  execute(data: DocumentData): DocumentData {
    const next = { ...data.elements };
    for (const id of this.elementIds) {
      if (this.finalElements[id]) {
        next[id] = this.finalElements[id];
      }
    }
    return { ...data, elements: next };
  }

  undo(data: DocumentData): DocumentData {
    const next = { ...data.elements };
    for (const id of this.elementIds) {
      if (this.initialElements[id]) {
        next[id] = this.initialElements[id];
      }
    }
    return { ...data, elements: next };
  }
}
