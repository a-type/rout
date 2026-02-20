import { EventSubscriber } from '@a-type/utils';
import { dndLogger } from './logger';

export type DataRegistryEvents = {
  [K in `update:${string}`]: (data: any) => void;
};

/**
 * Compare objects for equality, ignoring functions and non-serializable properties. This is used to determine if data updates should trigger events.
 */
function areEqual(a: any, b: any) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;

  const aKeys = Object.keys(a).filter((key) => typeof a[key] !== 'function');
  const bKeys = Object.keys(b).filter((key) => typeof b[key] !== 'function');

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (!areEqual(a[key], b[key])) return false;
  }

  return true;
}

class DataRegistry extends EventSubscriber<DataRegistryEvents> {
  private registry = new Map<string, { data: any; refCount: number }>();
  register(id: string, data: any) {
    const existing = this.registry.get(id);
    if (existing) {
      dndLogger.debug(
        `DataRegistry: incrementing refCount for ${id}, current refCount: ${existing.refCount}, new: ${existing.refCount + 1}`,
      );
      existing.refCount++;
      // Update the data if it has changed
      if (!areEqual(existing.data, data)) {
        existing.data = data;
        this.emit(`update:${id}`, data);
      }
    } else {
      dndLogger.debug(`DataRegistry: registering new data for ${id}`);
      this.registry.set(id, { data, refCount: 1 });
      this.emit(`update:${id}`, data);
    }

    return () => {
      const entry = this.registry.get(id);
      if (entry) {
        dndLogger.debug(
          `DataRegistry: unregistering data for ${id}, current refCount: ${entry.refCount}`,
        );
        entry.refCount--;
        if (entry.refCount === 0) {
          dndLogger.debug(
            `DataRegistry: removing entry for ${id} as refCount reached 0`,
          );
          this.registry.delete(id);
          this.emit(`update:${id}`, null);
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
