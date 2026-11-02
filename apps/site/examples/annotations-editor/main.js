import {
  createAnnotatedImage,
  createAnnotationEditor,
  serializeAnnotations,
} from "@reuse-sh/annotations";

const annotations = [
  {
    kind: "area",
    box: [10, 14, 30, 30],
    label: "Crop line",
  },
  {
    kind: "arrow",
    line: [70, 74, 52, 56],
  },
];
const root = document.querySelector(".re-example");
const options = {
  src: "https://reuse.sh/images/marble-lake.svg",
  alt: "A soft marble texture in coral, sand and blue",
  width: 1600,
  height: 1200,
};
const image = createAnnotatedImage(root.querySelector("[data-image]"), {
  ...options,
  annotations,
});
let current = annotations;
let selection = null;
const field = root.querySelector(".re-field");
const label = root.querySelector("[data-label]");
const side = root.querySelector(".re-side");
const position = side.querySelector("select");
const remove = root.querySelector('[data-action="delete"]');
const sync = () => {
  const mark = current[selection];
  field.hidden = !mark || !("label" in mark || mark.kind === "marker");
  label.value =
    mark?.kind === "marker"
      ? mark.text
      : mark && "label" in mark
        ? mark.label
        : "";
  side.hidden = mark?.kind !== "pointer";
  position.value = mark?.kind === "pointer" ? mark.side : "auto";
  remove.disabled = selection === null;
};
const editor = createAnnotationEditor(root.querySelector("[data-editor]"), {
  annotations,
  onChange: (next) => {
    current = next;
    image.update({
      ...options,
      annotations: next,
    });
    root.querySelector("[data-count]").textContent =
      `${next.length} ${next.length === 1 ? "mark" : "marks"}`;
    root.querySelector("[data-json]").textContent = serializeAnnotations(next);
    sync();
  },
  onSelectionChange: (next) => {
    selection = next;
    sync();
  },
  onToolChange: (tool) => {
    root.querySelectorAll("[data-tool]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.tool === tool));
    });
  },
});
const click = (event) => {
  const button = event.target.closest("button");
  if (!button || !root.contains(button)) return;
  if (button.dataset.tool) editor.setTool(button.dataset.tool);
  else if (button.dataset.action === "undo") editor.undo();
  else if (button.dataset.action === "redo") editor.redo();
  else if (button.dataset.action === "delete") editor.removeSelection();
};
const update = () => {
  const mark = current[selection];
  if (mark)
    editor.updateSelection(
      mark.kind === "marker"
        ? {
            text: label.value,
          }
        : {
            label: label.value,
          },
    );
};
const changeSide = () =>
  editor.updateSelection({
    side: position.value,
  });
root.addEventListener("click", click);
label.addEventListener("change", update);
position.addEventListener("change", changeSide);
root.querySelectorAll("button").forEach((button) => {
  button.disabled = false;
});
sync();
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  root.removeEventListener("click", click);
  label.removeEventListener("change", update);
  position.removeEventListener("change", changeSide);
  editor.destroy();
  image.destroy();
  root.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  window.removeEventListener("pagehide", cleanup);
});
