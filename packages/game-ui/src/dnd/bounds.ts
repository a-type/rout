import { useCallback, useEffect, useRef } from 'react';
import { gestureEvents } from './gestureEvents.js';
import { DragGestureContext } from './gestureStore.js';

export interface BoundsRegistryEntry {
  element: HTMLElement;
  bounds: DOMRect;
  visible: boolean;
  // this actually uses ref counting so multiple components can declaratively add tags
  // and we only remove them when the last one is unbound
  tags: Record<string, number>;
  id: string;
  measuredAt: number;
}

class BoundsRegistry {
  #entries: Map<string, BoundsRegistryEntry> = new Map();
  #remeasureThrottles = new WeakMap<BoundsRegistryEntry, ThrottledFn>();
  #unsubs: (() => void)[] = [];

  get __entries() {
    return this.#entries;
  }
  #intersectionObserver: IntersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(this.#updateElementVisibility);
    },
  );

  constructor() {
    // dev: cleanup any leftovers from HMR, etc
    (window as any).bounds?.destroy?.();
    (window as any).bounds = this;
  }

  setup = () => {
    this.#unsubs = [
      gestureEvents.subscribe('move', this.#onGestureChange),
      gestureEvents.subscribe('start', this.#onGestureChange),
    ];
    return this.destroy;
  };
  destroy = () => {
    this.#unsubs.forEach((unsub) => unsub());
  };

  bind = (id: string, element: HTMLElement | null) => {
    if (!element) {
      const entry = this.#entries.get(id);
      if (entry?.element === element) {
        this.#intersectionObserver.unobserve(element);
        this.#entries.delete(id);
      }

      return;
    }

    // set our id data attr
    if (!element.dataset.boundsId) {
      element.dataset.boundsId = id;
    }
    // if we already have an entry, update it
    if (this.#entries.has(id)) {
      const entry = this.#entries.get(id);
      if (entry) {
        if (entry.element === element) {
          return;
        }

        this.#intersectionObserver.unobserve(entry.element);
        this.#intersectionObserver.observe(element);
        entry.element = element;
        entry.bounds = element.getBoundingClientRect();
      }
    }
    // otherwise create a new entry
    else {
      const bounds = element.getBoundingClientRect();
      this.#entries.set(id, {
        element,
        bounds,
        visible: true,
        tags: {},
        id,
        measuredAt: Date.now(),
      });
      this.#intersectionObserver.observe(element);
    }
  };
  addTags = (id: string, tags: string[]) => {
    const entry = this.#entries.get(id);
    if (entry) {
      tags.forEach((tag) => (entry.tags[tag] = (entry.tags[tag] || 0) + 1));
    }
  };
  removeTags = (id: string, tags: string[]) => {
    const entry = this.#entries.get(id);
    if (entry) {
      tags.forEach((tag) => {
        if (entry.tags[tag]) {
          entry.tags[tag]--;
          if (entry.tags[tag] === 0) {
            delete entry.tags[tag];
          }
        }
      });
    }
  };

  getEntry = (id: string) => {
    return this.#entries.get(id);
  };

  getByTag = (tag: string) => {
    const entries: BoundsRegistryEntry[] = [];
    this.#entries.forEach((entry) => {
      if (entry.tags[tag]) {
        entries.push(entry);
      }
    });
    return entries;
  };

  measure = (id: string) => {
    const entry = this.#entries.get(id);
    if (entry) {
      this.#measureElement(entry);
    }
  };

  measureAll = (tag: string) => {
    this.#entries.forEach((entry) => {
      if (entry.visible && entry.tags[tag]) {
        this.#measureElement(entry);
      }
    });
  };

  #getElementId = (element: HTMLElement) => {
    return element.dataset.boundsId;
  };

  #measureElement = (entry: BoundsRegistryEntry) => {
    let invoker = this.#remeasureThrottles.get(entry);
    if (!invoker) {
      invoker = throttled(() => {
        entry.bounds = entry.element.getBoundingClientRect();
        entry.measuredAt = Date.now();
      }, 500);
      this.#remeasureThrottles.set(entry, invoker);
    }
    invoker();
  };

  // automatically update drag-interactive bounds when gesture is active
  #onGestureChange = (gesture: DragGestureContext) => {
    if (gesture.claimId) {
      this.measureAll(gesture.targetTag);
    }
  };

  #updateElementVisibility = (entry: IntersectionObserverEntry) => {
    const id = this.#getElementId(entry.target as HTMLElement);
    if (id) {
      const boundsEntry = this.#entries.get(id);
      if (boundsEntry) {
        boundsEntry.visible = entry.isIntersecting;
        if (entry.isIntersecting) {
          this.#measureElement(boundsEntry);
        }
      }
    }
  };

  #calculateOverlappedArea = (rect1: DOMRect, rect2: DOMRect) => {
    const xOverlap = Math.max(
      0,
      Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left),
    );
    const yOverlap = Math.max(
      0,
      Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top),
    );
    return xOverlap * yOverlap;
  };

  getOverlappingRegions = (
    rect: DOMRect,
    { tag, areaThreshold = 0 }: { tag?: string; areaThreshold?: number } = {},
  ) => {
    const overlaps: (BoundsRegistryEntry & { overlappedArea: number })[] = [];
    this.#entries.forEach((entry, id) => {
      const region = entry.bounds;
      const overlappedArea = this.#calculateOverlappedArea(rect, region);
      if (overlappedArea > areaThreshold) {
        if (tag) {
          if (entry.tags[tag]) {
            overlaps.push({ overlappedArea, ...entry });
          }
        } else {
          overlaps.push({ overlappedArea, ...entry });
        }
      }
    });
    return overlaps.sort((a, b) => b.overlappedArea - a.overlappedArea);
  };

  getContainingRegions = (
    point: { x: number; y: number },
    { tag }: { tag?: string } = {},
  ) => {
    const containing: BoundsRegistryEntry[] = [];
    this.#entries.forEach((entry, id) => {
      const rect = entry.bounds;
      if (
        point.x >= rect.left &&
        point.x <= rect.right &&
        point.y >= rect.top &&
        point.y <= rect.bottom
      ) {
        if (tag) {
          if (entry.tags[tag]) {
            containing.push(entry);
          }
        } else {
          containing.push(entry);
        }
      }
    });
    return containing;
  };

  entryContainsPoint = (
    id: string,
    point: { x: number; y: number },
  ): boolean => {
    const entry = this.#entries.get(id);
    if (!entry) {
      return false;
    }
    const rect = entry.bounds;
    return (
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom
    );
  };
}

export const boundsRegistry = new BoundsRegistry();

export function useBindBounds(id: string) {
  return useCallback(
    (element: HTMLElement | null) => {
      boundsRegistry.bind(id, element);
    },
    [id],
  );
}
export function useTagBounds(id: string, tags: string[], skip?: boolean) {
  const tagsRef = useRef(tags);
  tagsRef.current = tags;
  const updateKey = tags.sort().join('|');
  return useEffect(() => {
    if (!skip) {
      const tags = tagsRef.current;
      boundsRegistry.addTags(id, tags);
      return () => {
        boundsRegistry.removeTags(id, tags);
      };
    }
  }, [id, updateKey, skip]);
}

function throttled<T extends (...args: any[]) => void>(
  func: T,
  limit: number,
): { (...args: Parameters<T>): void; cancel: () => void } {
  let lastFunc: ReturnType<typeof setTimeout> | undefined = undefined;
  let lastRan = 0;

  function throttled(...args: Parameters<T>) {
    if (Date.now() - lastRan >= limit) {
      if (lastFunc) {
        clearTimeout(lastFunc);
      }
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(
        () => {
          func(...args);
          lastRan = Date.now();
        },
        limit - (Date.now() - lastRan),
      );
    }
  }
  throttled.cancel = () => {
    if (lastFunc) {
      clearTimeout(lastFunc);
      lastFunc = undefined;
    }
  };
  return throttled;
}

type ThrottledFn = () => void;
