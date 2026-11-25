type Capture = {
  setPointerCapture(element: Element): void;
  hasPointerCapture(element: Element): boolean;
  releasePointerCapture(element: Element): void;
};

const methods = [
  "setPointerCapture",
  "hasPointerCapture",
  "releasePointerCapture",
] as const;

export function dispatchWithCapture(
  event: Event,
  path: Element[],
  pointerId: number,
  capture: Capture,
) {
  const restore: (() => void)[] = [];
  try {
    for (const element of path) {
      for (const name of methods) {
        const own = Object.getOwnPropertyDescriptor(element, name);
        const native = element[name];
        Object.defineProperty(element, name, {
          configurable: true,
          writable: true,
          value(this: Element, id: number) {
            return id === pointerId
              ? capture[name](this)
              : native && Reflect.apply(native, this, [id]);
          },
        });
        restore.push(() => {
          if (own) Object.defineProperty(element, name, own);
          else Reflect.deleteProperty(element, name);
        });
      }
    }
    path[0].dispatchEvent(event);
  } finally {
    for (const reset of restore.reverse()) reset();
  }
}
