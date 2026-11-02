import {
  createAnnotatedImage,
  createAnnotationEditor,
  serializeAnnotations,
} from "@reuse-sh/annotations";

const root = document.querySelector(".re-example");
const shell = root.querySelector(".re-annotation-editor");
const section = shell.querySelector("section");
const initial = [
  { kind: "area", box: [10, 14, 30, 30], label: "Crop line" },
  { kind: "arrow", line: [70, 74, 52, 56] },
];
const options = {
  src: "https://reuse.sh/images/marble-lake.svg",
  alt: "A soft marble texture in coral, sand and blue, with editable marks",
  width: 1600,
  height: 1200,
};
const image = createAnnotatedImage(section.firstElementChild, {
  ...options,
  annotations: initial,
});
const toolbar = shell.querySelector("fieldset");
const buttons = [...toolbar.querySelectorAll("button")];
const tools = [
  "select",
  "area",
  "spotlight",
  "arrow",
  "line",
  "pointer",
  "marker",
];
const fields = document.createElement("div");
fields.className = "re-annotation-fields";
fields.hidden = true;
fields.innerHTML =
  '<label><span>Label</span><input maxlength="120"></label><label hidden>Label position<select><option value="auto">Automatic</option><option value="left">Left</option><option value="right">Right</option><option value="top">Above</option><option value="bottom">Below</option></select></label>';
section.after(fields);
const input = fields.querySelector("input");
const position = fields.querySelector("select");
let current = initial;
let selection = null;
const sync = () => {
  const mark = current[selection];
  fields.hidden = !mark || !["area", "pointer", "marker"].includes(mark.kind);
  fields.firstElementChild.firstElementChild.textContent =
    mark?.kind === "marker" ? "Marker text" : "Label";
  input.value =
    mark?.kind === "marker"
      ? mark.text
      : mark && "label" in mark
        ? mark.label
        : "";
  input.maxLength = mark?.kind === "marker" ? 300 : 120;
  position.parentElement.hidden = mark?.kind !== "pointer";
  position.value = mark?.kind === "pointer" ? mark.side : "auto";
  buttons[9].disabled = selection === null;
};
const syncTool = (tool) => {
  tools.forEach((name, index) => {
    buttons[index].setAttribute("aria-pressed", String(name === tool));
  });
};
const editor = createAnnotationEditor(section, {
  annotations: initial,
  onChange: (next) => {
    current = next;
    image.update({ ...options, annotations: next });
    root.querySelector(".re-saved-head span").textContent =
      next.length === 1 ? "1 mark" : `${next.length} marks`;
    root.querySelector(".re-saved-code code").textContent =
      serializeAnnotations(next);
    sync();
  },
  onSelectionChange: (next) => {
    selection = next;
    sync();
  },
  onToolChange: syncTool,
});
const click = (event) => {
  const button = event.target.closest("button");
  const index = buttons.indexOf(button);
  if (index < 0) return;
  if (index < tools.length) {
    editor.setTool(tools[index]);
    syncTool(tools[index]);
  } else if (index === 7) editor.undo();
  else if (index === 8) editor.redo();
  else editor.removeSelection();
};
const update = () => {
  const mark = current[selection];
  if (mark)
    editor.updateSelection(
      mark.kind === "marker" ? { text: input.value } : { label: input.value },
    );
};
const enter = (event) => {
  if (event.key === "Enter") input.blur();
};
const change = () => editor.updateSelection({ side: position.value });
toolbar.addEventListener("click", click);
input.addEventListener("blur", update);
input.addEventListener("keydown", enter);
position.addEventListener("change", change);
buttons.forEach((button) => {
  button.disabled = false;
});
sync();
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  toolbar.removeEventListener("click", click);
  input.removeEventListener("blur", update);
  input.removeEventListener("keydown", enter);
  position.removeEventListener("change", change);
  editor.destroy();
  image.destroy();
  fields.remove();
  buttons.forEach((button) => {
    button.disabled = true;
  });
  window.removeEventListener("pagehide", cleanup);
});
