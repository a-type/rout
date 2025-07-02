import { throttle } from '@a-type/utils';
import { gestureEvents } from './gestureEvents';

export class DraggedBox {
  current: DOMRect | null = null;

  #element: HTMLElement | null = null;
  #on = false;

  get hasElement() {
    return this.#element !== null;
  }

  constructor() {
    gestureEvents.subscribe('move', this.#onGestureChange);
    gestureEvents.subscribe('start', this.#onGestureChange);
  }

  bind = (element: HTMLElement | null) => {
    if (this.#element !== element) {
      this.#element = element;
      if (!element) {
        this.current = null;
      } else {
        this.current = element.getBoundingClientRect();
      }
    }
  };

  start = () => {
    this.#on = true;
    this.#onResize();
  };
  stop = () => {
    this.#on = false;
  };

  #onResize = throttle(() => {
    requestAnimationFrame(() => {
      if (this.#element) {
        this.current = this.#element.getBoundingClientRect();
      }
    });
  }, 150);

  #onGestureChange = () => {
    if (!this.#on) return;
    this.#onResize();
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
