export class Logger {
  #showDebug;
  constructor(private tag: string) {
    this.#showDebug =
      // @ts-ignore
      typeof window !== 'undefined' &&
      // @ts-ignore
      (window.localStorage.getItem('DEBUG') === 'true' ||
        // @ts-ignore
        window.localStorage.getItem('DEBUG')?.includes(tag));
  }

  info = (...args: any[]) => {
    console.log(`[${this.tag}]`, ...args);
  };

  warn = (...args: any[]) => {
    console.warn(`[${this.tag}]`, ...args);
  };

  urgent = (...args: any[]) => {
    console.error(`[${this.tag}]`, ...args);
  };

  fatal = (...args: any[]) => {
    console.error(`[${this.tag}]`, '<<FATAL>>', ...args);
  };

  debug = (...args: any[]) => {
    if (!this.#showDebug) return;
    console.debug(`[${this.tag}]`, ...args);
  };
}

export const logger = new Logger('general');
