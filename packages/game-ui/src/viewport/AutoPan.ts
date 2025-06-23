import { EventSubscriber } from '@a-type/utils';
import { Vector2 as GestureVector2 } from '@use-gesture/react';
import { multiplyVector, vectorLength } from './math.js';
import { Vector2 } from './types.js';
import { ViewportState } from './ViewportState.js';

/**
 * A class which encapsulates a looping behavior for auto-panning the
 * viewport when the user drags an surface or tool near the edge of the window.
 * A discrete, stateful class is needed because there are no cursor events
 * which fire continually when a user's pointer is idling in the "hot zone" -
 * i.e. we have to use an animation frame loop to continually apply the pan
 * if the user moves their cursor near the edge and then stops moving, because
 * even though the cursor has stopped, it's still in the pan zone.
 */
export class AutoPan extends EventSubscriber<{
  pan(data: { autoPan: Vector2; cursorPosition: Vector2 | null }): void;
}> {
  private cursorPosition: Vector2 | null = null;
  // percentage of window dimensions which will trigger auto-pan behavior
  private threshold = 0.05;
  // slows down the pan speed
  private panSpeedMultiplier = 0.25;
  private rafHandle: number | undefined;

  constructor(private viewport: ViewportState) {
    super();
  }

  /**
   * begin the auto-pan update loop with an initial cursor position -
   * should be called at the start of a drag
   */
  start = (cursorPosition: Vector2 | GestureVector2) => {
    if (Array.isArray(cursorPosition)) {
      this.cursorPosition = { x: cursorPosition[0], y: cursorPosition[1] };
    } else {
      this.cursorPosition = cursorPosition;
    }
    this.rafHandle = requestAnimationFrame(this.loop);
  };

  /**
   * sets a new cursor position to calculate from, use this whenever
   * the cursor moves.
   */
  update = (cursorPosition: Vector2 | GestureVector2) => {
    if (!this.cursorPosition) {
      this.cursorPosition = { x: 0, y: 0 };
    }
    if (Array.isArray(cursorPosition)) {
      this.cursorPosition.x = cursorPosition[0];
      this.cursorPosition.y = cursorPosition[1];
    } else {
      this.cursorPosition.x = cursorPosition.x;
      this.cursorPosition.y = cursorPosition.y;
    }
  };

  /** cancels the update loop, should be called at the end of a drag */
  stop = () => {
    if (this.rafHandle) {
      cancelAnimationFrame(this.rafHandle);
    }
  };

  private getAutoPan = () => {
    const cursorPosition = this.cursorPosition;
    if (!cursorPosition) {
      return { x: 0, y: 0 };
    }

    const windowLeft = this.viewport.rootOffset.x;
    const windowTop = this.viewport.rootOffset.y;
    const windowRight = windowLeft + this.viewport.rootSize.width;
    const windowBottom = windowTop + this.viewport.rootSize.height;

    // if cursor is outside the viewport, don't pan
    if (
      cursorPosition.x < windowLeft ||
      cursorPosition.x > windowRight ||
      cursorPosition.y < windowTop ||
      cursorPosition.y > windowBottom
    ) {
      return { x: 0, y: 0 };
    }

    const autoPan = { x: 0, y: 0 };
    const horizontalThreshold = this.threshold * this.viewport.rootSize.width;
    const verticalThreshold = this.threshold * this.viewport.rootSize.height;
    if (cursorPosition.x < horizontalThreshold + windowLeft) {
      // autopan is adaptive to how far 'deep' in the threshold the cursor is
      autoPan.x = -(horizontalThreshold - (cursorPosition.x - windowLeft));
    } else if (windowRight - cursorPosition.x < horizontalThreshold) {
      autoPan.x = horizontalThreshold - (windowRight - cursorPosition.x);
    }
    if (cursorPosition.y < verticalThreshold + windowTop) {
      autoPan.y = -(verticalThreshold - (cursorPosition.y - windowTop));
    } else if (windowBottom - cursorPosition.y < verticalThreshold) {
      autoPan.y = verticalThreshold - (windowBottom - cursorPosition.y);
    }

    return multiplyVector(autoPan, this.panSpeedMultiplier);
  };

  private loop = () => {
    const autoPan = this.getAutoPan();

    if (vectorLength(autoPan)) {
      this.viewport.relativePan(autoPan, {
        origin: 'direct',
      });
      // emit an event to others
      this.emit('pan', { autoPan, cursorPosition: this.cursorPosition });
    }

    this.rafHandle = requestAnimationFrame(this.loop);
  };
}
