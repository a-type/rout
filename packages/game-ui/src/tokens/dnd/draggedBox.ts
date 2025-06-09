export class DraggedBox {
  current: DOMRect | null = null;

  #element: HTMLElement | null = null;
  #resizeObserver: ResizeObserver;
  #rafId: number | null = null;

  constructor() {
    this.#resizeObserver = new ResizeObserver(this.#onResize);
    window.addEventListener('resize', this.#onResize);
    window.addEventListener('orientationchange', this.#onResize);
    window.addEventListener('scroll', this.#onResize, { passive: true });
  }

  bind = (element: HTMLElement | null) => {
    if (this.#element) {
      this.#resizeObserver.unobserve(this.#element);
    }

    this.#element = element;
    if (!element) {
      this.current = null;
      return;
    }
    this.current = element.getBoundingClientRect();
    this.#resizeObserver.observe(element);

    this.start();

    return () => {
      this.#resizeObserver.unobserve(element);
      this.#element = null;
      this.current = null;
      this.stop();
    };
  };

  start = () => {
    this.frame();
  };
  frame = () => {
    this.update();
    this.#rafId = requestAnimationFrame(this.frame);
  };
  stop = () => {
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  };

  #onResize = () => {
    if (this.#element) {
      this.current = this.#element.getBoundingClientRect();
    }
  };

  update = () => {
    this.#onResize();
  };
}

export const draggedBox = new DraggedBox();
