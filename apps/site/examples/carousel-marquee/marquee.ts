import type { Carousel } from "@reuse-sh/carousel";

export function runMarquee(
  carousel: Carousel,
  strip: HTMLElement,
  { speed = 40, hoverSpeed = 10, easing = 300 } = {},
): () => void {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let driver: ReturnType<Carousel["take"]> | null = null;
  let position = 0;
  let current = 0;
  let target = speed;
  let frame = 0;
  let last = 0;
  let onScreen = true;
  let focused = false;
  let interrupted = false;

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const elapsed = last ? Math.min(now - last, 100) : 0;
    last = now;
    current += (target - current) * (1 - Math.exp(-elapsed / easing));
    position += (current * elapsed) / 1000;
    driver?.setPosition(position);
  };
  const update = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (reducedMotion.matches || focused) {
      driver?.release();
      driver = null;
    }
    if (
      reducedMotion.matches ||
      focused ||
      interrupted ||
      !onScreen ||
      document.hidden
    )
      return;
    if (!driver) {
      driver = carousel.take("marquee", {
        onInterrupt: () => {
          driver = null;
          interrupted = true;
          update();
        },
      });
      position = 0;
      current = 0;
    }
    frame = requestAnimationFrame(tick);
  };
  const settle = () => {
    driver = null;
    interrupted = false;
    update();
  };
  const wheel = (event: WheelEvent) => {
    if (!driver || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    driver.release();
    driver = null;
    interrupted = true;
    update();
  };
  const slow = (event: PointerEvent) => {
    if (event.pointerType === "mouse") target = hoverSpeed;
  };
  const resume = () => {
    target = speed;
  };
  const focus = () => {
    focused = strip.matches(":focus-visible");
    update();
  };
  const blur = () => {
    focused = false;
    update();
  };
  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    update();
  });

  observer.observe(strip);
  strip.addEventListener("re-carousel:settle", settle);
  strip.addEventListener("wheel", wheel, { passive: true });
  strip.addEventListener("pointerenter", slow);
  strip.addEventListener("pointerleave", resume);
  strip.addEventListener("focus", focus);
  strip.addEventListener("keyup", focus);
  strip.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", update);
  update();

  return () => {
    observer.disconnect();
    strip.removeEventListener("re-carousel:settle", settle);
    strip.removeEventListener("wheel", wheel);
    strip.removeEventListener("pointerenter", slow);
    strip.removeEventListener("pointerleave", resume);
    strip.removeEventListener("focus", focus);
    strip.removeEventListener("keyup", focus);
    strip.removeEventListener("blur", blur);
    document.removeEventListener("visibilitychange", update);
    reducedMotion.removeEventListener("change", update);
    cancelAnimationFrame(frame);
    driver?.release();
  };
}
