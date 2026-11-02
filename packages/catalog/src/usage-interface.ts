import type { UsageRecipe } from "./usage-types.js";

export const interfaceUsage: Readonly<Record<string, UsageRecipe>> = {
  "floating-tooltip/getting-started": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "floating-tooltip-getting-started-package-styles",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Wrap one focusable trigger with FloatingTooltip, or place several data-re-tooltip triggers inside one FloatingTooltipGroup. The group shares a single moving popup.",
          },
          {
            kind: "code",
            id: "floating-tooltip-getting-started-react",
            language: "tsx",
            code: `"use client";

import { FloatingTooltip } from "@reuse-sh/interactions/react";

export function SaveAction() {
  return <FloatingTooltip content="Save changes">
    <button type="button">Save</button>
  </FloatingTooltip>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Use real buttons and links as triggers. Keyboard focus reveals the same hint and Escape dismisses it. Tooltips add descriptions, so essential names and actions must stay on the trigger. The React wrapper owns cleanup.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Put data-re-tooltip on focusable triggers inside the bound root. One createFloatingTooltip controller shares a moving popup across them.",
          },
          {
            kind: "code",
            id: "floating-tooltip-getting-started-markup",
            language: "html",
            code: `<div id="actions">
  <button type="button" data-re-tooltip="Save changes">Save</button>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "floating-tooltip-getting-started-css",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "floating-tooltip-getting-started-initialize",
            language: "javascript",
            code: `import { createFloatingTooltip } from "@reuse-sh/interactions";

const tooltip = createFloatingTooltip(document.querySelector("#actions"));`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Use real buttons and links as triggers. Keyboard focus reveals the same hint and Escape dismisses it. Tooltips add descriptions, so essential names and actions must stay on the trigger.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "floating-tooltip-getting-started-cleanup",
            language: "javascript",
            code: "tooltip.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "floating-tooltip/examples/shortcuts": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-shortcuts-package-styles",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Put related actions inside one tooltip group. Add the keyboard shortcut to the hint while keeping the button label understandable on its own.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-shortcuts-react",
            language: "tsx",
            code: `"use client";

import { FloatingTooltipGroup } from "@reuse-sh/interactions/react";

export function EditorActions() {
  return <FloatingTooltipGroup className="flex gap-2" side="bottom" delay={150}>
    <button type="button" data-re-tooltip="Bold · Command B" aria-keyshortcuts="Meta+B">Bold</button>
    <button type="button" data-re-tooltip="Italic · Command I" aria-keyshortcuts="Meta+I">Italic</button>
  </FloatingTooltipGroup>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "aria-keyshortcuts describes a shortcut; your editor must implement it. Use real buttons and links as triggers. Keyboard focus reveals the same hint and Escape dismisses it. Tooltips add descriptions, so essential names and actions must stay on the trigger. The React wrapper owns cleanup.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Put related actions inside one tooltip group. Add the keyboard shortcut to the hint while keeping the button label understandable on its own.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-shortcuts-markup",
            language: "html",
            code: `<div id="actions">
  <button type="button" data-re-tooltip="Bold · Command B" aria-keyshortcuts="Meta+B">Bold</button>
  <button type="button" data-re-tooltip="Italic · Command I" aria-keyshortcuts="Meta+I">Italic</button>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-shortcuts-css",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-shortcuts-initialize",
            language: "javascript",
            code: `import { createFloatingTooltip } from "@reuse-sh/interactions";

const tooltip = createFloatingTooltip(document.querySelector("#actions"), { side: "bottom", delay: 150 });`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "aria-keyshortcuts describes a shortcut; your editor must implement it. Use real buttons and links as triggers. Keyboard focus reveals the same hint and Escape dismisses it. Tooltips add descriptions, so essential names and actions must stay on the trigger.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-shortcuts-cleanup",
            language: "javascript",
            code: "tooltip.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "floating-tooltip/examples/links": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-links-package-styles",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Keep the native anchor and use the tooltip as a short destination preview. Track the pointer horizontally while anchoring vertically when the hint should remain below a line of links.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-links-react",
            language: "tsx",
            code: `"use client";

import { FloatingTooltipGroup } from "@reuse-sh/interactions/react";

export function ReferenceLinks() {
  return <FloatingTooltipGroup track={{ x: "pointer", y: "anchor" }} side="bottom">
    <a href="/prints" data-re-tooltip="Browse the print collection">Print collection</a>
  </FloatingTooltipGroup>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Links keep their destination and browser behavior with scripts disabled. Do not put interactive buttons inside a tooltip; use a popover or dialog when a preview needs actions. Use real buttons and links as triggers. Keyboard focus reveals the same hint and Escape dismisses it. Tooltips add descriptions, so essential names and actions must stay on the trigger. The React wrapper owns cleanup.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Keep the native anchor and use the tooltip as a short destination preview. Track the pointer horizontally while anchoring vertically when the hint should remain below a line of links.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-links-markup",
            language: "html",
            code: `<div id="links">
  <a href="/prints" data-re-tooltip="Browse the print collection">Print collection</a>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-links-css",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-links-initialize",
            language: "javascript",
            code: `import { createFloatingTooltip } from "@reuse-sh/interactions";

const tooltip = createFloatingTooltip(document.querySelector("#links"), {
  track: { x: "pointer", y: "anchor" }, side: "bottom",
});`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Links keep their destination and browser behavior with scripts disabled. Do not put interactive buttons inside a tooltip; use a popover or dialog when a preview needs actions. Use real buttons and links as triggers. Keyboard focus reveals the same hint and Escape dismisses it. Tooltips add descriptions, so essential names and actions must stay on the trigger.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-links-cleanup",
            language: "javascript",
            code: "tooltip.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "floating-tooltip/examples/people": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-people-package-styles",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use a template for a rich, read-only person preview. The tooltip clones its content, so the trigger remains a normal profile link.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-people-react",
            language: "tsx",
            code: `"use client";

import { FloatingTooltipGroup } from "@reuse-sh/interactions/react";

export function PersonLink() {
  return <FloatingTooltipGroup>
    <a href="/people/alex" data-re-tooltip-template="alex-preview">Alex Morgan</a>
    <template id="alex-preview">
      <div className="flex items-center gap-3 p-2">
        <img src="/images/alex.jpg" alt="" width="40" height="40" />
        <span>Alex Morgan<br />Print designer</span>
      </div>
    </template>
  </FloatingTooltipGroup>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Give each template a unique page ID. The template contains display content, not focusable controls; the profile link remains the way to reach the person. Use real buttons and links as triggers. Keyboard focus reveals the same hint and Escape dismisses it. Tooltips add descriptions, so essential names and actions must stay on the trigger. The React wrapper owns cleanup.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use a template for a rich, read-only person preview. The tooltip clones its content, so the trigger remains a normal profile link.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-people-markup",
            language: "html",
            code: `<div id="people">
  <a href="/people/alex" data-re-tooltip-template="alex-preview">Alex Morgan</a>
</div>
<template id="alex-preview">
  <div><img src="/images/alex.jpg" alt="" width="40" height="40" /><strong>Alex Morgan</strong><p>Print designer</p></div>
</template>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-people-css",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-people-initialize",
            language: "javascript",
            code: `import { createFloatingTooltip } from "@reuse-sh/interactions";

const tooltip = createFloatingTooltip(document.querySelector("#people"));`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Give each template a unique page ID. The template contains display content, not focusable controls; the profile link remains the way to reach the person. Use real buttons and links as triggers. Keyboard focus reveals the same hint and Escape dismisses it. Tooltips add descriptions, so essential names and actions must stay on the trigger.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "floating-tooltip-examples-people-cleanup",
            language: "javascript",
            code: "tooltip.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "moving-highlight/getting-started": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "moving-highlight-getting-started-package-styles",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Mark each interactive row with data-re-row. MovingHighlight follows the pointer and keyboard focus and rests on the row marked data-current.",
          },
          {
            kind: "code",
            id: "moving-highlight-getting-started-react",
            language: "tsx",
            code: `"use client";

import { MovingHighlight } from "@reuse-sh/interactions/react";

export function Navigation() {
  return <MovingHighlight className="flex flex-col gap-1">
    <a className="rounded-lg p-2" data-re-row data-current href="/inbox" aria-current="page">Inbox</a>
    <a className="rounded-lg p-2" data-re-row href="/archive">Archive</a>
  </MovingHighlight>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Moving highlight adds a background and measures existing rows. It does not implement menu or tab keyboard behavior. Keep native focusable elements, a visible focus outline and the correct interaction model for your navigation. Reduced motion snaps instead of sliding. The React wrapper destroys its background on unmount.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Mark each interactive row with data-re-row. MovingHighlight follows the pointer and keyboard focus and rests on the row marked data-current.",
          },
          {
            kind: "code",
            id: "moving-highlight-getting-started-markup",
            language: "html",
            code: `<nav id="navigation" aria-label="Workspace">
  <a data-re-row data-current href="/inbox" aria-current="page">Inbox</a>
  <a data-re-row href="/archive">Archive</a>
</nav>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "moving-highlight-getting-started-css",
            language: "css",
            code: `@import "@reuse-sh/interactions/styles.css";

#navigation { display: grid; gap: 0.25rem; }
#navigation a { padding: 0.5rem; border-radius: 0.5rem; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "moving-highlight-getting-started-initialize",
            language: "javascript",
            code: `import { createMovingHighlight } from "@reuse-sh/interactions";

const highlight = createMovingHighlight(document.querySelector("#navigation"));`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Moving highlight adds a background and measures existing rows. It does not implement menu or tab keyboard behavior. Keep native focusable elements, a visible focus outline and the correct interaction model for your navigation. Reduced motion snaps instead of sliding.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "moving-highlight-getting-started-cleanup",
            language: "javascript",
            code: "highlight.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "moving-highlight/examples/menu": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-menu-package-styles",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Keep menu actions as real buttons and own their keyboard focus in the application. MovingHighlight supplies the background while the menu handles ArrowUp, ArrowDown, Home, End and Escape.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-menu-react",
            language: "tsx",
            code: `"use client";

import { MovingHighlight } from "@reuse-sh/interactions/react";

export function FileActions({ onRename, onDuplicate, onClose }: { onRename: () => void; onDuplicate: () => void; onClose: () => void }) {
  return <MovingHighlight className="grid gap-1" role="menu" aria-label="File actions" onKeyDown={(event) => {
    if (event.key === "Escape") { onClose(); return; }
    const rows = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-re-row]"));
    const current = rows.indexOf(document.activeElement as HTMLButtonElement);
    const index = event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : event.key === "ArrowDown" ? (current + 1) % rows.length : event.key === "ArrowUp" ? (current - 1 + rows.length) % rows.length : -1;
    if (index < 0) return;
    event.preventDefault();
    rows.forEach((row, position) => { row.tabIndex = position === index ? 0 : -1; });
    rows[index]?.focus();
  }}>
    <button className="rounded-lg p-2 text-left" data-re-row role="menuitem" type="button" onClick={onRename}>Rename</button>
    <button className="rounded-lg p-2 text-left" data-re-row role="menuitem" tabIndex={-1} type="button" onClick={onDuplicate}>Duplicate</button>
  </MovingHighlight>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "When a menu closes, its host restores focus to the opening control. Connect onClose to that host in React; the native example restores its own opener. Moving highlight adds a background and measures existing rows. It does not implement menu or tab keyboard behavior. Keep native focusable elements, a visible focus outline and the correct interaction model for your navigation. Reduced motion snaps instead of sliding.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Keep menu actions as real buttons and own their keyboard focus in the application. MovingHighlight supplies the background while the menu handles ArrowUp, ArrowDown, Home, End and Escape.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-menu-markup",
            language: "html",
            code: `<button id="menu-trigger" type="button" aria-controls="file-actions" aria-expanded="false" hidden>File actions</button>
<div id="file-actions" role="menu" aria-label="File actions">
  <button data-re-row role="menuitem" type="button">Rename</button>
  <button data-re-row role="menuitem" type="button" tabindex="-1">Duplicate</button>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-menu-css",
            language: "css",
            code: `@import "@reuse-sh/interactions/styles.css";

#file-actions:not([hidden]) { display: grid; gap: 0.25rem; }
#file-actions button { padding: 0.5rem; text-align: start; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-menu-initialize",
            language: "javascript",
            code: `import { createMovingHighlight } from "@reuse-sh/interactions";

const root = document.querySelector("#file-actions");
const trigger = document.querySelector("#menu-trigger");
const rows = Array.from(root.querySelectorAll("[data-re-row]"));
const highlight = createMovingHighlight(root);
const close = () => { root.hidden = true; trigger.setAttribute("aria-expanded", "false"); trigger.focus(); };
const open = () => { root.hidden = false; trigger.setAttribute("aria-expanded", "true"); rows[0].focus(); };
const keydown = (event) => {
  if (event.key === "Escape") { close(); return; }
  const current = rows.indexOf(document.activeElement);
  const index = event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : event.key === "ArrowDown" ? (current + 1) % rows.length : event.key === "ArrowUp" ? (current - 1 + rows.length) % rows.length : -1;
  if (index < 0) return;
  event.preventDefault();
  rows.forEach((row, position) => { row.tabIndex = position === index ? 0 : -1; });
  rows[index].focus();
};
trigger.addEventListener("click", open);
root.addEventListener("keydown", keydown);
root.hidden = true;
trigger.hidden = false;`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "When a menu closes, its host restores focus to the opening control. Connect onClose to that host in React; the native example restores its own opener. Moving highlight adds a background and measures existing rows. It does not implement menu or tab keyboard behavior. Keep native focusable elements, a visible focus outline and the correct interaction model for your navigation. Reduced motion snaps instead of sliding.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-menu-cleanup",
            language: "javascript",
            code: `trigger.removeEventListener("click", open);
root.removeEventListener("keydown", keydown);
highlight.destroy();
trigger.hidden = true;
root.hidden = false;`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "moving-highlight/examples/navigation": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-navigation-package-styles",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use data-current for the page that owns the current URL and aria-current for its accessible meaning. The background returns there when the pointer leaves.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-navigation-react",
            language: "tsx",
            code: `"use client";

import { MovingHighlight } from "@reuse-sh/interactions/react";

export function WorkspaceNavigation({ current }: { current: "inbox" | "archive" }) {
  return <nav aria-label="Workspace"><MovingHighlight className="grid gap-1">
    <a className="rounded-lg p-2" data-re-row data-current={current === "inbox" ? "" : undefined} aria-current={current === "inbox" ? "page" : undefined} href="/inbox">Inbox</a>
    <a className="rounded-lg p-2" data-re-row data-current={current === "archive" ? "" : undefined} aria-current={current === "archive" ? "page" : undefined} href="/archive">Archive</a>
  </MovingHighlight></nav>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Let your router own the current page. Updating data-current updates the resting position, and the controller follows resized rows without a new instance. Moving highlight adds a background and measures existing rows. It does not implement menu or tab keyboard behavior. Keep native focusable elements, a visible focus outline and the correct interaction model for your navigation. Reduced motion snaps instead of sliding.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use data-current for the page that owns the current URL and aria-current for its accessible meaning. The background returns there when the pointer leaves.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-navigation-markup",
            language: "html",
            code: `<nav id="navigation" aria-label="Workspace">
  <a data-re-row data-current aria-current="page" href="/inbox">Inbox</a>
  <a data-re-row href="/archive">Archive</a>
</nav>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-navigation-css",
            language: "css",
            code: `@import "@reuse-sh/interactions/styles.css";

#navigation { display: grid; }
#navigation a { padding: 0.5rem; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-navigation-initialize",
            language: "javascript",
            code: `import { createMovingHighlight } from "@reuse-sh/interactions";

const highlight = createMovingHighlight(document.querySelector("#navigation"));`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Let your router own the current page. Updating data-current updates the resting position, and the controller follows resized rows without a new instance. Moving highlight adds a background and measures existing rows. It does not implement menu or tab keyboard behavior. Keep native focusable elements, a visible focus outline and the correct interaction model for your navigation. Reduced motion snaps instead of sliding.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-navigation-cleanup",
            language: "javascript",
            code: "highlight.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "moving-highlight/examples/tabs": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-tabs-package-styles",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Keep selected and hovered backgrounds independent by nesting two MovingHighlight wrappers around the same tab rows. Use mode selected for the committed tab and hover mode for the lighter preview.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-tabs-react",
            language: "tsx",
            code: `"use client";

import { useState } from "react";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import "./tabs.css";

export function ProjectTabs() {
  const [tab, setTab] = useState("files");
  return <>
    <MovingHighlight mode="selected" highlightClassName="re-tab-selected">
      <MovingHighlight mode="hover" highlightClassName="re-tab-hover" role="tablist" aria-label="Project" className="flex gap-2">
        {(["files", "activity"] as const).map((name, index) => (
          <button key={name} id={\`tab-\${name}\`} type="button" role="tab" data-re-row aria-selected={tab === name} aria-controls={\`panel-\${name}\`} tabIndex={tab === name ? 0 : -1} className="rounded-lg px-3 py-2" onClick={() => setTab(name)} onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === "Home" ? "files" : event.key === "End" ? "activity" : index === 0 ? "activity" : "files";
            setTab(next);
            document.getElementById(\`tab-\${next}\`)?.focus();
          }}>{name === "files" ? "Files" : "Activity"}</button>
        ))}
      </MovingHighlight>
    </MovingHighlight>
    <section id="panel-files" role="tabpanel" aria-labelledby="tab-files" hidden={tab !== "files"} tabIndex={0}>Project files</section>
    <section id="panel-activity" role="tabpanel" aria-labelledby="tab-activity" hidden={tab !== "activity"} tabIndex={0}>Recent activity</section>
  </>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Put these two highlight colors in tabs.css. Selected and hover backgrounds stay independent.",
          },
          {
            kind: "code",
            id: "tabs-react-css",
            language: "css",
            code: `.re-tab-selected { --re-highlight-background: rgb(0 0 0 / 8%); }
.re-tab-hover { --re-highlight-background: rgb(0 0 0 / 3%); }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Both examples own local panels and arrow-key focus. Keep panel IDs unique if several tab groups share a page. Native panels remain visible without scripts; initialization reveals the tab controls and selects one panel.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Keep selected and hovered backgrounds independent with two createMovingHighlight controllers on the same tab rows. Use mode selected for the committed tab and hover mode for the lighter preview.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-tabs-markup",
            language: "html",
            code: `<div id="project-tabs" role="tablist" aria-label="Project" hidden>
  <button id="tab-files" data-re-row type="button" role="tab" aria-selected="true" aria-controls="panel-files">Files</button>
  <button id="tab-activity" data-re-row type="button" role="tab" aria-selected="false" aria-controls="panel-activity" tabindex="-1">Activity</button>
</div>
<section id="panel-files" role="tabpanel" aria-labelledby="tab-files" tabindex="0">Project files</section>
<section id="panel-activity" role="tabpanel" aria-labelledby="tab-activity" tabindex="0">Recent activity</section>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-tabs-css",
            language: "css",
            code: `@import "@reuse-sh/interactions/styles.css";

.re-tab-selected { --re-highlight-background: rgb(0 0 0 / 8%); }
.re-tab-hover { --re-highlight-background: rgb(0 0 0 / 3%); }
#project-tabs:not([hidden]) { display: flex; gap: 0.5rem; }
#project-tabs a { padding: 0.5rem 0.75rem; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-tabs-initialize",
            language: "javascript",
            code: `import { createMovingHighlight } from "@reuse-sh/interactions";

const root = document.querySelector("#project-tabs");
const selected = createMovingHighlight(root, { mode: "selected", className: "re-tab-selected" });
const hover = createMovingHighlight(root, { mode: "hover", className: "re-tab-hover" });
const rows = Array.from(root.querySelectorAll('[role="tab"]'));
const select = (index) => {
  rows.forEach((row, position) => {
    row.setAttribute("aria-selected", String(position === index));
    row.tabIndex = position === index ? 0 : -1;
    document.getElementById(row.getAttribute("aria-controls")).hidden = position !== index;
  });
};
const click = (event) => {
  const index = rows.indexOf(event.target.closest('[role="tab"]'));
  if (index >= 0) select(index);
};
const keydown = (event) => {
  const current = rows.indexOf(document.activeElement);
  const index = event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : event.key === "ArrowRight" ? (current + 1) % rows.length : event.key === "ArrowLeft" ? (current - 1 + rows.length) % rows.length : -1;
  if (index < 0) return;
  event.preventDefault();
  select(index);
  rows[index].focus();
};
root.addEventListener("click", click);
root.addEventListener("keydown", keydown);
root.hidden = false;
select(0);`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Both examples own local panels and arrow-key focus. Keep panel IDs unique if several tab groups share a page. Native panels remain visible without scripts; initialization reveals the tab controls and selects one panel.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "moving-highlight-examples-tabs-cleanup",
            language: "javascript",
            code: `root.removeEventListener("click", click);
root.removeEventListener("keydown", keydown);
hover.destroy();
selected.destroy();
root.hidden = true;
rows.forEach((row) => { document.getElementById(row.getAttribute("aria-controls")).hidden = false; });`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "hold-to-confirm/getting-started": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-getting-started-package-styles",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use a native button and let onConfirm perform the action. The package owns the hold gesture and confirmation fill, while your application owns the result.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-getting-started-react",
            language: "tsx",
            code: `"use client";

import { HoldToConfirmButton } from "@reuse-sh/interactions/react";

export function DeleteAction({ onDelete }: { onDelete: () => void }) {
  return <HoldToConfirmButton className="rounded-lg px-4 py-2" holdMs={1200} onConfirm={onDelete}>
    Hold to delete
  </HoldToConfirmButton>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "A pointer, Space or Enter must stay held; leaving, Escape or an early release cancels. Assistive-technology clicks can confirm immediately. The controller confirms once and holds its fill until resetMs expires. Your application owns permission checks, requests and failure messages. Without JavaScript the native example remains disabled rather than offering an unprotected action.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use a native button and let onConfirm perform the action. The package owns the hold gesture and confirmation fill, while your application owns the result.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-getting-started-markup",
            language: "html",
            code: '<button id="delete" type="button" disabled>Hold to delete</button>',
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-getting-started-css",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-getting-started-initialize",
            language: "javascript",
            code: `import { createHoldToConfirm } from "@reuse-sh/interactions";

const button = document.querySelector("#delete");
const result = document.createElement("p");
result.setAttribute("role", "status");
button.after(result);
const hold = createHoldToConfirm(button, {
  onConfirm: () => { result.textContent = "Deletion confirmed. Send your application request here."; },
});
button.disabled = false;`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "A pointer, Space or Enter must stay held; leaving, Escape or an early release cancels. Assistive-technology clicks can confirm immediately. The controller confirms once and holds its fill until resetMs expires. Your application owns permission checks, requests and failure messages. Without JavaScript the native example remains disabled rather than offering an unprotected action.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-getting-started-cleanup",
            language: "javascript",
            code: `hold.destroy();
button.disabled = true;
result.remove();`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "hold-to-confirm/examples/delete-file": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-examples-delete-file-package-styles",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Remove the file only after the hold confirms and the application request succeeds. Disable the action while the request runs and show the error if it fails.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-examples-delete-file-react",
            language: "tsx",
            code: `"use client";

import { useState } from "react";
import { HoldToConfirmButton } from "@reuse-sh/interactions/react";

export function DeleteFile({ remove }: { remove: () => Promise<void> }) {
  const [status, setStatus] = useState<"idle" | "pending" | "deleted" | "error">("idle");
  async function confirm() {
    setStatus("pending");
    try {
      await remove();
      setStatus("deleted");
    } catch {
      setStatus("error");
    }
  }
  return <>
    <HoldToConfirmButton disabled={status === "pending" || status === "deleted"} onConfirm={() => { void confirm(); }}>Hold to delete file</HoldToConfirmButton>
    <p role="status">{status === "deleted" ? "File deleted" : status === "error" ? "Could not delete the file. Try again." : status === "pending" ? "Deleting file…" : ""}</p>
  </>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Pass your file service as remove in React. The native callback shows where to send the same request; replace its status update with your application action and keep the button disabled while awaiting it. A pointer, Space or Enter must stay held; leaving, Escape or an early release cancels. Assistive-technology clicks can confirm immediately. The controller confirms once and holds its fill until resetMs expires. Your application owns permission checks, requests and failure messages.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Remove the file only after the hold confirms and the application request succeeds. Disable the action while the request runs and show the error if it fails.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-examples-delete-file-markup",
            language: "html",
            code: '<button id="delete" type="button" disabled>Hold to delete</button>',
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-examples-delete-file-css",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-examples-delete-file-initialize",
            language: "javascript",
            code: `import { createHoldToConfirm } from "@reuse-sh/interactions";

const button = document.querySelector("#delete");
const result = document.createElement("p");
result.setAttribute("role", "status");
button.after(result);
const hold = createHoldToConfirm(button, {
  onConfirm: () => { result.textContent = "Deletion confirmed. Send your application request here."; },
});
button.disabled = false;`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Pass your file service as remove in React. The native callback shows where to send the same request; replace its status update with your application action and keep the button disabled while awaiting it. A pointer, Space or Enter must stay held; leaving, Escape or an early release cancels. Assistive-technology clicks can confirm immediately. The controller confirms once and holds its fill until resetMs expires. Your application owns permission checks, requests and failure messages.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-examples-delete-file-cleanup",
            language: "javascript",
            code: `hold.destroy();
button.disabled = true;
result.remove();`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "hold-to-confirm/examples/settings": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-examples-settings-package-styles",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Keep a destructive settings action beside its explanation. Longer holdMs changes the deliberate press duration; resetMs controls how long the confirmed result stays visible.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-examples-settings-react",
            language: "tsx",
            code: `"use client";

import { HoldToConfirmButton } from "@reuse-sh/interactions/react";

export function ResetSettings({ onResetSettings }: { onResetSettings: () => void }) {
  return <HoldToConfirmButton className="rounded-lg px-4 py-2" holdMs={1600} resetMs={2000} onConfirm={onResetSettings}>
    Hold to reset settings
  </HoldToConfirmButton>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Use an explicit label that names the setting being changed. A successful request may call hold.reset() when the application intentionally wants to end the confirmed state early. A pointer, Space or Enter must stay held; leaving, Escape or an early release cancels. Assistive-technology clicks can confirm immediately. The controller confirms once and holds its fill until resetMs expires. Your application owns permission checks, requests and failure messages.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Keep a destructive settings action beside its explanation. Longer holdMs changes the deliberate press duration; resetMs controls how long the confirmed result stays visible.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-examples-settings-markup",
            language: "html",
            code: `<p>Reset your workspace preferences to their defaults.</p>
<button id="reset" type="button" disabled>Hold to reset</button>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-examples-settings-css",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-examples-settings-initialize",
            language: "javascript",
            code: `import { createHoldToConfirm } from "@reuse-sh/interactions";

const button = document.querySelector("#reset");
const result = document.createElement("p");
result.setAttribute("role", "status");
button.after(result);
const hold = createHoldToConfirm(button, {
  holdMs: 1600,
  resetMs: 2000,
  onConfirm: () => { result.textContent = "Reset confirmed. Send your application request here."; },
});
button.disabled = false;`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Use an explicit label that names the setting being changed. A successful request may call hold.reset() when the application intentionally wants to end the confirmed state early. A pointer, Space or Enter must stay held; leaving, Escape or an early release cancels. Assistive-technology clicks can confirm immediately. The controller confirms once and holds its fill until resetMs expires. Your application owns permission checks, requests and failure messages.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "hold-to-confirm-examples-settings-cleanup",
            language: "javascript",
            code: `hold.destroy();
button.disabled = true;
result.remove();`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "copy-button/getting-started": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "copy-button-getting-started-package-styles",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Pass text for a fixed value or getText for a value read at click time. The button keeps its label while the icon changes after success or failure.",
          },
          {
            kind: "code",
            id: "copy-button-getting-started-react",
            language: "tsx",
            code: `"use client";

import { CopyButton } from "@reuse-sh/interactions/react";

export function InstallCommand() {
  return <div className="flex items-center gap-3">
    <code>npm install @reuse-sh/interactions</code>
    <CopyButton text="npm install @reuse-sh/interactions">Copy command</CopyButton>
  </div>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "The package provides copy, success and error icons plus a polite status announcement. It falls back to a temporary selection if the Clipboard API is unavailable or refused. Keep the source text selectable for no-JavaScript use. React owns controller cleanup.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Pass text for a fixed value or getText for a value read at click time. The button keeps its label while the icon changes after success or failure.",
          },
          {
            kind: "code",
            id: "copy-button-getting-started-markup",
            language: "html",
            code: `<code id="command">npm install @reuse-sh/interactions</code>
<button id="copy" type="button" hidden>Copy command</button>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "copy-button-getting-started-css",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "copy-button-getting-started-initialize",
            language: "javascript",
            code: `import { createCopyButton } from "@reuse-sh/interactions";

const button = document.querySelector("#copy");
const copy = createCopyButton(button, {
  getText: () => document.querySelector("#command").textContent,
});
button.hidden = false;`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "The package provides copy, success and error icons plus a polite status announcement. It falls back to a temporary selection if the Clipboard API is unavailable or refused. Keep the source text selectable for no-JavaScript use.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "copy-button-getting-started-cleanup",
            language: "javascript",
            code: `copy.destroy();
button.hidden = true;`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "copy-button/examples/code-block": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "copy-button-examples-code-block-package-styles",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Read the code element at click time so the copied command stays aligned with visible content. Put the copy button outside the code element to avoid copying its label.",
          },
          {
            kind: "code",
            id: "copy-button-examples-code-block-react",
            language: "tsx",
            code: `"use client";

import { CopyButton } from "@reuse-sh/interactions/react";

export function CodeBlock({ command }: { command: string }) {
  return <div className="relative rounded-xl border p-4">
    <pre className="overflow-x-auto pr-20"><code>{command}</code></pre>
    <CopyButton className="absolute right-4 top-4" text={command} aria-label="Copy command" />
  </div>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Give an icon-only button an accessible name such as Copy command. Keep long commands horizontally scrollable instead of expanding the page. The package provides copy, success and error icons plus a polite status announcement. It falls back to a temporary selection if the Clipboard API is unavailable or refused. Keep the source text selectable for no-JavaScript use. React owns controller cleanup.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Read the code element at click time so the copied command stays aligned with visible content. Put the copy button outside the code element to avoid copying its label.",
          },
          {
            kind: "code",
            id: "copy-button-examples-code-block-markup",
            language: "html",
            code: `<div class="re-command">
  <pre><code id="command">npm install @reuse-sh/interactions</code></pre>
  <button id="copy" type="button" hidden aria-label="Copy command"></button>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "copy-button-examples-code-block-css",
            language: "css",
            code: `@import "@reuse-sh/interactions/styles.css";

.re-command { position: relative; padding: 1rem; }
.re-command pre { overflow-x: auto; padding-inline-end: 3rem; }
.re-command button { position: absolute; inset-block-start: 1rem; inset-inline-end: 1rem; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "copy-button-examples-code-block-initialize",
            language: "javascript",
            code: `import { createCopyButton } from "@reuse-sh/interactions";

const button = document.querySelector("#copy");
const copy = createCopyButton(button, {
  getText: () => document.querySelector("#command").textContent,
});
button.hidden = false;`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Give an icon-only button an accessible name such as Copy command. Keep long commands horizontally scrollable instead of expanding the page. The package provides copy, success and error icons plus a polite status announcement. It falls back to a temporary selection if the Clipboard API is unavailable or refused. Keep the source text selectable for no-JavaScript use.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "copy-button-examples-code-block-cleanup",
            language: "javascript",
            code: `copy.destroy();
button.hidden = true;`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "copy-button/examples/share-link": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "copy-button-examples-share-link-package-styles",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Copy the current share URL from the same value shown to the reader. Use a read-only input so the URL can still be selected manually.",
          },
          {
            kind: "code",
            id: "copy-button-examples-share-link-react",
            language: "tsx",
            code: `"use client";

import { CopyButton } from "@reuse-sh/interactions/react";

export function ShareLink({ url }: { url: string }) {
  return <div className="flex flex-wrap items-center gap-3">
    <label>Share URL <input readOnly value={url} /></label>
    <CopyButton text={url} resetMs={2000}>Copy link</CopyButton>
  </div>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "A two-second reset leaves time to see the result. Empty text or a rejected getText ends in the error state; onError can connect it to your application logging. The package provides copy, success and error icons plus a polite status announcement. It falls back to a temporary selection if the Clipboard API is unavailable or refused. Keep the source text selectable for no-JavaScript use. React owns controller cleanup.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Copy the current share URL from the same value shown to the reader. Use a read-only input so the URL can still be selected manually.",
          },
          {
            kind: "code",
            id: "copy-button-examples-share-link-markup",
            language: "html",
            code: `<label>Share URL <input id="share-url" readonly value="https://example.com/prints/blue" /></label>
<button id="copy" type="button" hidden>Copy link</button>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "copy-button-examples-share-link-css",
            language: "css",
            code: '@import "@reuse-sh/interactions/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "copy-button-examples-share-link-initialize",
            language: "javascript",
            code: `import { createCopyButton } from "@reuse-sh/interactions";

const button = document.querySelector("#copy");
const copy = createCopyButton(button, {
  getText: () => document.querySelector("#share-url").value,
  resetMs: 2000,
});
button.hidden = false;`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "A two-second reset leaves time to see the result. Empty text or a rejected getText ends in the error state; onError can connect it to your application logging. The package provides copy, success and error icons plus a polite status announcement. It falls back to a temporary selection if the Clipboard API is unavailable or refused. Keep the source text selectable for no-JavaScript use.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "copy-button-examples-share-link-cleanup",
            language: "javascript",
            code: `copy.destroy();
button.hidden = true;`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
};
