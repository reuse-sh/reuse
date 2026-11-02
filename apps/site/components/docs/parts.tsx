import {
  docHref,
  docPages,
  installCommand,
  type Library,
  type Row,
} from "@reuse-sh/catalog";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FeatureGrid } from "@/components/ui/features";
import {
  ContentFlow,
  Heading,
  InlineCode,
  Text as Paragraph,
} from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { Icon } from "../icons";
import { CodeBlock } from "../shell/code-block";
import { DocIcon, type DocIconName } from "./doc-icon";
import { DocLink } from "./doc-link";

export function PageTitle({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-10">
      <div className="space-y-2.5">
        <Heading variant="page">{title}</Heading>
        {lead ? (
          <Paragraph variant="lead" className="max-w-prose">
            {lead}
          </Paragraph>
        ) : null}
      </div>
      {children}
    </header>
  );
}
export function Pager({ library, path }: { library: Library; path: string }) {
  const pages = docPages(library);
  const index = pages.findIndex((page) => page.path === path);
  const previous = pages[index - 1];
  const next = pages[index + 1];
  return (
    <nav
      aria-label="Previous and next page"
      className="mt-18 grid grid-cols-2 overflow-hidden rounded-xl bg-card shadow-raised"
    >
      {previous ? (
        <DocLink
          href={docHref(library, previous.path)}
          className="group flex min-w-0 flex-col gap-1 px-4 py-3.5 transition-colors hover:bg-accent"
        >
          <span className="flex items-center gap-1 text-caption leading-4 text-subtle-foreground">
            <Icon
              name="left"
              className="size-3.5 transition-transform group-hover:-translate-x-0.5"
            />
            Previous
          </span>
          <span className="text-ui font-medium text-foreground">
            {previous.title}
          </span>
        </DocLink>
      ) : null}
      {next ? (
        <DocLink
          href={docHref(library, next.path)}
          className={cn(
            "group flex min-w-0 flex-col items-end gap-1 px-4 py-3.5 text-right transition-colors hover:bg-accent",
            previous ? "border-l border-border" : "col-span-2",
          )}
        >
          <span className="flex items-center gap-1 text-caption leading-4 text-subtle-foreground">
            Next
            <Icon
              name="right"
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </span>
          <span className="text-ui font-medium text-foreground">
            {next.title}
          </span>
        </DocLink>
      ) : null}
    </nav>
  );
}
export function Keys({ children }: { children: ReactNode }) {
  return (
    <Paragraph variant="label" className="text-subtle-foreground">
      {children}
    </Paragraph>
  );
}
export function Principles({
  rows,
  icons,
}: {
  rows: readonly Row[];
  icons: readonly DocIconName[];
}) {
  return (
    <section className="space-y-6">
      <Heading as="h2" variant="subsection">
        Principles
      </Heading>
      <FeatureGrid
        columns={rows.length === 4 ? 2 : 3}
        items={rows.map(([name, text], index) => ({
          title: name,
          description: text,
          icon: <DocIcon name={icons[index] ?? "code"} />,
        }))}
      />
    </section>
  );
}

export function Section({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <Heading as="h2" variant="subsection">
        {title}
      </Heading>
      <ContentFlow>{children}</ContentFlow>
    </section>
  );
}
export function Text({ children }: { children: ReactNode }) {
  return <Paragraph className="max-w-prose">{children}</Paragraph>;
}
export function C({ children }: { children: ReactNode }) {
  return <InlineCode>{children}</InlineCode>;
}
export function Install({ library }: { library: Library }) {
  return (
    <CodeBlock
      tabs={{ code: installCommand(library), lang: "bash" }}
      caption="Terminal"
      snippetId="install"
    />
  );
}
export function CodePair({
  js,
  react,
  snippetId,
  codeRole,
}: {
  js: string;
  react: string;
  snippetId?: string;
  codeRole?: string;
}) {
  return (
    <CodeBlock
      snippetId={snippetId}
      codeRole={codeRole}
      tabs={[
        { label: "JavaScript", code: js, lang: "ts" },
        { label: "React", code: react, lang: "tsx" },
      ]}
    />
  );
}
export function Stage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card>
      <CardContent
        padding="roomy"
        data-slot="example-stage"
        className={cn(
          "grid grid-cols-1 min-h-demo content-center gap-6",
          className,
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}
export function ApiTable({ rows }: { rows: readonly Row[] }) {
  return (
    <div className="overflow-x-auto rounded-panel bg-card p-4 shadow-raised">
      <table className="w-full text-left text-ui">
        <thead>
          <tr className="border-b border-border text-subtle-foreground">
            <th className="p-3 font-medium">Name</th>
            <th className="p-3 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, text]) => (
            <tr key={name} className="border-b border-border last:border-0">
              <th className="p-3 align-top font-mono text-caption font-normal text-foreground">
                <code>{name}</code>
              </th>
              <td className="p-3 text-muted-foreground">{text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
