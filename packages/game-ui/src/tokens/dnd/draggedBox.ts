export class DraggedBox {
  current: DOMRect | null = null;

  #element: HTMLElement | null = null;
  #rafId: number | null = null;

  constructor() {}

  bind = (element: HTMLElement | null) => {
    this.#element = element;
    if (!element) {
      this.current = null;
      return;
    }
    this.current = element.getBoundingClientRect();

    this.start();

    return () => {
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

  contains = (x: number, y: number) => {
    return (
      this.current &&
      x >= this.current.left &&
      x <= this.current.right &&
      y >= this.current.top &&
      y <= this.current.bottom
    );
  };
}

export const draggedBox = new DraggedBox();
