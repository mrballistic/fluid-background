/**
 * Polyfills for older browsers to ensure splash cursor compatibility
 */

/**
 * Install all necessary polyfills
 */
export function installPolyfills(): void {
  installRequestAnimationFramePolyfill();
  installPerformanceNowPolyfill();
  installAddEventListenerPolyfill();
  installArrayFromPolyfill();
  installObjectAssignPolyfill();
}

/**
 * RequestAnimationFrame polyfill for older browsers
 */
function installRequestAnimationFramePolyfill(): void {
  if (typeof window === 'undefined') return;

  if (!window.requestAnimationFrame) {
    let lastTime = 0;
    
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      const currTime = new Date().getTime();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const id = window.setTimeout(() => {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id: number): void => {
      clearTimeout(id);
    };
  }
}

/**
 * Performance.now() polyfill for older browsers
 */
function installPerformanceNowPolyfill(): void {
  if (typeof performance === 'undefined') {
    (window as any).performance = {};
  }

  if (!performance.now) {
    const startTime = Date.now();
    performance.now = (): number => {
      return Date.now() - startTime;
    };
  }
}

/**
 * AddEventListener polyfill for IE8 and older
 */
function installAddEventListenerPolyfill(): void {
  if (typeof window === 'undefined') return;

  if (!window.addEventListener && (window as any).attachEvent) {
    (window as any).addEventListener = function(
      type: string, 
      listener: EventListener, 
      useCapture?: boolean
    ): void {
      (this as any).attachEvent('on' + type, listener);
    };

    (window as any).removeEventListener = function(
      type: string, 
      listener: EventListener, 
      useCapture?: boolean
    ): void {
      (this as any).detachEvent('on' + type, listener);
    };
  }

  // Also add to Element prototype if needed
  if (typeof Element !== 'undefined' && !Element.prototype.addEventListener && (Element.prototype as any).attachEvent) {
    (Element.prototype as any).addEventListener = function(
      type: string, 
      listener: EventListener, 
      useCapture?: boolean
    ): void {
      (this as any).attachEvent('on' + type, listener);
    };

    (Element.prototype as any).removeEventListener = function(
      type: string, 
      listener: EventListener, 
      useCapture?: boolean
    ): void {
      (this as any).detachEvent('on' + type, listener);
    };
  }
}

/**
 * Array.from polyfill for older browsers
 */
function installArrayFromPolyfill(): void {
  if (!Array.from) {
    Array.from = function<T>(
      arrayLike: ArrayLike<T> | Iterable<T>,
      mapFn?: (v: T, k: number) => any,
      thisArg?: any
    ): any[] {
      const items = Object(arrayLike);
      const len = parseInt(items.length) || 0;
      const result = new Array(len);
      
      for (let i = 0; i < len; i++) {
        const value = items[i];
        result[i] = mapFn ? mapFn.call(thisArg, value, i) : value;
      }
      
      return result;
    };
  }
}

/**
 * Object.assign polyfill for older browsers
 */
function installObjectAssignPolyfill(): void {
  if (!Object.assign) {
    Object.assign = function(target: any, ...sources: any[]): any {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      const to = Object(target);

      for (let index = 0; index < sources.length; index++) {
        const nextSource = sources[index];

        if (nextSource != null) {
          for (const nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }

      return to;
    };
  }
}

/**
 * Get a cross-browser compatible requestAnimationFrame function
 */
export function getRequestAnimationFrame(): (callback: FrameRequestCallback) => number {
  if (typeof window === 'undefined') {
    return (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 16);
  }

  return window.requestAnimationFrame ||
         (window as any).webkitRequestAnimationFrame ||
         (window as any).mozRequestAnimationFrame ||
         (window as any).oRequestAnimationFrame ||
         (window as any).msRequestAnimationFrame ||
         ((callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 16));
}

/**
 * Get a cross-browser compatible cancelAnimationFrame function
 */
export function getCancelAnimationFrame(): (id: number) => void {
  if (typeof window === 'undefined') {
    return clearTimeout;
  }

  return window.cancelAnimationFrame ||
         (window as any).webkitCancelAnimationFrame ||
         (window as any).mozCancelAnimationFrame ||
         (window as any).oCancelAnimationFrame ||
         (window as any).msCancelAnimationFrame ||
         clearTimeout;
}

/**
 * Get cross-browser visibility API properties
 */
export function getVisibilityAPI(): {
  hidden: string;
  visibilityChange: string;
} {
  if (typeof document === 'undefined') {
    return { hidden: 'hidden', visibilityChange: 'visibilitychange' };
  }

  if (typeof document.hidden !== 'undefined') {
    return { hidden: 'hidden', visibilityChange: 'visibilitychange' };
  } else if (typeof (document as any).webkitHidden !== 'undefined') {
    return { hidden: 'webkitHidden', visibilityChange: 'webkitvisibilitychange' };
  } else if (typeof (document as any).mozHidden !== 'undefined') {
    return { hidden: 'mozHidden', visibilityChange: 'mozvisibilitychange' };
  } else if (typeof (document as any).msHidden !== 'undefined') {
    return { hidden: 'msHidden', visibilityChange: 'msvisibilitychange' };
  }

  // Fallback for very old browsers
  return { hidden: 'hidden', visibilityChange: 'visibilitychange' };
}

/**
 * Get device pixel ratio with fallback
 */
export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}