import type { Library } from "@reuse-sh/catalog";
export const snippets: Record<string, { native: string; react: string }> = {
  lightbox: {
    native:
      'import { createLightbox } from "@reuse-sh/lightbox";\nimport "@reuse-sh/lightbox/styles.css";\n\nconst viewer = createLightbox({ thumbnails: true });\nviewer.open([{\n  src: "/photo.jpg",\n  alt: "A mountain lake",\n  width: 1600,\n  height: 1200,\n  origin: document.querySelector("img"),\n}]);',
    react:
      'import { useLightbox } from "@reuse-sh/lightbox/react";\nimport "@reuse-sh/lightbox/styles.css";\n\nfunction Gallery({ images }) {\n  const viewer = useLightbox();\n  return <button onClick={() => viewer.open(images)}>\n    Open gallery\n  </button>;\n}',
  },
  carousel: {
    native:
      'import { createCarousel } from "@reuse-sh/carousel";\nimport "@reuse-sh/carousel/styles.css";\n\nconst viewport = document.querySelector("[data-carousel]");\nconst carousel = createCarousel(viewport, {\n  align: "center",\n  loop: true,\n});\nnextButton.addEventListener("click", () => carousel.next());\ncarousel.subscribe((state) => {\n  counter.textContent = String(state.index + 1);\n});',
    react:
      'import { useCarousel } from "@reuse-sh/carousel/react";\nimport "@reuse-sh/carousel/styles.css";\n\nfunction Gallery({ children }) {\n  const { ref, carousel } = useCarousel({ loop: true });\n  return <>\n    <div ref={ref} className="reuse-carousel">\n      {children}\n    </div>\n    <button onClick={() => carousel?.next()}>Next</button>\n  </>;\n}',
  },
  annotations: {
    native:
      'import {\n  parseAnnotations,\n  createAnnotatedImage,\n} from "@reuse-sh/annotations";\nimport "@reuse-sh/annotations/styles.css";\n\nconst annotations = parseAnnotations([{\n  kind: "area",\n  box: [10, 20, 35, 25],\n  label: "The part to notice",\n}]);\nconst image = createAnnotatedImage(root, {\n  src: "/photo.jpg", alt: "A mountain lake",\n  width: 1600, height: 1200, annotations,\n});',
    react:
      'import { AnnotationEditor } from "@reuse-sh/annotations/react";\nimport "@reuse-sh/annotations/styles.css";\n\n<AnnotationEditor\n  src="/photo.jpg"\n  alt="A mountain lake"\n  annotations={annotations}\n  onChange={setAnnotations}\n  width={1600}\n  height={1200}\n/>',
  },
  loaders: {
    native:
      'import {\n  createThinkingDots,\n  figureConfig,\n} from "@reuse-sh/loaders";\n\nconst loader = createThinkingDots(canvas, {\n  size: 32,\n  config: figureConfig("triangle-turn"),\n});\nloader.pause();\nloader.play();',
    react:
      'import { ThinkingDots } from "@reuse-sh/loaders/react";\nimport "@reuse-sh/loaders/styles.css";\n\n<ThinkingDots size={24} label="Preparing your answer" />',
  },
  shadows: {
    native:
      'import "@reuse-sh/shadows/styles.css";\n\n<div class="reuse-card reuse-shadow-ring-md">\n  Your content\n</div>',
    react:
      'import "@reuse-sh/shadows/styles.css";\n\n<div className="reuse-card reuse-shadow-ring-md">\n  Your content\n</div>',
  },
  "floating-tooltip": {
    native:
      'import { createFloatingTooltip } from "@reuse-sh/interactions";\nimport "@reuse-sh/interactions/styles.css";\n\nconst tooltip = createFloatingTooltip(toolbar, {\n  side: "top",\n  delay: 150,\n});',
    react:
      'import {\n  FloatingTooltip,\n  FloatingTooltipGroup,\n} from "@reuse-sh/interactions/react";\nimport "@reuse-sh/interactions/styles.css";\n\n<FloatingTooltipGroup>\n  <FloatingTooltip content="Add an annotation">\n    <button>Add</button>\n  </FloatingTooltip>\n</FloatingTooltipGroup>',
  },
  "moving-highlight": {
    native:
      'import { createMovingHighlight } from "@reuse-sh/interactions";\nimport "@reuse-sh/interactions/styles.css";\n\nconst highlight = createMovingHighlight(menu);',
    react:
      'import { MovingHighlight } from "@reuse-sh/interactions/react";\nimport "@reuse-sh/interactions/styles.css";\n\n<MovingHighlight>\n  <button data-reuse-row data-current>Overview</button>\n  <button data-reuse-row>Examples</button>\n</MovingHighlight>',
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
    "Status: implemented in this local workspace. The packages have not been published to npm. Use the existing source/workspace package, not a guessed public install.",
    "## Behavior",
    ...library.features.map((value) => `- ${value}`),
    "## Integration notes",
    ...library.notes.map((value) => `- ${value}`),
    "## Native API",
    ...library.api.map((value) => `- ${value}`),
    "## Browser JavaScript",
    `${fence}\n${example.native}\n${fence}`,
    "## React",
    `${fence}tsx\n${example.react}\n${fence}`,
    "## Agent workflow",
    "1. Inspect the project and read the actual source, types, and stylesheet for this package.",
    "2. Reuse the native controller. Use the React adapter only in a React surface.",
    "3. Adapt styles and data connections to the project. Do not recreate the gesture or state engine.",
    "4. Connect destroy and unsubscribe callbacks to the owner lifecycle.",
    "5. Verify keyboard access, pointer/touch behavior, resize, empty/one-item states, errors, reduced motion, and teardown where applicable.",
    "6. Report the actual checks and remaining browser/device limits.",
    "## Source",
    `${library.packageName.replace("@reuse-sh/", "packages/")}/src`,
    "License: MIT for original library code. Preserve dependency and asset license notices.",
  ].join("\n\n")}\n`;
}
export const agentGuide =
  "# Reuse integration guide\n\nRead /llms.txt, then the selected library guide at /{library}/guide.md. Reuse the native implementation and adapt the integration. Packages are local workspace code and not published to npm. Read actual types, import only the required entry points and CSS, connect teardown, and exercise the result in the host project. Do not invent API methods, claim unsupported media or devices, or publish packages as part of an integration. Original code is MIT.\n";
