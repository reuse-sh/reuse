import {
  type Annotation,
  annotationsToHtml,
  parseAnnotations,
  serializeAnnotations,
} from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";
import { Avatar } from "@reuse-sh/avatars/react";
import { photos } from "../../lib/photos";
import { CodeBlock } from "../shell/code-block";
import { ProofEditor } from "./annotations-islands";
import { basicCode } from "./basic-code";
import { C, CodePair, ExampleCode, Keys, Section, Text } from "./parts";

const proof = photos[1];

const review: Annotation[] = [
  { kind: "area", box: [7, 10, 30, 32], label: "Bands too tight" },
  { kind: "spotlight", box: [56, 50, 28, 32] },
  { kind: "arrow", line: [38, 82, 54, 68] },
  { kind: "line", line: [8, 90, 44, 90] },
  {
    kind: "pointer",
    point: [76, 24],
    label: "Keep this orange",
    side: "auto",
  },
  {
    kind: "marker",
    point: [24, 60],
    text: "Lift the <strong>blue</strong> one step",
  },
];

export function AnnotationsReviewNotes() {
  const [js, react] = basicCode.reviewNotes;
  return (
    <>
      <article className="x-review">
        <header className="x-review-head">
          <Avatar name="Aiko Tanaka" src={photos[3].src} size={32} />
          <p className="x-review-meta">
            <span>
              <b>Aiko Tanaka</b> reviewed proof 3 of {proof.caption}
            </span>
            <small>Six notes · Tuesday 14:10</small>
          </p>
        </header>
        <AnnotatedImage
          className="x-annot"
          src={proof.src}
          alt={`${proof.alt}, with six review notes`}
          width={proof.width}
          height={proof.height}
          annotations={review}
        />
      </article>
      <ExampleCode js={js} react={react} />
    </>
  );
}

export function AnnotationsEditor() {
  const [js, react] = basicCode.editor;
  return (
    <>
      <ProofEditor />
      <Keys>
        <kbd>⌘Z</kbd> undoes and <kbd>⇧⌘Z</kbd> redoes while the image has
        focus. Arrow keys move the selected mark.
      </Keys>
      <ExampleCode js={js} react={react} />
    </>
  );
}

const sample: Annotation[] = [
  { kind: "area", box: [8, 12, 30, 34], label: "Bands too tight" },
  { kind: "pointer", point: [74, 24], label: "Keep this orange", side: "auto" },
  { kind: "marker", point: [24, 62], text: "Lift the <strong>blue</strong>" },
];

function documentJson(value: Annotation[]) {
  const parsed = JSON.parse(serializeAnnotations(value)) as {
    version: number;
    annotations: unknown[];
  };
  const rows = parsed.annotations.map((item) => JSON.stringify(item));
  return `{\n  "version": ${parsed.version},\n  "annotations": [\n    ${rows.join(",\n    ")}\n  ]\n}`;
}

function listHtml(value: Annotation[]) {
  return annotationsToHtml(value)
    .replaceAll("<li", "\n  <li")
    .replace("</ol>", "\n</ol>");
}

const inputs = [
  ["{ version: 2, annotations: [] }", { version: 2, annotations: [] }],
  ['"{ not json"', "{ not json"],
  ["42", 42],
  ['[{ kind: "area", box: [10, 20] }]', [{ kind: "area", box: [10, 20] }]],
  [
    '[{ kind: "pointer", point: [50, 50] }]',
    [{ kind: "pointer", point: [50, 50] }],
  ],
  [
    '[{ kind: "area", box: [-5, 20, 140, 30], label: "Edge" }]',
    [{ kind: "area", box: [-5, 20, 140, 30], label: "Edge" }],
  ],
  [
    '[{ kind: "marker", point: [40, 40], text: "<b onclick=…>Lift</b> it" }]',
    [
      {
        kind: "marker",
        point: [40, 40],
        text: '<b onclick="steal()">Lift</b> it',
      },
    ],
  ],
] as const;

function outcome(value: unknown) {
  try {
    return JSON.stringify(parseAnnotations(value));
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    return error instanceof SyntaxError
      ? "throws SyntaxError"
      : `throws ${error.name}: ${error.message}`;
  }
}

export function AnnotationsDataFormat() {
  const [js, react] = basicCode.dataFormat;
  return (
    <>
      <Section title="The document">
        <Text>
          <C>serializeAnnotations</C> writes one JSON document with a version
          and a list. Store it as it is. This one is the package's own output
          for three marks.
        </Text>
        <CodeBlock tabs={{ code: documentJson(sample), lang: "json" }} />
      </Section>
      <Section title="Coordinates">
        <Text>
          Every number is a percentage of the image, from 0 to 100, rounded to
          one decimal. A <C>box</C> is left, top, width and height. A{" "}
          <C>line</C> runs from x1, y1 to x2, y2, and an arrow points at its
          second end. A <C>point</C> is x and y. Because nothing is in pixels,
          the same document fits a thumbnail and a full-width image.
        </Text>
      </Section>
      <Section title="HTML transport">
        <Text>
          <C>annotationsToHtml</C> writes the marks as an ordered list, which
          survives a rich text editor, a CMS field or an email.{" "}
          <C>annotationsFromHtml</C> reads them back. Marker text keeps only{" "}
          <C>strong</C>, <C>em</C> and <C>code</C>.
        </Text>
        <CodeBlock tabs={{ code: listHtml(sample), lang: "html" }} />
      </Section>
      <Section title="Validation">
        <Text>
          <C>parseAnnotations</C> throws when the whole document is wrong, and
          drops single marks it cannot read. Out-of-range numbers are clamped.
          Each result below is what the package returns for that input.
        </Text>
        <div className="d-api x-cases">
          <table>
            <thead>
              <tr>
                <th scope="col">Input</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {inputs.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row">
                    <code className="x-case">{label}</code>
                  </th>
                  <td>
                    <code className="x-case x-case-out">{outcome(value)}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="In code">
        <CodePair js={js} react={react} />
      </Section>
    </>
  );
}
