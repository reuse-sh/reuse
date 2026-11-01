import { installCommand, type Library } from "@reuse-sh/catalog";
export const snippets: Record<string, { native: string; react: string }> = {
  lightbox: {
    native: `import { bindLightboxGallery } from "@reuse-sh/lightbox";
import "@reuse-sh/lightbox/styles.css";

const gallery = document.querySelector("[data-gallery]");
const lightbox = bindLightboxGallery(gallery, {
  thumbnails: true,
  imageClick: "zoom",
});

// Later, when the gallery leaves the page
lightbox.destroy();`,
    react: `import { useLightbox } from "@reuse-sh/lightbox/react";
import "@reuse-sh/lightbox/styles.css";

export function Gallery({ photos }) {
  const lightbox = useLightbox({ thumbnails: true });
  return photos.map((photo, index) => (
    <button key={photo.src} onClick={() => lightbox.open(photos, index)}>
      <img src={photo.src} alt={photo.alt} />
    </button>
  ));
}`,
  },
  carousel: {
    native: `import { createCarousel } from "@reuse-sh/carousel";
import "@reuse-sh/carousel/styles.css";

const viewport = document.querySelector(".reuse-carousel");
const carousel = createCarousel(viewport, { loop: true, align: "start" });

carousel.subscribe((state) => {
  counter.textContent = state.index + 1 + " / " + state.count;
});

// Later, when the strip leaves the page
carousel.destroy();`,
    react: `import { useCarousel } from "@reuse-sh/carousel/react";
import "@reuse-sh/carousel/styles.css";

export function Strip({ photos }) {
  const { ref, carousel } = useCarousel({ loop: true });
  return (
    <div>
      <div ref={ref} className="reuse-carousel">
        {photos.map((photo) => (
          <img key={photo.src} src={photo.src} alt={photo.alt} data-carousel-slide />
        ))}
      </div>
      <button onClick={() => carousel?.next()}>Next</button>
    </div>
  );
}`,
  },
  annotations: {
    native:
      'import {\n  parseAnnotations,\n  createAnnotatedImage,\n} from "@reuse-sh/annotations";\nimport "@reuse-sh/annotations/styles.css";\n\nconst annotations = parseAnnotations([{\n  kind: "area",\n  box: [10, 20, 35, 25],\n  label: "Bands too tight",\n}]);\nconst image = createAnnotatedImage(root, {\n  src: "/prints/coral-sky.jpg",\n  alt: "A marble print in coral, sand and blue",\n  width: 1600, height: 1200, annotations,\n});\n\n// Later, when the image leaves the page\nimage.destroy();',
    react:
      'import { AnnotationEditor } from "@reuse-sh/annotations/react";\nimport "@reuse-sh/annotations/styles.css";\n\n<AnnotationEditor\n  src="/prints/coral-sky.jpg"\n  alt="A marble print in coral, sand and blue"\n  annotations={annotations}\n  onChange={setAnnotations}\n  width={1600}\n  height={1200}\n/>',
  },
  loaders: {
    native:
      'import {\n  createThinkingDots,\n  figureConfig,\n} from "@reuse-sh/loaders";\n\nconst loader = createThinkingDots(canvas, {\n  size: 32,\n  config: figureConfig("triangle-turn"),\n});\n\n// Later, when the answer arrives\nloader.destroy();',
    react:
      'import { ThinkingDots } from "@reuse-sh/loaders/react";\nimport "@reuse-sh/loaders/styles.css";\n\n<ThinkingDots size={24} label="Preparing your answer" />',
  },
  shadows: {
    native: `import "@reuse-sh/shadows/styles.css";
import { createFadeEdge } from "@reuse-sh/shadows";

// <div class="reuse-card reuse-shadow-ring-md">Your content</div>

// Fade the sides of a horizontal scroller.
const fade = createFadeEdge(strip, { size: 64, curve: "smooth", mode: "scroll" });

// Later, when the strip leaves the page
fade.destroy();`,
    react: `import "@reuse-sh/shadows/styles.css";
import { createFadeEdge } from "@reuse-sh/shadows";
import { useEffect, useRef } from "react";

export function Strip({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    const fade = createFadeEdge(ref.current, { mode: "fixed" });
    return () => fade.destroy();
  }, []);
  return (
    <div ref={ref} className="reuse-card reuse-shadow-ring-md strip">
      {children}
    </div>
  );
}`,
  },
  "floating-tooltip": {
    native: `import { createFloatingTooltip } from "@reuse-sh/interactions";
import "@reuse-sh/interactions/styles.css";

// Any element inside the root with data-reuse-tooltip gets the hint.
// <button aria-label="Share" data-reuse-tooltip="Share">…</button>
const toolbar = document.querySelector(".toolbar");
const tooltip = createFloatingTooltip(toolbar, { tilt: 5 });

// Later, when the toolbar leaves the page
tooltip.destroy();`,
    react: `import { FloatingTooltipGroup } from "@reuse-sh/interactions/react";
import "@reuse-sh/interactions/styles.css";

export function Toolbar() {
  return (
    <FloatingTooltipGroup className="toolbar" tilt={5}>
      <button aria-label="Share" data-reuse-tooltip="Share"><ShareIcon /></button>
      <button aria-label="Delete" data-reuse-tooltip="Delete"><TrashIcon /></button>
    </FloatingTooltipGroup>
  );
}`,
  },
  "moving-highlight": {
    native: `import { createMovingHighlight } from "@reuse-sh/interactions";
import "@reuse-sh/interactions/styles.css";

// <nav class="menu">
//   <a data-reuse-row data-current href="/">Overview</a>
//   <a data-reuse-row href="/examples">Examples</a>
// </nav>
const highlight = createMovingHighlight(document.querySelector(".menu"));

// Later, when the menu leaves the page
highlight.destroy();`,
    react: `import { MovingHighlight } from "@reuse-sh/interactions/react";
import "@reuse-sh/interactions/styles.css";

export function Menu({ current }) {
  return (
    <MovingHighlight className="menu">
      <a data-reuse-row data-current={current === "/" ? "" : undefined} href="/">Overview</a>
      <a data-reuse-row data-current={current === "/examples" ? "" : undefined} href="/examples">Examples</a>
    </MovingHighlight>
  );
}`,
  },
  "hold-to-confirm": {
    native:
      'import { createHoldToConfirm } from "@reuse-sh/interactions";\nimport "@reuse-sh/interactions/styles.css";\n\nconst hold = createHoldToConfirm(button, {\n  holdMs: 1200,\n  onConfirm: () => removeDraft(),\n});',
    react:
      'import { HoldToConfirmButton } from "@reuse-sh/interactions/react";\nimport "@reuse-sh/interactions/styles.css";\n\n<HoldToConfirmButton holdMs={1200} onConfirm={removeDraft}>\n  Hold to remove\n</HoldToConfirmButton>',
  },
  avatars: {
    native:
      'import { enhanceAvatar, createAvatarGroup } from "@reuse-sh/avatars";\nimport "@reuse-sh/avatars/styles.css";\n\nconst avatar = enhanceAvatar(avatarElement);\nconst group = createAvatarGroup(groupElement, { overlap: 12 });',
    react:
      'import { Avatar, AvatarGroup } from "@reuse-sh/avatars/react";\nimport "@reuse-sh/avatars/styles.css";\n\n<AvatarGroup overlap={12}>\n  <Avatar name="Alex Rivers" badge={{ type: "dot", label: "Online" }} />\n  <Avatar name="Sam Field" badge={{\n    type: "count", count: 128, label: "128 messages",\n  }} />\n</AvatarGroup>',
  },
};
const fence = String.fromCharCode(96).repeat(3);
export function libraryGuide(library: Library) {
  const example = snippets[library.slug];
  return `${[
    `# ${library.name}`,
    library.description,
    `Package: ${library.packageName}`,
    "## Install",
    `${fence}bash\n${installCommand(library)}\n${fence}`,
    "## Behavior",
    ...library.features.map(([name, text]) => `- ${name}. ${text}`),
    "## Integration notes",
    ...library.notes.map((value) => `- ${value}`),
    "## API",
    ...library.api.map(([name, text]) => `- \`${name}\`: ${text}`),
    "## Browser JavaScript",
    `${fence}js\n${example.native}\n${fence}`,
    "## React",
    `${fence}tsx\n${example.react}\n${fence}`,
    "## Agent workflow",
    "1. Inspect the project and read the installed package's types and stylesheet.",
    "2. Reuse the native controller. Use the React adapter only in a React surface.",
    "3. Adapt styles and data connections to the project. Do not recreate the gesture or state engine.",
    "4. Connect destroy and unsubscribe callbacks to the owner lifecycle.",
    "5. Verify keyboard access, pointer/touch behavior, resize, empty/one-item states, errors, reduced motion, and teardown where applicable.",
    "6. Report the actual checks and remaining browser/device limits.",
    "## Source",
    `https://github.com/reuse-sh/reuse/tree/main/${library.packageName.replace("@reuse-sh/", "packages/")}/src`,
    "License: MIT for original library code. Preserve dependency and asset license notices.",
  ].join("\n\n")}\n`;
}
export const agentGuide =
  "# Reuse integration guide\n\nRead /llms.txt, then the selected library guide at /{library}/guide.md. Install the package with npm install @reuse-sh/<package>, reuse the native implementation and adapt the integration. Read the installed types, import only the required entry points and CSS, connect teardown, and exercise the result in the host project. Do not invent API methods or claim unsupported media or devices. Original code is MIT.\n";
