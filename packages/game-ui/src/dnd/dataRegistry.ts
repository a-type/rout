class DataRegistry {
  private registry = new Map<string, { data: any; refCount: number }>();
  register(id: string, data: any) {
    const existing = this.registry.get(id);
    if (existing) {
      console.debug(
        `DataRegistry: incrementing refCount for ${id}, current refCount: ${existing.refCount}, new: ${existing.refCount + 1}`,
      );
      existing.refCount++;
      existing.data = data; // Update the data if it already exists
    } else {
      console.debug(`DataRegistry: registering new data for ${id}`);
      this.registry.set(id, { data, refCount: 1 });
    }

    return () => {
      const entry = this.registry.get(id);
      if (entry) {
        console.debug(
          `DataRegistry: unregistering data for ${id}, current refCount: ${entry.refCount}`,
        );
        entry.refCount--;
        if (entry.refCount === 0) {
          console.debug(
            `DataRegistry: removing entry for ${id} as refCount reached 0`,
          );
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
