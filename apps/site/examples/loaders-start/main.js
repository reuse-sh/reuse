import { createThinkingDots, figureConfig } from "@reuse-sh/loaders";

const controllers = [];
for (const canvas of document.querySelectorAll("canvas[data-size]")) {
  const controller = createThinkingDots(canvas, {
    size: Number(canvas.dataset.size),
    ...(canvas.dataset.figure
      ? {
          config: figureConfig(canvas.dataset.figure),
        }
      : {}),
  });
  canvas.hidden = false;
  canvas.previousElementSibling.hidden = true;
  controllers.push(controller);
}
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  for (const controller of controllers) controller.destroy();
  window.removeEventListener("pagehide", cleanup);
});
