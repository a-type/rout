class DataRegistry {
  private registry = new Map<string, { data: any; refCount: number }>();
  register(id: string, data: any) {
    const existing = this.registry.get(id);
    if (existing) {
      existing.refCount++;
      existing.data = data; // Update the data if it already exists
    } else {
      this.registry.set(id, { data, refCount: 1 });
    }

    return () => {
      const entry = this.registry.get(id);
      if (entry) {
        entry.refCount--;
        if (entry.refCount === 0) {
          this.registry.delete(id);
        }
      }
    };
  }
  get(id: string) {
    const entry = this.registry.get(id);
    if (entry) {
      return entry.data;
    }
    return null;
  }
}

export const draggableDataRegistry = new DataRegistry();
export const droppableDataRegistry = new DataRegistry();
