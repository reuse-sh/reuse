import type { UsageSection } from "./usage-types.js";
export function usageMarkdown(
  sections: readonly UsageSection[],
  level: 3 | 4 = 3,
) {
  const fence = "```";
  return sections
    .map((section) =>
      [
        `${"#".repeat(level)} ${section.title}`,
        ...section.blocks.map((block) =>
          block.kind === "prose"
            ? block.text
            : `${fence}${block.language}\n${block.code}\n${fence}`,
        ),
      ].join("\n\n"),
    )
    .join("\n\n");
}
