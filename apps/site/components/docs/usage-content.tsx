import type { UsageSection } from "@reuse-sh/catalog";
import { Fragment } from "react";
import { InlineCode, Text } from "@/components/ui/typography";
import { CodeBlock } from "../shell/code-block";
import type { CodeLang } from "../shell/highlight";
import { Section } from "./parts";

function Prose({ text }: { text: string }) {
  return (
    <Text className="max-w-prose">
      {Array.from(text.matchAll(/`[^`]+`|[^`]+|`/g), (match) => (
        <Fragment key={match.index}>
          {match[0].length > 1 &&
          match[0].startsWith("`") &&
          match[0].endsWith("`") ? (
            <InlineCode>{match[0].slice(1, -1)}</InlineCode>
          ) : (
            match[0]
          )}
        </Fragment>
      ))}
    </Text>
  );
}
export function UsageContent({
  sections,
}: {
  sections: readonly UsageSection[];
}) {
  return (
    <>
      {sections.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.blocks.map((block) =>
            block.kind === "prose" ? (
              <Prose key={block.text} text={block.text} />
            ) : (
              <CodeBlock
                key={block.id}
                tabs={{
                  code: block.code,
                  lang: (block.language === "javascript"
                    ? "ts"
                    : block.language) as CodeLang,
                }}
                caption={
                  block.label ??
                  {
                    tsx: "React",
                    html: "HTML",
                    css: "CSS",
                    javascript: "JavaScript",
                    bash: "Terminal",
                    json: "JSON",
                  }[block.language]
                }
                snippetId={block.id}
                codeRole={block.role ?? "usage"}
              />
            ),
          )}
        </Section>
      ))}
    </>
  );
}
