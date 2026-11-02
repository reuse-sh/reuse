import type { UsageRecipe } from "./usage-types.js";

export const styleUsage: Readonly<Record<string, UsageRecipe>> = {
  "shadows/getting-started": {
    react: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Import the stylesheet and add one shadow class to the element that needs depth. The ring variant combines its hairline outline and shadow in one box-shadow declaration.",
          },
          {
            kind: "code",
            id: "shadows-getting-started-react",
            language: "tsx",
            code: `import "@reuse-sh/shadows/styles.css";

<div className="re-shadow-ring-md">...</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Use re-shadow-xs, sm, md, lg, xl or 2xl for depth only. Add ring in the class name to include the hairline edge. No controller, React state or JavaScript initialization is needed.",
          },
        ],
      },
      {
        title: "Tailwind 4",
        blocks: [
          {
            kind: "prose",
            text: "For Tailwind variants, remove the plain styles.css import and import the adapter in your Tailwind stylesheet instead. It registers the same shadow classes as utilities, so hover and responsive variants use your existing Tailwind build.",
          },
          {
            kind: "code",
            id: "shadows-tailwind-css",
            language: "css",
            code: `@import "tailwindcss";
@import "@reuse-sh/shadows/tailwind.css";`,
            role: "setup",
          },
          {
            kind: "code",
            id: "shadows-tailwind-react",
            language: "tsx",
            code: '<article className="re-shadow-ring-sm hover:re-shadow-ring-md">Print details</article>',
            role: "usage",
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
            text: "Import the stylesheet and add one shadow class to the element that needs depth. The ring variant combines its hairline outline and shadow in one box-shadow declaration.",
          },
          {
            kind: "code",
            id: "shadows-getting-started-markup",
            language: "html",
            code: '<div class="re-shadow-ring-md">...</div>',
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
            id: "shadows-getting-started-css",
            language: "css",
            code: '@import "@reuse-sh/shadows/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Use re-shadow-xs, sm, md, lg, xl or 2xl for depth only. Add ring in the class name to include the hairline edge. No controller, React state or JavaScript initialization is needed.",
          },
        ],
      },
      {
        title: "Tailwind 4",
        blocks: [
          {
            kind: "prose",
            text: "For Tailwind variants, remove the plain styles.css import and import the adapter in your Tailwind stylesheet instead. It registers the same shadow classes as utilities, so hover and responsive variants use your existing Tailwind build.",
          },
          {
            kind: "code",
            id: "shadows-tailwind-css",
            language: "css",
            code: `@import "tailwindcss";
@import "@reuse-sh/shadows/tailwind.css";`,
            role: "setup",
          },
          {
            kind: "code",
            id: "shadows-tailwind-markup",
            language: "html",
            code: '<article class="re-shadow-ring-sm hover:re-shadow-ring-md">Print details</article>',
            role: "usage",
          },
        ],
      },
    ],
  },
  "shadows/examples/cards": {
    react: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use a small ring shadow for a resting card and a larger one when it is raised. Keep the application in charge of padding, background and radius.",
          },
          {
            kind: "code",
            id: "shadows-examples-cards-react",
            language: "tsx",
            code: `import "@reuse-sh/shadows/styles.css";

<article className="re-shadow-ring-sm rounded-xl bg-white p-6">
  <h2>Print details</h2>
  <p>Archival pigment on cotton paper.</p>
</article>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "The package supplies depth, so layout and surface color stay explicit. For hover or responsive class variants with Tailwind 4, remove the plain stylesheet import and import @reuse-sh/shadows/tailwind.css in your Tailwind stylesheet instead. Then use hover:re-shadow-ring-md. Use re-shadow-xs, sm, md, lg, xl or 2xl for depth only. Add ring in the class name to include the hairline edge. No controller, React state or JavaScript initialization is needed.",
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
            text: "Use a small ring shadow for a resting card and a larger one when it is raised. Keep the application in charge of padding, background and radius.",
          },
          {
            kind: "code",
            id: "shadows-examples-cards-markup",
            language: "html",
            code: `<article class="re-product-card re-shadow-ring-sm">
  <h2>Print details</h2>
  <p>Archival pigment on cotton paper.</p>
</article>`,
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
            id: "shadows-examples-cards-css",
            language: "css",
            code: `@import "@reuse-sh/shadows/styles.css";

.re-product-card { padding: 1.5rem; border-radius: 1rem; background: white; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "The package supplies depth, so layout and surface color stay explicit. For hover or responsive class variants with Tailwind 4, remove the plain stylesheet import and import @reuse-sh/shadows/tailwind.css in your Tailwind stylesheet instead. Then use hover:re-shadow-ring-md. Use re-shadow-xs, sm, md, lg, xl or 2xl for depth only. Add ring in the class name to include the hairline edge. No controller, React state or JavaScript initialization is needed.",
          },
        ],
      },
    ],
  },
  "shadows/examples/scale": {
    react: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Choose depth by the surface role. A control needs less separation than a floating menu. The six levels share one construction. A ring variant adds its hairline edge to the same shadow level.",
          },
          {
            kind: "code",
            id: "shadows-examples-scale-react",
            language: "tsx",
            code: `import "@reuse-sh/shadows/styles.css";

<div className="grid gap-6">
  <button className="re-shadow-ring-xs rounded-lg px-3 py-2" type="button">Control</button>
  <article className="re-shadow-ring-sm rounded-xl p-6">Card</article>
  <aside className="re-shadow-ring-lg rounded-xl p-6">Floating surface</aside>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Set --re-shadow-color and --re-ring-color on the surface or an ancestor when adapting to a theme. Keep local overrides near their surface so nested themes can change them independently. Use re-shadow-xs, sm, md, lg, xl or 2xl for depth only. Add ring in the class name to include the hairline edge. No controller, React state or JavaScript initialization is needed.",
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
            text: "Choose depth by the surface role. A control needs less separation than a floating menu. The six levels share one construction. A ring variant adds its hairline edge to the same shadow level.",
          },
          {
            kind: "code",
            id: "shadows-examples-scale-markup",
            language: "html",
            code: `<div class="re-depth-scale">
  <button class="re-shadow-ring-xs" type="button">Control</button>
  <article class="re-shadow-ring-sm">Card</article>
  <aside class="re-shadow-ring-lg">Floating surface</aside>
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
            id: "shadows-examples-scale-css",
            language: "css",
            code: `@import "@reuse-sh/shadows/styles.css";

.re-depth-scale { display: grid; gap: 1.5rem; }
.re-depth-scale > * { padding: 1rem; border-radius: 0.75rem; background: white; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Set --re-shadow-color and --re-ring-color on the surface or an ancestor when adapting to a theme. Keep local overrides near their surface so nested themes can change them independently. Use re-shadow-xs, sm, md, lg, xl or 2xl for depth only. Add ring in the class name to include the hairline edge. No controller, React state or JavaScript initialization is needed.",
          },
        ],
      },
    ],
  },
  "easing-gradients/getting-started": {
    react: [
      {
        title: "Tailwind 4",
        blocks: [
          {
            kind: "prose",
            text: "If your app uses Tailwind 4, import the adapter in the stylesheet processed by Tailwind. Use this import instead of @reuse-sh/gradients/styles.css. The utilities read your theme colors and accept opacity modifiers.",
          },
          {
            kind: "code",
            id: "gradient-tailwind-css",
            language: "css",
            code: `@import "tailwindcss";
@import "@reuse-sh/gradients/tailwind.css";`,
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use re-gradient for the default sine fade and supply the required end color with re-gradient-to-*. This example uses the background color from your theme at 85% opacity. Replace background with any color token from your theme. A direction modifier chooses the fade direction.",
          },
          {
            kind: "code",
            id: "easing-gradients-getting-started-react",
            language: "tsx",
            code: `import "./app.css";

<div className="re-gradient re-gradient-dir-b re-gradient-from-transparent re-gradient-to-background/85 rounded-xl p-6">
  Print collection
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "The default curve is ease-in-out-sine with twelve stops. re-gradient-ease-in, re-gradient-ease-out and re-gradient-linear choose the other built-in curves; re-gradient-ease-in-out-sine states the default explicitly. CSS presets are linear gradients and need no JavaScript. Use easingGradient from @reuse-sh/gradients for custom bezier curves, radial gradients or a custom stop count.",
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
            text: "Import the stylesheet, add re-gradient and set --re-gradient-to to the required end color. The start defaults to transparent. A re-gradient-dir-* class chooses the direction; --re-gradient-direction accepts a custom CSS direction.",
          },
          {
            kind: "code",
            id: "easing-gradients-getting-started-markup",
            language: "html",
            code: '<div class="re-gradient re-gradient-dir-b re-caption-fade">Print collection</div>',
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once and set the colors on your element or an ancestor. Without an end color, the gradient cannot render.",
          },
          {
            kind: "code",
            id: "easing-gradients-getting-started-css",
            language: "css",
            code: `@import "@reuse-sh/gradients/styles.css";

.re-caption-fade {
  --re-gradient-from: transparent;
  --re-gradient-to: rgb(0 0 0 / 85%);
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
            text: "The default curve is ease-in-out-sine with twelve stops. re-gradient-ease-in, re-gradient-ease-out and re-gradient-linear choose the other built-in curves; re-gradient-ease-in-out-sine states the default explicitly. CSS presets are linear gradients and need no JavaScript. Use easingGradient from @reuse-sh/gradients for custom bezier curves, radial gradients or a custom stop count.",
          },
        ],
      },
      {
        title: "Tailwind 4",
        blocks: [
          {
            kind: "prose",
            text: "For Tailwind 4, replace the plain styles.css import with the adapter in your Tailwind stylesheet. Replace re-caption-fade with color utilities such as re-gradient-from-transparent re-gradient-to-black/85. These utilities read your theme colors and accept opacity modifiers. The destination color is still required.",
          },
          {
            kind: "code",
            id: "gradient-tailwind-css",
            language: "css",
            code: `@import "tailwindcss";
@import "@reuse-sh/gradients/tailwind.css";`,
            role: "usage",
          },
        ],
      },
    ],
  },
  "easing-gradients/examples/image-caption": {
    react: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Put the gradient on a caption overlay while keeping the image and text as real content. The transparent start preserves the image and the dark destination gives the caption a readable backing.",
          },
          {
            kind: "code",
            id: "easing-gradients-examples-image-caption-react",
            language: "tsx",
            code: `import "./app.css";

<figure className="relative overflow-hidden rounded-xl">
  <img className="block w-full" src="/images/print.jpg" alt="Blue marble print" width="1200" height="900" />
  <figcaption className="re-gradient re-gradient-dir-b re-gradient-from-transparent re-gradient-to-black/85 absolute inset-x-0 bottom-0 px-6 pt-16 pb-6 text-white">
    Blue marble, archival pigment on paper
  </figcaption>
</figure>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Keep enough space above the text for the fade to develop. Check contrast against the lightest area of the actual image. The caption remains readable text with scripts disabled, and no animation or lifecycle code is required.",
          },
        ],
      },
      {
        title: "Tailwind 4",
        blocks: [
          {
            kind: "prose",
            text: "Import the CSS-first adapter in the stylesheet processed by Tailwind. The color utilities read your theme colors and accept opacity modifiers. Supply the destination color explicitly.",
          },
          {
            kind: "code",
            id: "gradient-tailwind-css",
            language: "css",
            code: `@import "tailwindcss";
@import "@reuse-sh/gradients/tailwind.css";`,
            role: "usage",
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
            text: "Put the gradient on a caption overlay while keeping the image and text as real content. The transparent start preserves the image and the dark destination gives the caption a readable backing.",
          },
          {
            kind: "code",
            id: "easing-gradients-examples-image-caption-markup",
            language: "html",
            code: `<figure class="re-caption-image">
  <img src="/images/print.jpg" alt="Blue marble print" width="1200" height="900" />
  <figcaption class="re-gradient re-gradient-dir-b re-caption-fade">Blue marble, archival pigment on paper</figcaption>
</figure>`,
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
            id: "easing-gradients-examples-image-caption-css",
            language: "css",
            code: `@import "@reuse-sh/gradients/styles.css";

.re-caption-fade {
  --re-gradient-from: transparent;
  --re-gradient-to: rgb(0 0 0 / 85%);
}

.re-caption-image { position: relative; overflow: hidden; border-radius: 1rem; }
.re-caption-image img { display: block; width: 100%; height: auto; }
.re-caption-image figcaption { position: absolute; inset: auto 0 0; padding: 4rem 1.5rem 1.5rem; color: white; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Keep enough space above the text for the fade to develop. Check contrast against the lightest area of the actual image. The caption remains readable text with scripts disabled, and no animation or lifecycle code is required.",
          },
        ],
      },
      {
        title: "Tailwind 4",
        blocks: [
          {
            kind: "prose",
            text: "Import the CSS-first adapter in the stylesheet processed by Tailwind. The color utilities read your theme colors and accept opacity modifiers. Supply the destination color explicitly.",
          },
          {
            kind: "code",
            id: "gradient-tailwind-css",
            language: "css",
            code: `@import "tailwindcss";
@import "@reuse-sh/gradients/tailwind.css";`,
            role: "usage",
          },
        ],
      },
    ],
  },
  "easing-gradients/examples/fade-edge": {
    react: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "FadeEdge measures the remaining horizontal scroll distance and masks only the edges with more content. This needs JavaScript because a fixed gradient cannot know which edge has reached the end.",
          },
          {
            kind: "code",
            id: "easing-gradients-examples-fade-edge-react",
            language: "tsx",
            code: `"use client";

import { useEffect, useRef } from "react";
import { createFadeEdge } from "@reuse-sh/gradients";

export function TopicStrip() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const fade = createFadeEdge(ref.current, { size: 48, curve: "smooth", mode: "scroll" });
    return () => fade.destroy();
  }, []);
  return <div ref={ref} className="flex gap-4 overflow-x-auto" tabIndex={0} aria-label="Topics">
    <a className="shrink-0" href="/prints">Prints</a>
    <a className="shrink-0" href="/process">Printing process</a>
    <a className="shrink-0" href="/materials">Materials and paper</a>
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
            text: "size is the maximum fade width in pixels. scroll mode grows the fade with the hidden distance; fixed mode uses the full size whenever an edge has hidden content. The controller observes resizing and child changes, respects text direction, and restores owned styles on destroy. Keep overflow scrolling and focus access available without scripts.",
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
            text: "FadeEdge measures the remaining horizontal scroll distance and masks only the edges with more content. This needs JavaScript because a fixed gradient cannot know which edge has reached the end.",
          },
          {
            kind: "code",
            id: "easing-gradients-examples-fade-edge-markup",
            language: "html",
            code: `<div id="topics" tabindex="0" aria-label="Topics">
  <a href="/prints">Prints</a>
  <a href="/process">Printing process</a>
  <a href="/materials">Materials and paper</a>
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
            text: "Keep layout styles scoped to the scroll container. The controller supplies the measured fade mask.",
          },
          {
            kind: "code",
            id: "easing-gradients-examples-fade-edge-css",
            language: "css",
            code: `#topics { display: flex; gap: 1rem; overflow-x: auto; }
#topics a { flex-shrink: 0; }`,
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
            id: "easing-gradients-examples-fade-edge-initialize",
            language: "javascript",
            code: `import { createFadeEdge } from "@reuse-sh/gradients";

const fade = createFadeEdge(document.querySelector("#topics"), {
  size: 48, curve: "smooth", mode: "scroll",
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
            text: "size is the maximum fade width in pixels. scroll mode grows the fade with the hidden distance; fixed mode uses the full size whenever an edge has hidden content. The controller observes resizing and child changes, respects text direction, and restores owned styles on destroy. Keep overflow scrolling and focus access available without scripts.",
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
            id: "easing-gradients-examples-fade-edge-cleanup",
            language: "javascript",
            code: "fade.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "easing-gradients/guides/easing-curves": {
    react: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "The curve changes color progress along the same direction. Sine eases both ends, ease-in keeps the start color longer, ease-out reaches the end color earlier, and linear uses two evenly changing stops.",
          },
          {
            kind: "code",
            id: "gradient-curves-css",
            language: "css",
            code: `@import "@reuse-sh/gradients/styles.css";

.re-soft-fade { --re-gradient-from: transparent; --re-gradient-to: black; }`,
            role: "usage",
          },
          {
            kind: "code",
            id: "gradient-curves-markup",
            language: "html",
            code: '<div class="re-gradient re-gradient-ease-in re-gradient-dir-t re-soft-fade">Eased upward fade</div>',
            role: "usage",
          },
        ],
      },
      {
        title: "Generate a custom curve",
        blocks: [
          {
            kind: "prose",
            text: "Use the browser module for custom cubic bezier curves, radial gradients or a custom stop count. The function returns a CSS image string; assign it to the style property your integration needs.",
          },
          {
            kind: "code",
            id: "gradient-custom",
            language: "javascript",
            code: `import { easingGradient } from "@reuse-sh/gradients";

const backgroundImage = easingGradient({
  from: "transparent",
  to: "rgb(0 0 0 / 85%)",
  easing: [0.3, 0, 0.7, 1],
  type: "radial",
  direction: "ellipse at center",
  stops: 16,
});`,
            role: "usage",
          },
        ],
      },
      {
        title: "Keep static gradients in CSS",
        blocks: [
          {
            kind: "prose",
            text: "Use re-gradient-dir-t, tr, r, br, b, bl, l or tl for the eight preset directions. Tailwind re-gradient-from-* and re-gradient-to-* read semantic theme colors and opacity modifiers. Keep fixed presets in classes; generate JavaScript strings only when the curve or geometry requires the function. The to color is required in both interfaces.",
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
            text: "The curve changes color progress along the same direction. Sine eases both ends, ease-in keeps the start color longer, ease-out reaches the end color earlier, and linear uses two evenly changing stops.",
          },
          {
            kind: "code",
            id: "gradient-curves-css",
            language: "css",
            code: `@import "@reuse-sh/gradients/styles.css";

.re-soft-fade { --re-gradient-from: transparent; --re-gradient-to: black; }`,
            role: "usage",
          },
          {
            kind: "code",
            id: "gradient-curves-markup",
            language: "html",
            code: '<div class="re-gradient re-gradient-ease-in re-gradient-dir-t re-soft-fade">Eased upward fade</div>',
            role: "usage",
          },
        ],
      },
      {
        title: "Generate a custom curve",
        blocks: [
          {
            kind: "prose",
            text: "Use the browser module for custom cubic bezier curves, radial gradients or a custom stop count. The function returns a CSS image string; assign it to the style property your integration needs.",
          },
          {
            kind: "code",
            id: "gradient-custom",
            language: "javascript",
            code: `import { easingGradient } from "@reuse-sh/gradients";

const backgroundImage = easingGradient({
  from: "transparent",
  to: "rgb(0 0 0 / 85%)",
  easing: [0.3, 0, 0.7, 1],
  type: "radial",
  direction: "ellipse at center",
  stops: 16,
});`,
            role: "usage",
          },
        ],
      },
      {
        title: "Keep static gradients in CSS",
        blocks: [
          {
            kind: "prose",
            text: "Use re-gradient-dir-t, tr, r, br, b, bl, l or tl for the eight preset directions. Tailwind re-gradient-from-* and re-gradient-to-* read semantic theme colors and opacity modifiers. Keep fixed presets in classes; generate JavaScript strings only when the curve or geometry requires the function. The to color is required in both interfaces.",
          },
        ],
      },
    ],
  },
  "loaders/getting-started": {
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
            id: "loaders-getting-started-package-styles",
            language: "css",
            code: '@import "@reuse-sh/loaders/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Render ThinkingDots at the size of surrounding text. Its fallback is visible before scripts run, and the canvas uses the inherited text color.",
          },
          {
            kind: "code",
            id: "loaders-getting-started-react",
            language: "tsx",
            code: `"use client";

import { ThinkingDots } from "@reuse-sh/loaders/react";

export function ReplyStatus() {
  return <ThinkingDots size={24} label="Preparing reply" />;
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
            text: "The static dots remain until canvas initialization succeeds. label gives the React loader an accessible status name; omit it for a decorative loader beside existing status text. Motion pauses offscreen and in hidden tabs, and reduced motion shows a still figure. The React component owns its animation lifecycle.",
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
            text: "Render the fallback dots and canvas at the size of surrounding text. Its fallback is visible before scripts run, and the canvas uses the inherited text color.",
          },
          {
            kind: "code",
            id: "loaders-getting-started-markup",
            language: "html",
            code: `<span id="thinking" class="re-thinking-dots" role="status" aria-label="Preparing reply">
  <span class="re-thinking-dots__fallback" aria-hidden="true" style="width:24px;height:24px"><span></span><span></span><span></span></span>
  <canvas hidden aria-hidden="true"></canvas>
</span>`,
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
            id: "loaders-getting-started-css",
            language: "css",
            code: '@import "@reuse-sh/loaders/styles.css";',
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
            id: "loaders-getting-started-initialize",
            language: "javascript",
            code: `import { createThinkingDots } from "@reuse-sh/loaders";

const root = document.querySelector("#thinking");
const canvas = root.querySelector("canvas");
const fallback = root.querySelector(".re-thinking-dots__fallback");
canvas.hidden = false;
let dots;
try {
  dots = createThinkingDots(canvas, { size: 24 });
  fallback.hidden = true;
} catch (error) {
  canvas.hidden = true;
  throw error;
}`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: 'The static dots remain until canvas initialization succeeds. Use role="status" and aria-label to name a standalone loader; hide a decorative loader from assistive technology beside existing status text. Motion pauses offscreen and in hidden tabs, and reduced motion shows a still figure.',
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
            id: "loaders-getting-started-cleanup",
            language: "javascript",
            code: `dots?.destroy();
canvas.hidden = true;
fallback.hidden = false;`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "loaders/examples/chat-reply": {
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
            id: "loaders-examples-chat-reply-package-styles",
            language: "css",
            code: '@import "@reuse-sh/loaders/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Show one status while a reply is pending, then remove it when the reply arrives. Keep a visible sentence beside decorative dots instead of announcing two copies of the same status.",
          },
          {
            kind: "code",
            id: "loaders-examples-chat-reply-react",
            language: "tsx",
            code: `"use client";

import { ThinkingDots } from "@reuse-sh/loaders/react";

export function Reply({ pending, text }: { pending: boolean; text: string }) {
  return pending ? <p role="status" className="flex items-center gap-2">
    <ThinkingDots size={20} />Preparing reply…
  </p> : <p>{text}</p>;
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
            text: "Unmount the loader when pending becomes false. In native code, run cleanup before replacing the status with the reply text. The static dots remain until canvas initialization succeeds. label gives the React loader an accessible status name; omit it for a decorative loader beside existing status text. Motion pauses offscreen and in hidden tabs, and reduced motion shows a still figure.",
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
            text: "Show one status while a reply is pending, then remove it when the reply arrives. Keep a visible sentence beside decorative dots instead of announcing two copies of the same status.",
          },
          {
            kind: "code",
            id: "loaders-examples-chat-reply-markup",
            language: "html",
            code: `<span id="thinking" class="re-thinking-dots" role="status" >
  <span class="re-thinking-dots__fallback" aria-hidden="true" style="width:24px;height:24px"><span></span><span></span><span></span></span>
  <span>Preparing reply…</span>
  <canvas hidden aria-hidden="true"></canvas>
</span>`,
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
            id: "loaders-examples-chat-reply-css",
            language: "css",
            code: '@import "@reuse-sh/loaders/styles.css";',
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
            id: "loaders-examples-chat-reply-initialize",
            language: "javascript",
            code: `import { createThinkingDots } from "@reuse-sh/loaders";

const root = document.querySelector("#thinking");
const canvas = root.querySelector("canvas");
const fallback = root.querySelector(".re-thinking-dots__fallback");
canvas.hidden = false;
let dots;
try {
  dots = createThinkingDots(canvas, { size: 24 });
  fallback.hidden = true;
} catch (error) {
  canvas.hidden = true;
  throw error;
}`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: 'Destroy the loader before replacing the pending status with the reply text. The static dots remain until canvas initialization succeeds. Use role="status" and aria-label to name a standalone loader; hide a decorative loader from assistive technology beside existing status text. Motion pauses offscreen and in hidden tabs, and reduced motion shows a still figure.',
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
            id: "loaders-examples-chat-reply-cleanup",
            language: "javascript",
            code: `dots?.destroy();
canvas.hidden = true;
fallback.hidden = false;`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "loaders/examples/figures": {
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
            id: "loaders-examples-figures-package-styles",
            language: "css",
            code: '@import "@reuse-sh/loaders/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Select one built-in figure with figureConfig when a surface needs a consistent motion. Keep the returned config outside the React component so re-renders do not restart the controller.",
          },
          {
            kind: "code",
            id: "loaders-examples-figures-react",
            language: "tsx",
            code: `"use client";

import { figureConfig } from "@reuse-sh/loaders";
import { ThinkingDots } from "@reuse-sh/loaders/react";

const config = figureConfig("circle-flow");

export function FigureStatus() {
  return <ThinkingDots size={32} config={config} label="Loading preview" />;
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
            text: "figureNames lists the supported names. To switch a native instance without leaking its animation loop, call dots.setConfig(figureConfig(name)); do not attach a second controller to the canvas. The static dots remain until canvas initialization succeeds. label gives the React loader an accessible status name; omit it for a decorative loader beside existing status text. Motion pauses offscreen and in hidden tabs, and reduced motion shows a still figure.",
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
            text: "Select one built-in figure with figureConfig when a surface needs a consistent motion. Create the controller once and update its config when the selected figure changes.",
          },
          {
            kind: "code",
            id: "loaders-examples-figures-markup",
            language: "html",
            code: `<span id="thinking" class="re-thinking-dots" role="status" aria-label="Loading preview">
  <span class="re-thinking-dots__fallback" aria-hidden="true" style="width:32px;height:32px"><span></span><span></span><span></span></span>
  <canvas hidden aria-hidden="true"></canvas>
</span>`,
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
            id: "loaders-examples-figures-css",
            language: "css",
            code: '@import "@reuse-sh/loaders/styles.css";',
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
            id: "loaders-examples-figures-initialize",
            language: "javascript",
            code: `import { createThinkingDots, figureConfig } from "@reuse-sh/loaders";

const root = document.querySelector("#thinking");
const canvas = root.querySelector("canvas");
const fallback = root.querySelector(".re-thinking-dots__fallback");
canvas.hidden = false;
let dots;
try {
  dots = createThinkingDots(canvas, { size: 32, config: figureConfig("circle-flow") });
  fallback.hidden = true;
} catch (error) {
  canvas.hidden = true;
  throw error;
}`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: 'figureNames lists the supported names. To switch a native instance without leaking its animation loop, call dots.setConfig(figureConfig(name)); do not attach a second controller to the canvas. The static dots remain until canvas initialization succeeds. Use role="status" and aria-label to name a standalone loader; hide a decorative loader from assistive technology beside existing status text. Motion pauses offscreen and in hidden tabs, and reduced motion shows a still figure.',
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
            id: "loaders-examples-figures-cleanup",
            language: "javascript",
            code: `dots?.destroy();
canvas.hidden = true;
fallback.hidden = false;`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
};
