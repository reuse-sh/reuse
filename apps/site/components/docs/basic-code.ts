/* Code shown under the examples and guides of the smaller libraries, as [JavaScript, React]. */

export const basicCode: Record<string, readonly [string, string]> = {
  reviewNotes: [
    `import { createAnnotatedImage, parseAnnotations } from "@reuse-sh/annotations";
import "@reuse-sh/annotations/styles.css";

// The review comes from storage as a version 1 document.
const annotations = parseAnnotations(await loadReview("proof-3"));
const proof = createAnnotatedImage(document.querySelector(".proof"), {
  src: "/prints/mint-and-ember.jpg",
  alt: "A marble print in mint, blue and orange",
  width: 1600,
  height: 1200,
  annotations,
});`,
    `import { AnnotatedImage } from "@reuse-sh/annotations/react";
import "@reuse-sh/annotations/styles.css";

export function Proof({ review }) {
  return (
    <AnnotatedImage
      src="/prints/mint-and-ember.jpg"
      alt="A marble print in mint, blue and orange"
      width={1600}
      height={1200}
      annotations={review.annotations}
    />
  );
}`,
  ],
  editor: [
    `import { createAnnotationEditor, createAnnotatedImage } from "@reuse-sh/annotations";

const root = document.querySelector(".proof-editor");
const image = { src, alt, width: 1600, height: 1200 };
const renderer = createAnnotatedImage(root, { ...image, annotations: stored });
const editor = createAnnotationEditor(root, {
  annotations: stored,
  onChange(next) {
    renderer.update({ ...image, annotations: next });
    save(next);
  },
});

undoButton.onclick = () => editor.undo();
redoButton.onclick = () => editor.redo();`,
    `import { AnnotationEditor } from "@reuse-sh/annotations/react";
import { useState } from "react";

export function ProofEditor({ initial }) {
  const [annotations, setAnnotations] = useState(initial);
  return (
    <AnnotationEditor
      src="/prints/coral-sky.jpg"
      alt="A marble print in coral, sand and blue"
      width={1600}
      height={1200}
      annotations={annotations}
      onChange={setAnnotations}
    />
  );
}`,
  ],
  dataFormat: [
    `import {
  annotationsFromHtml,
  annotationsToHtml,
  parseAnnotations,
  serializeAnnotations,
} from "@reuse-sh/annotations";

// Load. An unknown version throws, invalid marks are dropped.
const marks = parseAnnotations(await db.get("proof-3"));

// Store
await db.put("proof-3", serializeAnnotations(marks));

// Send as HTML, for an editor or an email, and read it back.
const html = annotationsToHtml(marks);
const again = annotationsFromHtml(element);`,
    `import { parseAnnotations, serializeAnnotations } from "@reuse-sh/annotations";
import { AnnotationEditor } from "@reuse-sh/annotations/react";

export function StoredProof({ stored, onSave }) {
  const [annotations, setAnnotations] = useState(() => parseAnnotations(stored));
  return (
    <AnnotationEditor
      {...image}
      annotations={annotations}
      onChange={(next) => {
        setAnnotations(next);
        onSave(serializeAnnotations(next));
      }}
    />
  );
}`,
  ],
  team: [
    `import { createAvatar } from "@reuse-sh/avatars";
import "@reuse-sh/avatars/styles.css";

for (const member of members) {
  const slot = list.querySelector(\`[data-member="\${member.id}"] .avatar\`);
  createAvatar(slot, {
    name: member.name,
    src: member.photo,
    size: 36,
    badge: member.online ? { type: "dot", label: "Online" } : undefined,
  });
}`,
    `import { Avatar } from "@reuse-sh/avatars/react";
import "@reuse-sh/avatars/styles.css";

export function MemberRow({ member }) {
  return (
    <li>
      <Avatar
        name={member.name}
        src={member.photo}
        size={36}
        badge={member.online ? { type: "dot", label: "Online" } : undefined}
      />
      <span>{member.name}</span>
    </li>
  );
}`,
  ],
  stack: [
    `import { createAvatar, createAvatarGroup } from "@reuse-sh/avatars";
import "@reuse-sh/avatars/styles.css";

const people = document.querySelector(".people");
const shown = team.slice(0, 4);
const rest = team.length - shown.length;

shown.forEach((person, index) => {
  const slot = document.createElement("span");
  people.append(slot);
  createAvatar(slot, {
    name: person.name,
    src: person.photo,
    size: 48,
    badge: index === shown.length - 1 && rest > 0
      ? { type: "count", count: rest, label: \`and \${rest} more\` }
      : undefined,
  });
});

// Overlaps the avatars and cuts each one around the next.
createAvatarGroup(people, { overlap: 12 });`,
    `import { Avatar, AvatarGroup } from "@reuse-sh/avatars/react";
import "@reuse-sh/avatars/styles.css";

export function People({ team, shown = 4 }) {
  const rest = team.length - shown;
  return (
    <AvatarGroup overlap={12} role="group" aria-label={\`\${team.length} people\`}>
      {team.slice(0, shown).map((person, index) => (
        <Avatar
          key={person.id}
          name={person.name}
          src={person.photo}
          size={48}
          badge={rest > 0 && index === shown - 1
            ? { type: "count", count: rest, label: \`and \${rest} more\` }
            : undefined}
        />
      ))}
    </AvatarGroup>
  );
}`,
  ],
  chatReply: [
    `import { createThinkingDots } from "@reuse-sh/loaders";

const canvas = document.createElement("canvas");
bubble.replaceChildren(canvas);
const dots = createThinkingDots(canvas, { size: 22 });

const text = await fetchReply(question);
dots.destroy();
bubble.textContent = text;`,
    `import { ThinkingDots } from "@reuse-sh/loaders/react";

export function Reply({ text }) {
  return (
    <div className="bubble">
      {text ?? <ThinkingDots size={22} label="Writing a reply" />}
    </div>
  );
}`,
  ],
  figures: [
    `import { createThinkingDots, figureConfig, figureNames } from "@reuse-sh/loaders";

// figureNames lists all sixteen. figureConfig repeats one of them.
const dots = createThinkingDots(canvas, {
  size: 32,
  config: figureConfig("square-shuffle"),
});`,
    `import { figureConfig } from "@reuse-sh/loaders";
import { ThinkingDots } from "@reuse-sh/loaders/react";

const shuffle = figureConfig("square-shuffle");

export function Saving() {
  return <ThinkingDots size={32} config={shuffle} label="Saving" />;
}`,
  ],
  fadeEdge: [
    `import { createFadeEdge } from "@reuse-sh/gradients";

const strip = document.querySelector(".prints");
const fade = createFadeEdge(strip, { size: 64, curve: "smooth", mode: "scroll" });

// Change it later, or remove it with the strip.
fade.update({ mode: "fixed" });
fade.destroy();`,
    `import { createFadeEdge } from "@reuse-sh/gradients";
import { useEffect, useRef } from "react";

export function Prints({ prints, mode = "scroll" }) {
  const ref = useRef(null);
  useEffect(() => {
    const fade = createFadeEdge(ref.current, { size: 64, mode });
    return () => fade.destroy();
  }, [mode]);
  return <div ref={ref} className="prints">{prints.map(renderPrint)}</div>;
}`,
  ],
  imageCaption: [
    `import { easingGradient } from "@reuse-sh/gradients";

// <figure class="print">
//   <img src="/prints/blue-hour.jpg" alt="…" />
//   <figcaption>Blue hour</figcaption>
// </figure>
const caption = document.querySelector(".print figcaption");
caption.style.backgroundImage = easingGradient({
  to: "rgb(0 0 0 / 0.6)",
  direction: "to bottom",
});`,
    `import { easingGradient } from "@reuse-sh/gradients";

const scrim = easingGradient({ to: "rgb(0 0 0 / 0.6)", direction: "to bottom" });

export function Print({ src, alt, title }) {
  return (
    <figure className="print">
      <img src={src} alt={alt} />
      <figcaption style={{ backgroundImage: scrim }}>{title}</figcaption>
    </figure>
  );
}`,
  ],
  curves: [
    `import { easingGradient, easingStops } from "@reuse-sh/gradients";

const fade = easingGradient({
  from: "var(--surface)",
  to: "transparent",
  easing: [0.23, 1, 0.32, 1],
  stops: 16,
});

// Or take the samples and write the gradient yourself.
const stops = easingStops("ease-out", 8);`,
    `import { easingGradient } from "@reuse-sh/gradients";

const fade = easingGradient({
  from: "var(--surface)",
  to: "transparent",
  easing: [0.23, 1, 0.32, 1],
});

export function Fade() {
  return <div className="fade" style={{ backgroundImage: fade }} />;
}`,
  ],
  menu: [
    `import { createMovingHighlight } from "@reuse-sh/interactions";
import "@reuse-sh/interactions/styles.css";

// <div role="menu" class="file-menu">
//   <button role="menuitem" data-re-row>New print</button> …
// </div>
const highlight = createMovingHighlight(document.querySelector(".file-menu"));`,
    `import { MovingHighlight } from "@reuse-sh/interactions/react";

export function FileMenu({ items }) {
  return (
    <MovingHighlight role="menu" className="file-menu">
      {items.map((item) => (
        <button key={item.label} role="menuitem" data-re-row onClick={item.run}>
          {item.label}
          <kbd>{item.shortcut}</kbd>
        </button>
      ))}
    </MovingHighlight>
  );
}`,
  ],
  navigation: [
    `import { createMovingHighlight } from "@reuse-sh/interactions";

// The current page carries data-current. The highlight rests there
// and follows the pointer or focus while they are inside the list.
const nav = document.querySelector(".sidebar");
const highlight = createMovingHighlight(nav);`,
    `import { MovingHighlight } from "@reuse-sh/interactions/react";

export function Sidebar({ pages, current }) {
  return (
    <MovingHighlight className="sidebar">
      {pages.map((page) => (
        <a
          key={page.href}
          href={page.href}
          data-re-row
          data-current={page.href === current ? "" : undefined}
          aria-current={page.href === current ? "page" : undefined}
        >
          {page.label}
        </a>
      ))}
    </MovingHighlight>
  );
}`,
  ],
  tabs: [
    `import { createMovingHighlight } from "@reuse-sh/interactions";

const tabs = document.querySelector('[role="tablist"]');
// The selected fill moves only when aria-selected changes.
const selected = createMovingHighlight(tabs, {
  rowSelector: '[role="tab"]',
  selectedSelector: '[aria-selected="true"]',
  mode: "selected",
  className: "tab-selected",
});
// A lighter fill follows the pointer and never rests.
const hover = createMovingHighlight(tabs, {
  rowSelector: '[role="tab"]',
  selectedSelector: "[data-none]",
  className: "tab-hover",
});`,
    `import { createMovingHighlight } from "@reuse-sh/interactions";
import { useEffect, useRef } from "react";

export function Tabs({ tabs, selected, onSelect }) {
  const ref = useRef(null);
  useEffect(() => {
    const row = '[role="tab"]';
    const fill = createMovingHighlight(ref.current, {
      rowSelector: row, selectedSelector: '[aria-selected="true"]',
      mode: "selected", className: "tab-selected",
    });
    const hover = createMovingHighlight(ref.current, {
      rowSelector: row, selectedSelector: "[data-none]", className: "tab-hover",
    });
    return () => { hover.destroy(); fill.destroy(); };
  }, []);
  return (
    <div ref={ref} role="tablist">
      {tabs.map((tab) => (
        <button key={tab} role="tab" aria-selected={tab === selected} onClick={() => onSelect(tab)}>
          {tab}
        </button>
      ))}
    </div>
  );
}`,
  ],
  deleteFile: [
    `import { createHoldToConfirm } from "@reuse-sh/interactions";
import "@reuse-sh/interactions/styles.css";

const hold = createHoldToConfirm(card.querySelector(".delete"), {
  holdMs: 1200,
  onConfirm: async () => {
    await files.remove(file.id);
    card.replaceWith(deletedNotice(file));
  },
});`,
    `import { HoldToConfirmButton } from "@reuse-sh/interactions/react";

export function DeleteFile({ file, onDelete }) {
  return (
    <HoldToConfirmButton holdMs={1200} onConfirm={() => onDelete(file.id)}>
      Hold to delete
    </HoldToConfirmButton>
  );
}`,
  ],
  settings: [
    `import { createHoldToConfirm } from "@reuse-sh/interactions";

// Space or Enter holds too. Escape or releasing early cancels.
createHoldToConfirm(document.querySelector("#delete-workspace"), {
  holdMs: 2000,
  onConfirm: () => scheduleDeletion(workspace.id),
});`,
    `import { HoldToConfirmButton } from "@reuse-sh/interactions/react";

export function DangerRow({ workspace }) {
  return (
    <div className="settings-row">
      <div>
        <b>Delete workspace</b>
        <p>Removes every print, order and member.</p>
      </div>
      <HoldToConfirmButton holdMs={2000} onConfirm={() => scheduleDeletion(workspace.id)}>
        Hold to delete
      </HoldToConfirmButton>
    </div>
  );
}`,
  ],
  codeBlock: [
    `import { createCopyButton } from "@reuse-sh/interactions";
import "@reuse-sh/interactions/styles.css";

// <div class="code">
//   <pre><code>npm install @reuse-sh/interactions</code></pre>
//   <button class="copy" aria-label="Copy command"></button>
// </div>
const block = document.querySelector(".code");
const copy = createCopyButton(block.querySelector(".copy"), {
  getText: () => block.querySelector("code").textContent,
});`,
    `import { CopyButton } from "@reuse-sh/interactions/react";
import "@reuse-sh/interactions/styles.css";

export function Command({ command }) {
  return (
    <div className="code">
      <pre><code>{command}</code></pre>
      <CopyButton text={command} className="copy" aria-label="Copy command" />
    </div>
  );
}`,
  ],
  shareLink: [
    `import { createCopyButton } from "@reuse-sh/interactions";
import "@reuse-sh/interactions/styles.css";

// <input class="link" value="https://prints.example/coral-sky" readonly />
// <button class="copy-link">Copy link</button>
const input = document.querySelector(".link");
const copy = createCopyButton(document.querySelector(".copy-link"), {
  getText: () => input.value,
  onError: () => input.select(),
});`,
    `import { CopyButton } from "@reuse-sh/interactions/react";
import "@reuse-sh/interactions/styles.css";

export function ShareLink({ url }) {
  return (
    <div className="share">
      <input value={url} readOnly aria-label="Link to the print" />
      <CopyButton text={url}>Copy link</CopyButton>
    </div>
  );
}`,
  ],
};
