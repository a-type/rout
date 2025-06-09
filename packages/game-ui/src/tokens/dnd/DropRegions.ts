export const REGION_ID_ATTR = 'data-droppable-id';

export class DropRegions {
  elements: Map<string, HTMLElement> = new Map();
  regions: Map<string, DOMRect> = new Map();

  // TODO: remove all Observer stuff, using rafs now
  #regionResizeObserver: ResizeObserver;
  #rafId: number | null = null;

  constructor() {
    this.#regionResizeObserver = new ResizeObserver(this.#onRegionResize);
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
    console.debug('Registering drop region', id);
    element.setAttribute(REGION_ID_ATTR, id);
    this.elements.set(id, element);
    this.regions.set(id, element.getBoundingClientRect());
    this.#regionResizeObserver.observe(element);
    if (this.regions.size === 1) {
      this.#start();
    }

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
    this.#regionResizeObserver.unobserve(element);
    if (this.elements.size === 0) {
      this.#stop();
    }
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

  #bind = () => {
    window.addEventListener('resize', this.#onWindowResize);
    window.addEventListener('orientationchange', this.#onWindowResize);
    window.addEventListener('scroll', this.#onWindowResize, { passive: true });
  };

  #onRegionResize = (entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const id = entry.target.getAttribute(REGION_ID_ATTR);
      if (!id) continue;
      const element = this.elements.get(id);
      if (!element) continue;
      this.regions.set(id, element.getBoundingClientRect());
    }
  };

  #onWindowResize = () => {
    this.regions.clear();
    for (const [id, element] of this.elements) {
      this.regions.set(id, element.getBoundingClientRect());
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

  #start = () => {
    if (this.#rafId) return; // Already started
    this.#frame();
  };
  #frame = () => {
    for (const [id, element] of this.elements) {
      this.regions.set(id, element.getBoundingClientRect());
    }
    this.#rafId = requestAnimationFrame(this.#frame);
  };
  #stop = () => {
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  };
}

export const dropRegions = new DropRegions();

(window as any).dropRegions = dropRegions; // For debugging purposes
