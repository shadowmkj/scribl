import { Command, DocumentData } from '../../types/commands';

export class HistoryStack {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxDepth: number = 50;

  execute(command: Command, data: DocumentData): DocumentData {
    const nextData = command.execute(data);
    this.pushExecuted(command);
    return nextData;
  }

  pushExecuted(command: Command): void {
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo on new action
  }

  undo(data: DocumentData): DocumentData {
    const command = this.undoStack.pop();
    if (!command) return data;
    const nextData = command.undo(data);
    this.redoStack.push(command);
    return nextData;
  }

  redo(data: DocumentData): DocumentData {
    const command = this.redoStack.pop();
    if (!command) return data;
    const nextData = command.execute(data);
    this.undoStack.push(command);
    return nextData;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
