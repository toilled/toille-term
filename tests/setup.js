import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  window.scrollTo = vi.fn();
  const happyDOM = /** @type {any} */ (window).happyDOM;
  if (happyDOM?.settings?.fetch) {
    happyDOM.settings.fetch.interceptor = {
      beforeAsyncRequest: ({ request, window: win }) => {
        if (request.url.includes("localhost:3000")) {
          return new win.Response(
            JSON.stringify({ ok: true, leaderboard: [] }),
            {
              headers: { "content-type": "application/json" },
            },
          );
        }
      },
    };
  }
}

if (typeof globalThis.Path2D === "undefined") {
  class MockPath2D {
    _ops = [];
    moveTo(...xy) {
      this._ops.push(["moveTo", xy]);
    }
    lineTo(...xy) {
      this._ops.push(["lineTo", xy]);
    }
    closePath() {
      this._ops.push(["closePath", []]);
    }
    arc(...args) {
      this._ops.push(["arc", args]);
    }
    rect(...args) {
      this._ops.push(["rect", args]);
    }
  }
  globalThis.Path2D = /** @type {any} */ (MockPath2D);
}

if (typeof HTMLImageElement !== "undefined") {
  Object.defineProperty(HTMLImageElement.prototype, "src", {
    set(value) {
      this.setAttribute("src", value);
    },
    get() {
      return this.getAttribute("src") || "";
    },
    configurable: true,
  });
}

if (typeof HTMLCanvasElement !== "undefined") {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (contextId, ...args) {
    if (contextId === "2d") {
      const target = {
        canvas: this,
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray() })),
        measureText: vi.fn(() => ({ width: 0 })),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        lineCap: "butt",
        lineJoin: "miter",
        lineWidth: 1,
        strokeStyle: "#000000",
        fillStyle: "#000000",
        globalAlpha: 1,
        font: "10px sans-serif",
        textAlign: "left",
        textBaseline: "alphabetic",
        shadowColor: "transparent",
        shadowBlur: 0,
      };
      return new Proxy(target, {
        get(obj, prop) {
          if (prop in obj) return obj[prop];
          if (typeof prop === "string") {
            const fn = vi.fn();
            obj[prop] = fn;
            return fn;
          }
          return undefined;
        },
      });
    }
    return originalGetContext
      ? originalGetContext.call(this, contextId, ...args)
      : null;
  };
}

class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = "";
  /** @type {number[]} */
  thresholds = [];
}

globalThis.IntersectionObserver = /** @type {any} */ (IntersectionObserverMock);

vi.mock("@solidjs/testing-library", async (importOriginal) => {
  const actual = /** @type {any} */ (await importOriginal());
  const { flush } = await import("solid-js");

  let flushing = false;
  const withFlush =
    (fn) =>
    (...args) => {
      const res = fn(...args);
      if (!flushing) {
        flushing = true;
        try {
          flush();
        } finally {
          flushing = false;
        }
      }
      return res;
    };

  const wrappedRender = withFlush(actual.render);
  const wrappedFireEvent = withFlush(actual.fireEvent);

  for (const key of Object.keys(actual.fireEvent)) {
    const orig = actual.fireEvent[key];
    if (typeof orig === "function") {
      wrappedFireEvent[key] = withFlush(orig);
    }
  }

  return {
    ...actual,
    render: wrappedRender,
    fireEvent: wrappedFireEvent,
  };
});
