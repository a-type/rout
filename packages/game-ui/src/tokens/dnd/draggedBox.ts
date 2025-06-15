import { gestureEvents } from './gestureStore';

export class DraggedBox {
  current: DOMRect | null = null;

  #element: HTMLElement | null = null;
  #on = false;

  constructor() {
    gestureEvents.subscribe('move', this.#onGestureChange);
    gestureEvents.subscribe('start', this.#onGestureChange);
  }

  bind = (element: HTMLElement | null) => {
    this.#element = element;
    if (!element) {
      this.current = null;
      return;
    }
    this.current = element.getBoundingClientRect();

    return () => {
      this.#element = null;
      this.current = null;
    };
  };

  start = () => {
    this.#on = true;
    this.#onResize();
  };
  stop = () => {
    this.#on = false;
  };

  #onResize = () => {
    if (this.#element) {
      this.current = this.#element.getBoundingClientRect();
    }
  };

  #onGestureChange = () => {
    if (!this.#on) return;
    requestAnimationFrame(this.#onResize);
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
