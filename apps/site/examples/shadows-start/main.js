const object = document.querySelector(".re-shadow-object");
const controls = document.querySelector(".re-shadow-levels");
const buttons = controls.querySelectorAll("button");
for (const button of buttons) button.disabled = false;
function select(event) {
  const button = event.target.closest("button");
  if (!button || !controls.contains(button)) return;
  const level = button.dataset.level;
  object.className = `re-shadow-object re-shadow-ring-${level}`;
  object.querySelector("span").textContent = `re-shadow-ring-${level}`;
  for (const item of buttons)
    item.setAttribute("aria-pressed", String(item === button));
}
controls.addEventListener("click", select);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controls.removeEventListener("click", select);
  window.removeEventListener("pagehide", cleanup);
});
