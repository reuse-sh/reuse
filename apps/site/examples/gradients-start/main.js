import { easingGradient } from "@reuse-sh/gradients";

for (const swatch of document.querySelectorAll("[data-easing]")) {
  swatch.style.backgroundImage = easingGradient({
    to: "#111",
    easing: swatch.dataset.easing,
    direction: "to right",
  });
}
