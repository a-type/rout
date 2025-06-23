import { EventSubscriber, preventDefault } from '@a-type/utils';
import { addVectors, clamp, clampVector, subtractVectors } from './math';
import { Box, RectLimits, Size, Vector2 } from './types';

const MIN_POSSIBLE_ZOOM = 0.000001;

export interface DefaultCenter {
  x: number | `${number}%`;
  y: number | `${number}%`;
}

export interface ViewportConfig {
  /** Supply a starting zoom value. Default 1 */
  defaultZoom?: number;
  /** Supply a starting center position. Default is the middle of the pan limits or 0,0 */
  defaultCenter?: DefaultCenter;
  /**
   * There are two ways to limit pan position:
   * "center" simply clamps the center of the screen to the provided panLimits boundary
   * "viewport" enforces that the closest edge of the viewport must not exceed the boundary
   * Default is "center"
   */
  panLimitMode?: 'center' | 'viewport';
  panLimitBuffer?: number;
  /**
   * Restrict zooming to certain boundaries. Default min is 'fit', max 2.
   * "min" has a special value, 'fit', which will ensure that at least
   * one axis of the content fits the viewport at all times. A percentage number can be
   * supplied instead to set a specific minimum zoom level.
   */
  zoomLimits?: {
    min: number | 'fit';
    max: number;
  };
  /**
   * Start the Viewport already bound to an existing DOM element. This
   * can be set later using bindElement. Defaults to window.
   */
  boundElement?: HTMLElement;
}

// removes some optional annotations as they are filled by defaults.
type InternalViewportConfig = Omit<
  ViewportConfig,
  'zoomLimits' | 'boundElement' | 'defaultZoom' | 'canvas'
> & {
  defaultZoom: number;
  zoomLimits: { min: number | 'fit'; max: number };
};

/**
 * Event origins are included in change events to indicate what
 * kind of operation caused the change. This helps animation code
 * determine what kind of easing to apply to the movement -
 *  - direct movement is usually very tight or not eased at all
 *  - control movement is triggered indirectly by control interaction
 *    (like zoom buttons) and usually has tighter easing
 *  - animation movement comes from app events and may have long easing
 *    curves to help the user interpret the change since they didn't
 *    originate it
 */
export type ViewportEventOrigin = 'direct' | 'control' | 'animation';

export type ViewportEvents = {
  zoomChanged(zoom: number, origin: ViewportEventOrigin): void;
  zoomSettled(zoom: number, origin: ViewportEventOrigin): void;
  centerChanged(center: Readonly<Vector2>, origin: ViewportEventOrigin): void;
  centerSettled(center: Readonly<Vector2>, origin: ViewportEventOrigin): void;
  /** Fired when the size of the bound element changes */
  rootSizeChanged(size: Size): void;
  /** Fired when the size of the pan limit boundaries changes */
  panLimitsChanged(size: RectLimits | undefined): void;
};

/**
 * Viewport handles all the logic of managing a 2d viewport with pan & zoom which
 * renders spatial content on a larger plane. Viewport handles the math required
 * to determine boundaries on panning, converts screen coordinates to "world" coordinates,
 * and holds the state for the target values of both the zoom and camera center position.
 *
 * Viewport does NOT do any easing of values, it just computes the target values.
 * Easing is left up to the actual view code (in our case React). Rendering code
 * should set up easing between target values as those values change in Viewport.
 *
 * To that end Viewport implements a few events which can be listened to for
 * when the camera properties change.
 */
export class ViewportState extends EventSubscriber<ViewportEvents> {
  private _center: Vector2 = { x: 0, y: 0 };
  private _zoom = 1;
  _config: InternalViewportConfig;
  // initialized in a helper method, bypassing
  // strict initialization checking...
  private _boundRoot: HTMLElement = null as any;
  private _boundRootSize: Size = { width: 0, height: 0 };
  private _boundRootOffset: Vector2 = { x: 0, y: 0 };
  private _boundContent: HTMLElement | null = null;
  private _boundContentSize: Size = { width: 0, height: 0 };

  private handleBoundElementResize = ([entry]: ResizeObserverEntry[]) => {
    const box = entry.target.getBoundingClientRect();
    this.setBoundElementSize(entry.contentRect, {
      x: box.left,
      y: box.top,
    });
  };
  private _boundElementResizeObserver = new ResizeObserver(
    this.handleBoundElementResize,
  );

  private handleContentElementResize = ([entry]: ResizeObserverEntry[]) => {
    this.setContentElementSize(entry.contentRect);
  };
  private _contentElementResizeObserver = new ResizeObserver(
    this.handleContentElementResize,
  );

  private zoomFitValue = MIN_POSSIBLE_ZOOM;
  private _hasGesturePanned = false;

  constructor({ boundElement, ...config }: ViewportConfig = {}) {
    super();

    // intentionally not !== undefined - we ignore 0 too.
    if (config.defaultZoom) {
      this._zoom = config.defaultZoom;
    }

    this._config = {
      defaultZoom: 1,
      defaultCenter: { x: '50%', y: '50%' },
      zoomLimits: { min: 'fit', max: 2 },
      panLimitMode: 'center',
      ...config,
    };
    this.resetCenter();

    this.bindRoot(boundElement ?? null);

    // @ts-ignore for debugging
    window.viewport = this;
  }

  private setBoundElementSize = (size: Size, offset?: Vector2) => {
    this._boundRootSize = size;
    if (offset) {
      this._boundRootOffset = offset;
    }
    this.updateZoomFitMin();
    this.reconstrainPosition();
    this.emit('rootSizeChanged', size);
  };

  private setContentElementSize = (size: Size) => {
    this._boundContentSize = size;
    this.updateZoomFitMin();
    if (this._hasGesturePanned) {
      this.reconstrainPosition({ origin: 'control' });
    }
    this.emit('panLimitsChanged', this.panLimits);
  };

  private get panLimits() {
    if (!this._boundContentSize) {
      return undefined;
    }
    return {
      min: {
        x:
          this._boundContentSize.width / -2 -
          (this._config.panLimitBuffer ?? 0),
        y:
          this._boundContentSize.height / -2 -
          (this._config.panLimitBuffer ?? 0),
      },
      max: {
        x:
          this._boundContentSize.width / 2 + (this._config.panLimitBuffer ?? 0),
        y:
          this._boundContentSize.height / 2 +
          (this._config.panLimitBuffer ?? 0),
      },
    };
  }

  private updateZoomFitMin = () => {
    // computed as the minimum zoom level where one axis of the bounds
    // takes up the entire viewport. if pan limits are unbounded, it
    // defaults to MIN_POSSIBLE_ZOOM
    if (this.panLimits) {
      this.zoomFitValue = Math.min(
        this._boundRootSize.width /
          (this.panLimits.max.x - this.panLimits.min.x),
        this._boundRootSize.height /
          (this.panLimits.max.y - this.panLimits.min.y),
      );
    } else {
      this.zoomFitValue = MIN_POSSIBLE_ZOOM;
    }
  };

  bindRoot = (element: HTMLElement | null) => {
    if (this._boundRoot && this._boundRoot !== element) {
      this._boundElementResizeObserver.unobserve(this._boundRoot);
      this._boundRoot.removeAttribute('data-viewport');
    }
    if (typeof window === 'undefined') {
      // SSR context - simulate an element client rect and ignore
      // the element size monitoring. Size is arbitrary.
      this.setBoundElementSize({
        width: 2400,
        height: 2400,
      });
    } else {
      this._boundRoot = element ?? document.documentElement;
      this._boundRoot.setAttribute('data-viewport', 'true');
      this._boundElementResizeObserver.observe(this._boundRoot);
      if (element) {
        const box = element.getBoundingClientRect();
        this.setBoundElementSize(
          {
            width: element.clientWidth,
            height: element.clientHeight,
          },
          {
            x: box.left,
            y: box.top,
          },
        );
      } else {
        this.setBoundElementSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    }

    document.addEventListener('gesturestart', preventDefault);
    document.addEventListener('gesturechange', preventDefault);
  };

  bindContent = (element: HTMLElement | null) => {
    if (this._boundContent && this._boundContent !== element) {
      this._contentElementResizeObserver.unobserve(this._boundContent);
      this._boundContent.removeAttribute('data-viewport-content');
    }
    this._boundContent = element ?? null;
    if (this._boundContent) {
      this._boundContent.setAttribute('data-viewport-content', 'true');
      this._contentElementResizeObserver.observe(this._boundContent);
      this.setContentElementSize({
        width: this._boundContent.clientWidth,
        height: this._boundContent.clientHeight,
      });
      this.fitEverythingOnScreen({ origin: 'animation' });
    }
  };

  /** Public getters for core values */

  /**
   * The zoom value of the camera - higher means things look bigger.
   */
  get zoom() {
    return this._zoom;
  }

  get zoomMin() {
    if (this.config.zoomLimits.min === 'fit') {
      return this.zoomFitValue;
    }
    return this.config.zoomLimits.min;
  }

  get zoomMax() {
    return this.config.zoomLimits.max;
  }

  /**
   * The center coordinate of the camera's focus, in "world" space.
   */
  get center() {
    return this._center as Readonly<Vector2>;
  }

  get topLeft() {
    return this.viewportToWorld(this._boundRootOffset);
  }

  get config() {
    return this._config;
  }

  /**
   * The size, in pixels, of the viewport element.
   */
  get rootSize() {
    return this._boundRootSize as Readonly<Size>;
  }

  get rootOffset() {
    return this._boundRootOffset as Readonly<Vector2>;
  }

  /**
   * The size in world units of the visible space
   * in the viewport
   */
  get size() {
    return {
      width: this._boundRootSize.width / this.zoom,
      height: this._boundRootSize.height / this.zoom,
    };
  }

  get element() {
    return this._boundRoot;
  }

  /**
   * How much a 0,0 based content rectangle of the same size as
   * the pan limits should, by pixels, offset
   * itself from the origin in order to match the world position of the
   * pan limits.
   */
  get contentOffset() {
    if (!this._boundContentSize) {
      return { x: 0, y: 0 };
    }
    return {
      x: -this._boundContentSize.width / 2,
      y: -this._boundContentSize.height / 2,
    };
  }

  /** Convenience getters for internal calculation */

  private get halfViewportWidth() {
    return this._boundRootSize.width / 2;
  }

  private get halfViewportHeight() {
    return this._boundRootSize.height / 2;
  }

  private get panLimitsCenter() {
    if (!this.panLimits) {
      return { x: 0, y: 0 };
    }
    return {
      x: (this.panLimits.max.x + this.panLimits.min.x) / 2,
      y: (this.panLimits.max.y + this.panLimits.min.y) / 2,
    };
  }

  private resetCenter() {
    if (this.config.defaultCenter) {
      if (this.panLimits) {
        const panLimitsWidth = this.panLimits.max.x - this.panLimits.min.x;
        const panLimitsHeight = this.panLimits.max.y - this.panLimits.min.y;

        if (typeof this.config.defaultCenter.x === 'number') {
          this._center.x = this.config.defaultCenter.x;
        } else {
          const xPercent = parseFloat(this.config.defaultCenter.x);
          this._center.x =
            (xPercent / 100) * panLimitsWidth + this.panLimits.min.x;
        }
        if (typeof this.config.defaultCenter.y === 'number') {
          this._center.y = this.config.defaultCenter.y;
        } else {
          const yPercent = parseFloat(this.config.defaultCenter.y);
          this._center.y =
            (yPercent / 100) * panLimitsHeight + this.panLimits.min.y;
        }
      } else {
        // should be 0,0 at this point.
        this._center = this.panLimitsCenter;
      }
    } else {
      this._center = this.panLimitsCenter;
    }
    this.emit('centerChanged', this.center, 'direct');
  }

  dispose = () => {
    document.removeEventListener('gesturestart', preventDefault);
    document.removeEventListener('gesturechange', preventDefault);
  };

  updateConfig = (config: Partial<ViewportConfig>) => {
    this._config = {
      ...this._config,
      ...config,
    };
  };

  /**
   * Transforms a pixel position into world coordinates. Optionally
   * you can clamp the coordinate to the canvas bounds, if they exist.
   */
  viewportToWorld = (screenPoint: Vector2) => {
    // This was a bit trial-and-error, but:
    // 1. subtract half of the window size
    //      Imagine the viewport was centered at 0,0 in world space (the center of the window
    //      is exactly at the center of the room). if the user
    //      moved an object toward the upper left corner of their screen,
    //      that would logically be in negative world coordinate space -
    //      however, screen coordinates are only positive from the top left corner.
    //      this is basically the part that converts from a top-left to a center-based
    //      positioning system.
    // 2. scale based on inverse zoom (divide by zoom)
    //      scaling for zoom is necessary - imagine if you are at 0.5x zoom and you move
    //      the object 10 pixels to the left - you are actually moving 20 pixels of world
    //      space because the world is half-size.
    // 3. subtract the pan of the canvas
    //      subtracting the pan value accommodates for the fact that pan moves the world
    //      independently of the visible screen space, so we need to add that offset in.
    //      this is done OUTSIDE of the zoom scaling because the pan coordinate is already
    //      in world space and doesn't need to be adjusted for zoom.
    const transformedPoint = {
      x:
        (screenPoint.x - this._boundRootOffset.x - this.halfViewportWidth) /
          this.zoom +
        this.center.x,
      y:
        (screenPoint.y - this._boundRootOffset.y - this.halfViewportHeight) /
          this.zoom +
        this.center.y,
    };
    return transformedPoint;
  };

  /**
   * Converts a world point to a viewport (screen, pixel) point. The point
   * will be relative to the viewport element. This is the inverse of
   * viewportToWorld.
   */
  worldToViewport = (worldPoint: Vector2) => {
    return {
      x:
        (worldPoint.x - this.center.x) * this.zoom +
        this.halfViewportWidth +
        this._boundRootOffset.x,
      y:
        (worldPoint.y - this.center.y) * this.zoom +
        this.halfViewportHeight +
        this._boundRootOffset.y,
    };
  };

  /**
   * Converts a delta vector (a distance representation) from
   * viewport (screen, pixel) space to world space
   */
  viewportDeltaToWorld = (screenDelta: Vector2) => {
    return {
      x: screenDelta.x / this.zoom,
      y: screenDelta.y / this.zoom,
    };
  };

  /**
   * Converts a delta vector (a distance representation) from
   * world space to viewport (screen, pixel) space
   */
  worldDeltaToViewport = (worldDelta: Vector2) => {
    return {
      x: worldDelta.x * this.zoom,
      y: worldDelta.y * this.zoom,
    };
  };

  worldSizeToViewport = (worldSize: Size) => {
    return {
      width: worldSize.width * this.zoom,
      height: worldSize.height * this.zoom,
    };
  };

  /**
   * Clamps the pan position if limits are provided.
   * @param panPosition Proposed pan position, in world coordinates
   */
  private clampPanPosition = (panPosition: Vector2) => {
    if (this.panLimits) {
      if (this.config.panLimitMode === 'viewport') {
        const worldViewportHalfWidth = this.halfViewportWidth / this.zoom;
        const worldViewportHalfHeight = this.halfViewportHeight / this.zoom;
        const worldViewportWidth = this._boundRootSize.width / this.zoom;
        const worldViewportHeight = this._boundRootSize.height / this.zoom;
        const clampSize = {
          width: this.panLimits.max.x - this.panLimits.min.x,
          height: this.panLimits.max.y - this.panLimits.min.y,
        };
        const worldCenter = {
          x: this.panLimits.min.x + clampSize.width / 2,
          y: this.panLimits.min.y + clampSize.height / 2,
        };

        // there are different rules depending on if the viewport is visually larger
        // than the canvas, or vice versa. when the viewport is larger than the canvas
        // we still let the user move around a little bit, until the edge of the
        // canvas touches the far edge of the screen.
        let minX = this.panLimits.min.x + worldViewportHalfWidth;
        let maxX = this.panLimits.max.x - worldViewportHalfWidth;
        if (worldViewportWidth > clampSize.width) {
          minX = worldCenter.x - (worldViewportWidth - clampSize.width) / 2;
          maxX = worldCenter.x + (worldViewportWidth - clampSize.width) / 2;
        }
        let minY = this.panLimits.min.y + worldViewportHalfHeight;
        let maxY = this.panLimits.max.y - worldViewportHalfHeight;
        if (worldViewportHeight > clampSize.height) {
          minY = worldCenter.y - (worldViewportHeight - clampSize.height) / 2;
          maxY = worldCenter.y + (worldViewportHeight - clampSize.height) / 2;
        }
        return clampVector(
          panPosition,
          { x: minX, y: minY },
          { x: maxX, y: maxY },
        );
      }
      // simpler center-based clamping
      return clampVector(panPosition, this.panLimits.min, this.panLimits.max);
    }
    return panPosition;
  };

  /**
   * Adjusts the zoom of the viewport camera. Optionally you can provide a
   * focal point (in screen coordinates) and it will keep that point at the same screen position while
   * zooming instead of zooming straight to the center of the viewport
   * @param zoom the new zoom factor
   * @param centroid a screen coordinate position which should remain visually stable during the zoom
   */
  setZoom = (
    zoom: number,
    {
      origin = 'direct',
      centroid,
      gestureComplete = true,
    }: {
      centroid?: Vector2;
      origin?: ViewportEventOrigin;
      gestureComplete?: boolean;
    } = {},
  ) => {
    // the pan position is also updated to keep the focal point in the same screen position
    if (centroid) {
      // the objective is to keep the focal point at the same logical position onscreen -
      // i.e. if your mouse is the focal point and it's hovering over an avatar, that avatar
      // should remain under your mouse as you zoom in!

      // start out by recording the world position of the focal point before zoom
      const priorFocalWorldPoint = this.viewportToWorld(centroid);
      // then apply the zoom
      this._zoom = clamp(zoom, this.zoomMin, this.zoomMax);
      // now determine the difference, in screen pixels, between the old focal point
      // and the world point it used to be "over"
      const priorFocalScreenPoint = this.worldToViewport(priorFocalWorldPoint);
      const screenDifference = subtractVectors(priorFocalScreenPoint, centroid);
      // convert that difference to world units and apply it as a relative pan
      this.relativePan(this.viewportDeltaToWorld(screenDifference), {
        origin,
        gestureComplete,
      });
    } else {
      this._zoom = clamp(zoom, this.zoomMin, this.zoomMax);
      // apply a pan with the current pan position to recalculate pan
      // boundaries from the new zoom and enforce them
      this.pan(this.center, { origin, gestureComplete });
    }
    this.emit('zoomChanged', this.zoom, origin);
    if (gestureComplete) {
      this.emit('zoomSettled', this.zoom, origin);
    }
  };

  /**
   * Adjusts the zoom of the viewport camera relative to the current value. See doZoom
   * for details on parameters.
   */
  relativeZoom = (
    zoomDelta: number,
    details: {
      origin?: ViewportEventOrigin;
      centroid?: Vector2;
      gestureComplete?: boolean;
    },
  ) => {
    this.setZoom(this.zoom + zoomDelta, details);
  };

  /**
   * Pans the camera across the canvas to reach a target center point.
   * The coordinates accepted are in "world" units!
   * To convert from screen pixels (like mouse position), use .viewportToWorld before
   * passing in your position.
   *
   * @param {Vector2} worldPosition the position in world coordinates to pan to
   */
  pan = (
    worldPosition: Vector2,
    {
      origin = 'direct',
      gestureComplete = true,
    }: { origin?: ViewportEventOrigin; gestureComplete?: boolean } = {},
  ) => {
    this._center = this.clampPanPosition(worldPosition);
    this.emit('centerChanged', this.center, origin);
    if (gestureComplete) {
      this.emit('centerSettled', this.center, origin);
    }
    if (origin === 'direct' || origin === 'control') {
      this._hasGesturePanned = true;
    }
  };

  /**
   * Pans the camera around the canvas using displacement relative to the current
   * center position, in "world" units. To convert a displacement from screen pixels
   * (like mouse position delta), use .viewportDeltaToWorld.
   *
   * See doPan for details on parameters.
   */
  relativePan = (
    worldDelta: Vector2,
    details?: { origin?: ViewportEventOrigin; gestureComplete?: boolean },
  ) => {
    this.pan(addVectors(this.center, worldDelta), details);
  };

  /**
   * Pans and zooms at the same time - a convenience shortcut to
   * zoom while moving the camera to a certain point. Both values
   * are absolute - see .doZoom and .doPan for more details on behavior
   * and parameters.
   */
  move = (
    worldPosition: Vector2,
    zoom: number,
    info: { origin?: ViewportEventOrigin; gestureComplete?: boolean } = {},
  ) => {
    this.setZoom(zoom, info);
    this.pan(worldPosition, info);
  };

  private reconstrainPosition = (info?: { origin?: ViewportEventOrigin }) =>
    this.move(this.center, this.zoom, info);

  /**
   * Does the best it can to fit the provided area onscreen.
   * Area is in world units.
   */
  fitOnScreen = (
    bounds: Box,
    {
      origin = 'control',
      margin = 10,
    }: { origin?: ViewportEventOrigin; margin?: number } = {},
  ) => {
    const width = bounds.width;
    const height = bounds.height;
    const zoom = Math.min(
      this.rootSize.width / (width + margin),
      this.rootSize.height / (height + margin),
    );
    const center = {
      x: bounds.x + width / 2,
      y: bounds.y + height / 2,
    };
    this.move(center, zoom, { origin });
  };

  fitEverythingOnScreen = (options?: {
    margin?: number;
    origin?: ViewportEventOrigin;
  }) => {
    const panLimits = this.panLimits;
    if (!panLimits) {
      return;
    }

    return this.fitOnScreen(
      {
        x: panLimits.min.x,
        y: panLimits.min.y,
        width: panLimits.max.x - panLimits.min.x,
        height: panLimits.max.y - panLimits.min.y,
      },
      options,
    );
  };
}
