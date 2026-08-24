import type { LayerInstance, LayerSnapshot } from "./types";

export class LayerStore {
  private records = new Map<number, LayerInstance>();
  private listeners = new Set<() => void>();
  private snapshot: LayerSnapshot = { instances: [], version: 0 };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): LayerSnapshot => this.snapshot;

  get(index: number): LayerInstance | undefined {
    return this.records.get(index);
  }

  values(): LayerInstance[] {
    return Array.from(this.records.values());
  }

  add(record: LayerInstance): void {
    this.records.set(record.index, record);
    this.emit();
  }

  update(index: number, update: Partial<LayerInstance>): void {
    const record = this.records.get(index);
    if (!record) return;
    Object.assign(record, update);
    this.emit();
  }

  touch(): void {
    this.emit();
  }

  remove(index: number): LayerInstance | undefined {
    const record = this.records.get(index);
    if (!record) return undefined;
    this.records.delete(index);
    this.emit();
    return record;
  }

  private emit(): void {
    this.snapshot = {
      instances: Array.from(this.records.values()),
      version: this.snapshot.version + 1,
    };
    this.listeners.forEach((listener) => listener());
  }
}
