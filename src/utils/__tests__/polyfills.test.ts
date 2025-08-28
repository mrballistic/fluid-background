/**
 * Tests for browser polyfills
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  installPolyfills,
  getRequestAnimationFrame,
  getCancelAnimationFrame,
  getVisibilityAPI,
  getDevicePixelRatio,
} from '../polyfills';

describe('Polyfills', () => {
  let originalRAF: any;
  let originalCAF: any;
  let originalPerformance: any;
  let originalAddEventListener: any;
  let originalArrayFrom: any;
  let originalObjectAssign: any;

  beforeEach(() => {
    // Store original implementations
    originalRAF = window.requestAnimationFrame;
    originalCAF = window.cancelAnimationFrame;
    originalPerformance = global.performance;
    originalAddEventListener = window.addEventListener;
    originalArrayFrom = Array.from;
    originalObjectAssign = Object.assign;
  });

  afterEach(() => {
    // Restore original implementations
    window.requestAnimationFrame = originalRAF;
    window.cancelAnimationFrame = originalCAF;
    global.performance = originalPerformance;
    window.addEventListener = originalAddEventListener;
    Array.from = originalArrayFrom;
    Object.assign = originalObjectAssign;
  });

  describe('RequestAnimationFrame Polyfill', () => {
    it('should install requestAnimationFrame polyfill when missing', () => {
      delete (window as any).requestAnimationFrame;
      
      installPolyfills();
      
      expect(typeof window.requestAnimationFrame).toBe('function');
    });

    it('should install cancelAnimationFrame polyfill when missing', () => {
      delete (window as any).cancelAnimationFrame;
      
      installPolyfills();
      
      expect(typeof window.cancelAnimationFrame).toBe('function');
    });

    it('should not override existing requestAnimationFrame', () => {
      const mockRAF = vi.fn();
      window.requestAnimationFrame = mockRAF;
      
      installPolyfills();
      
      expect(window.requestAnimationFrame).toBe(mockRAF);
    });

    it('should call callback with timestamp in polyfill', () => {
      return new Promise<void>((resolve) => {
        delete (window as any).requestAnimationFrame;
        installPolyfills();
        
        const startTime = Date.now();
        window.requestAnimationFrame((timestamp) => {
          expect(typeof timestamp).toBe('number');
          expect(timestamp).toBeGreaterThanOrEqual(startTime);
          resolve();
        });
      });
    });

    it('should return a number ID from polyfill', () => {
      delete (window as any).requestAnimationFrame;
      installPolyfills();
      
      const id = window.requestAnimationFrame(() => {});
      expect(typeof id).toBe('number');
    });
  });

  describe('Performance.now Polyfill', () => {
    it('should install performance.now polyfill when missing', () => {
      delete (global as any).performance;
      
      installPolyfills();
      
      expect(typeof performance.now).toBe('function');
    });

    it('should create performance object when missing', () => {
      delete (global as any).performance;
      
      installPolyfills();
      
      expect(typeof performance).toBe('object');
      expect(typeof performance.now).toBe('function');
    });

    it('should return increasing timestamps', () => {
      delete (global as any).performance;
      installPolyfills();
      
      const time1 = performance.now();
      const time2 = performance.now();
      
      expect(time2).toBeGreaterThanOrEqual(time1);
    });

    it('should not override existing performance.now', () => {
      const mockNow = jest.fn(() => 12345);
      global.performance = { now: mockNow } as any;
      
      installPolyfills();
      
      expect(performance.now).toBe(mockNow);
    });
  });

  describe('AddEventListener Polyfill', () => {
    it('should install addEventListener polyfill for IE8', () => {
      delete (window as any).addEventListener;
      (window as any).attachEvent = vi.fn();
      
      installPolyfills();
      
      expect(typeof window.addEventListener).toBe('function');
    });

    it('should install removeEventListener polyfill for IE8', () => {
      delete (window as any).removeEventListener;
      (window as any).detachEvent = vi.fn();
      
      installPolyfills();
      
      expect(typeof window.removeEventListener).toBe('function');
    });

    it('should call attachEvent when using addEventListener polyfill', () => {
      const mockAttachEvent = vi.fn();
      delete (window as any).addEventListener;
      (window as any).attachEvent = mockAttachEvent;
      
      installPolyfills();
      
      const handler = () => {};
      window.addEventListener('click', handler);
      
      expect(mockAttachEvent).toHaveBeenCalledWith('onclick', handler);
    });

    it('should not override existing addEventListener', () => {
      const mockAddEventListener = vi.fn();
      window.addEventListener = mockAddEventListener;
      
      installPolyfills();
      
      expect(window.addEventListener).toBe(mockAddEventListener);
    });
  });

  describe('Array.from Polyfill', () => {
    it('should install Array.from polyfill when missing', () => {
      delete (Array as any).from;
      
      installPolyfills();
      
      expect(typeof Array.from).toBe('function');
    });

    it('should convert array-like objects to arrays', () => {
      delete (Array as any).from;
      installPolyfills();
      
      const arrayLike = { 0: 'a', 1: 'b', 2: 'c', length: 3 };
      const result = Array.from(arrayLike);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should support map function in polyfill', () => {
      delete (Array as any).from;
      installPolyfills();
      
      const arrayLike = { 0: 1, 1: 2, 2: 3, length: 3 };
      const result = Array.from(arrayLike, x => x * 2);
      
      expect(result).toEqual([2, 4, 6]);
    });

    it('should not override existing Array.from', () => {
      const mockArrayFrom = vi.fn();
      Array.from = mockArrayFrom;
      
      installPolyfills();
      
      expect(Array.from).toBe(mockArrayFrom);
    });
  });

  describe('Object.assign Polyfill', () => {
    it('should install Object.assign polyfill when missing', () => {
      delete (Object as any).assign;
      
      installPolyfills();
      
      expect(typeof Object.assign).toBe('function');
    });

    it('should merge objects correctly in polyfill', () => {
      delete (Object as any).assign;
      installPolyfills();
      
      const target = { a: 1 };
      const source1 = { b: 2 };
      const source2 = { c: 3 };
      
      const result = Object.assign(target, source1, source2);
      
      expect(result).toBe(target);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should throw error for null/undefined target', () => {
      delete (Object as any).assign;
      installPolyfills();
      
      expect(() => Object.assign(null, {})).toThrow();
      expect(() => Object.assign(undefined, {})).toThrow();
    });

    it('should not override existing Object.assign', () => {
      const mockObjectAssign = vi.fn();
      Object.assign = mockObjectAssign;
      
      installPolyfills();
      
      expect(Object.assign).toBe(mockObjectAssign);
    });
  });

  describe('Cross-browser Helper Functions', () => {
    describe('getRequestAnimationFrame', () => {
      it('should return native requestAnimationFrame when available', () => {
        const mockRAF = vi.fn();
        window.requestAnimationFrame = mockRAF;
        
        const raf = getRequestAnimationFrame();
        expect(raf).toBe(mockRAF);
      });

      it('should return webkit prefixed version when available', () => {
        delete (window as any).requestAnimationFrame;
        const mockWebkitRAF = vi.fn();
        (window as any).webkitRequestAnimationFrame = mockWebkitRAF;
        
        const raf = getRequestAnimationFrame();
        expect(raf).toBe(mockWebkitRAF);
      });

      it('should return setTimeout fallback when no RAF available', () => {
        delete (window as any).requestAnimationFrame;
        delete (window as any).webkitRequestAnimationFrame;
        delete (window as any).mozRequestAnimationFrame;
        delete (window as any).oRequestAnimationFrame;
        delete (window as any).msRequestAnimationFrame;
        
        const raf = getRequestAnimationFrame();
        expect(typeof raf).toBe('function');
        
        // Test that it calls the callback
        const callback = vi.fn();
        raf(callback);
        
        setTimeout(() => {
          expect(callback).toHaveBeenCalled();
        }, 20);
      });
    });

    describe('getCancelAnimationFrame', () => {
      it('should return native cancelAnimationFrame when available', () => {
        const mockCAF = vi.fn();
        window.cancelAnimationFrame = mockCAF;
        
        const caf = getCancelAnimationFrame();
        expect(caf).toBe(mockCAF);
      });

      it('should return clearTimeout fallback when no CAF available', () => {
        delete (window as any).cancelAnimationFrame;
        delete (window as any).webkitCancelAnimationFrame;
        delete (window as any).mozCancelAnimationFrame;
        delete (window as any).oCancelAnimationFrame;
        delete (window as any).msCancelAnimationFrame;
        
        const caf = getCancelAnimationFrame();
        expect(caf).toBe(clearTimeout);
      });
    });

    describe('getVisibilityAPI', () => {
      it('should return standard visibility API when available', () => {
        Object.defineProperty(document, 'hidden', {
          value: false,
          writable: true,
        });
        
        const api = getVisibilityAPI();
        expect(api.hidden).toBe('hidden');
        expect(api.visibilityChange).toBe('visibilitychange');
      });

      it('should return webkit prefixed API when available', () => {
        delete (document as any).hidden;
        Object.defineProperty(document, 'webkitHidden', {
          value: false,
          writable: true,
        });
        
        const api = getVisibilityAPI();
        expect(api.hidden).toBe('webkitHidden');
        expect(api.visibilityChange).toBe('webkitvisibilitychange');
      });

      it('should return fallback when no visibility API available', () => {
        delete (document as any).hidden;
        delete (document as any).webkitHidden;
        delete (document as any).mozHidden;
        delete (document as any).msHidden;
        
        const api = getVisibilityAPI();
        expect(api.hidden).toBe('hidden');
        expect(api.visibilityChange).toBe('visibilitychange');
      });
    });

    describe('getDevicePixelRatio', () => {
      it('should return window.devicePixelRatio when available', () => {
        Object.defineProperty(window, 'devicePixelRatio', {
          value: 2,
          writable: true,
        });
        
        const ratio = getDevicePixelRatio();
        expect(ratio).toBe(2);
      });

      it('should return 1 as fallback when devicePixelRatio not available', () => {
        delete (window as any).devicePixelRatio;
        
        const ratio = getDevicePixelRatio();
        expect(ratio).toBe(1);
      });
    });
  });
});