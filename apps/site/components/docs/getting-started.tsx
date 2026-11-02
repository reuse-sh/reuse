import { getUsage, type Library } from "@reuse-sh/catalog";
import type { Framework } from "../../lib/framework";
import { Install, Section, Text } from "./parts";
import { UsageContent } from "./usage-content";
export function GettingStarted({
  library,
  framework,
}: {
  library: Library;
  framework: Framework;
}) {
  const sections = getUsage(library.slug, "getting-started", framework);
  if (!sections)
    throw new Error(`Missing getting-started usage for ${library.slug}.`);
  return (
    <>
      <Section title="Install">
        <Install library={library} />
        <Text>
          Import the package entry points shown below in your application. A
          bundler must process CSS imports.
        </Text>
      </Section>
      <UsageContent sections={sections} />
    </>
  );
}
