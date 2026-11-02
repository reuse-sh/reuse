import {
  annotationsToHtml,
  parseAnnotations,
  serializeAnnotations,
} from "@reuse-sh/annotations";

const initial = [
  { kind: "area", box: [8, 12, 30, 34], label: "Bands too tight" },
  { kind: "pointer", point: [74, 24], label: "Keep this orange", side: "auto" },
  { kind: "marker", point: [24, 62], text: "Lift the <strong>blue</strong>" },
];
const annotations = parseAnnotations(serializeAnnotations(initial));
const outputs = document.querySelectorAll(".re-example pre");
outputs[0].textContent = serializeAnnotations(annotations);
outputs[1].textContent = annotationsToHtml(annotations);
