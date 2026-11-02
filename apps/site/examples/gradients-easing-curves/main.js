import { easingGradient, easingStops } from "@reuse-sh/gradients";

for (const swatch of document.querySelectorAll("[data-easing]")) {
  const easing = swatch.dataset.easing;
  swatch.style.backgroundImage = easingGradient({
    to: "#111",
    easing,
    direction: "to right",
  });
  swatch.previousElementSibling.querySelector("polyline").setAttribute(
    "points",
    easingStops(easing, 24)
      .map(
        ({ position, progress }) => `${position * 100},${100 - progress * 100}`,
      )
      .join(" "),
  );
}
