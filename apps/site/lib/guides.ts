import {
  getUsage,
  installCommand,
  type Library,
  usageMarkdown,
} from "@reuse-sh/catalog";

const fence = "```";
export function libraryGuide(library: Library) {
  const react = getUsage(library.slug, "getting-started", "react");
  const html = getUsage(library.slug, "getting-started", "html");
  if (!react || !html) throw new Error(`Missing usage for ${library.slug}.`);
  return [
    `# ${library.name}`,
    library.description,
    `Package: ${library.packageName}`,
    "## Principles",
    "Keep these rules when adapting the library to any framework.",
    ...library.principles.map(([name, text]) => `- ${name}. ${text}`),
    "## Install",
    `${fence}bash\n${installCommand(library)}\n${fence}`,
    "## React with Tailwind",
    usageMarkdown(react),
    "## HTML + JavaScript",
    usageMarkdown(html),
    "## Integration notes",
    ...library.notes.map((text) => `- ${text}`),
    "## API",
    ...library.api.map(([name, text]) => `- \`${name}\`: ${text}`),
    "## Verification",
    "Use the actual package interface. Verify keyboard access, repeated input, failure, resize, reduced motion and teardown where relevant. Keep initial content useful without JavaScript.",
    "## Source",
    `https://github.com/reuse-sh/reuse/tree/main/${library.packageName.replace("@reuse-sh/", "packages/")}/src`,
    "License: MIT for original library code. Preserve dependency and asset notices.",
  ]
    .concat("")
    .join("\n\n");
}
export const agentGuide =
  "# Reuse integration guide\n\nRead /llms.txt, then the selected library guide at /{library}/guide.md. Keep its principles. Install the package, reuse the native controller and use the React adapter for React lifecycle. Import only the required entry points and styles. Connect teardown and verify the result in its actual host. Report the checks and their limits.\n";
