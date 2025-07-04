import { gestureEvents } from './gestureEvents';

export const REGION_ID_ATTR = 'data-droppable-id';

export class DropRegions {
  elements: Map<string, HTMLElement> = new Map();
  regions: Map<string, DOMRect> = new Map();

  constructor() {
    this.#bind();
  }

  register = (element: HTMLElement | null) => {
    if (!element) {
      return;
    }
    const id = element.getAttribute(REGION_ID_ATTR);
    if (!id) {
      return;
    }
    if (this.elements.get(id) === element) {
      return () => {
        this.unregister(id);
      };
    }
    element.setAttribute(REGION_ID_ATTR, id);
    this.elements.set(id, element);
    this.regions.set(id, element.getBoundingClientRect());

    return () => {
      this.unregister(id);
    };
  };

  unregister = (id: string) => {
    const element = this.elements.get(id);
    if (!element) return;
    this.elements.delete(id);
    this.regions.delete(id);
    element.removeAttribute(REGION_ID_ATTR);
  };

  getOverlappingRegions = (rect: DOMRect, areaThreshold = 0) => {
    const overlaps: { overlappedArea: number; id: string }[] = [];
    for (const [id, region] of this.regions) {
      const overlappedArea = this.#calculateOverlappedArea(rect, region);
      if (overlappedArea > areaThreshold) {
        overlaps.push({ overlappedArea, id });
      }
    }
    return overlaps.sort((a, b) => b.overlappedArea - a.overlappedArea);
  };

  getContainingRegions = (point: { x: number; y: number }) => {
    const containing: { id: string }[] = [];
    for (const [id, region] of this.regions) {
      if (this.#calculateContains(region, point)) {
        containing.push({ id });
      }
    }
    return containing;
  };

  #bind = () => {
    gestureEvents.subscribe('start', this.#onGestureChange);
    gestureEvents.subscribe('move', this.#onGestureChange);
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

  #calculateContains = (rect: DOMRect, point: { x: number; y: number }) => {
    return (
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom
    );
  };

  #updateAll = () => {
    requestAnimationFrame(() => {
      for (const [id, element] of this.elements) {
        this.regions.set(id, element.getBoundingClientRect());
      }
    });
  };
  #throttledUpdateAll = throttle(this.#updateAll, 100);

  #onGestureChange = () => {
    this.#throttledUpdateAll();
  };
}

export const dropRegions = new DropRegions();

(window as any).dropRegions = dropRegions; // For debugging purposes

function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan = 0;

  return function (...args: Parameters<T>) {
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
  };
}
