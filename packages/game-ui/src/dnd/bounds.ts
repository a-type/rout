import { useCallback, useEffect } from 'react';
import { subscribeToWindow } from '../utils';
import { gestureEvents } from './gestureEvents';
import { TAGS } from './tags';

export interface BoundsRegistryEntry {
  element: HTMLElement;
  bounds: DOMRect;
  visible: boolean;
  tags: Set<string>;
  id: string;
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
      subscribeToWindow('resize', this.#onGestureChange),
      subscribeToWindow('orientationchange', this.#onGestureChange),
    ];
    return this.destroy();
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
        tags: new Set(),
        id,
      });
      this.#intersectionObserver.observe(element);
    }
  };
  bindTag = (id: string, tag: string) => {
    const entry = this.#entries.get(id);
    if (entry) {
      entry.tags.add(tag);
    }
    return () => {
      const entry = this.#entries.get(id);
      if (entry) {
        entry.tags.delete(tag);
      }
    };
  };

  getEntry = (id: string) => {
    return this.#entries.get(id);
  };

  measure = (id: string) => {
    const entry = this.#entries.get(id);
    if (entry) {
      this.#measureElement(entry);
    }
  };

  measureAll = (tag: string) => {
    this.#entries.forEach((entry) => {
      if (entry.visible && entry.tags.has(tag)) {
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
      }, 200);
      this.#remeasureThrottles.set(entry, invoker);
    }
    invoker();
  };

  // automatically update drag-interactive bounds when gesture is active
  #onGestureChange = () => {
    this.measureAll(TAGS.DRAG_INTERACTIVE);
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
          if (entry.tags.has(tag)) {
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
          if (entry.tags.has(tag)) {
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
export function useTagBounds(id: string, tag: string, skip?: boolean) {
  return useEffect(() => {
    if (!skip) {
      return boundsRegistry.bindTag(id, tag);
    }
  }, [id, tag, skip]);
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
