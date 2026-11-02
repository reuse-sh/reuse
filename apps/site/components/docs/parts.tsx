import {
  docHref,
  docPages,
  installCommand,
  type Library,
  libraryPrompt,
  type Row,
} from "@reuse-sh/catalog";
import type { ReactNode } from "react";
import { CopyControl, PromptButton } from "../copy-control";
import { Icon } from "../icons";
import { CodeBlock } from "../shell/code-block";
import { DocIcon, type DocIconName } from "./doc-icon";
import { DocLink } from "./doc-link";

export function PageTitle({ title, lead }: { title: string; lead?: string }) {
  return (
    <header className="d-head">
      <h1 className="c-h1">{title}</h1>
      {lead ? <p className="d-lead">{lead}</p> : null}
    </header>
  );
}

export function Pager({ library, path }: { library: Library; path: string }) {
  const pages = docPages(library);
  const index = pages.findIndex((page) => page.path === path);
  const prev = pages[index - 1];
  const next = pages[index + 1];
  return (
    <nav className="d-pager" aria-label="Previous and next page">
      {prev ? (
        <DocLink className="d-pager-prev" href={docHref(library, prev.path)}>
          <small>
            <Icon name="left" size={13} className="d-pager-icon" />
            Previous
          </small>
          <span className="d-pager-title">{prev.title}</span>
        </DocLink>
      ) : null}
      {next ? (
        <DocLink className="d-pager-next" href={docHref(library, next.path)}>
          <small>
            Next
            <Icon name="right" size={13} className="d-pager-icon" />
          </small>
          <span className="d-pager-title">{next.title}</span>
        </DocLink>
      ) : null}
    </nav>
  );
}

export function OverviewActions({ library }: { library: Library }) {
  return (
    <div className="d-actions">
      <PromptButton prompt={libraryPrompt(library)} />
      <DocLink
        className="c-btn-quiet"
        href={docHref(library, "getting-started")}
      >
        Get started
      </DocLink>
    </div>
  );
}

export function Keys({ children }: { children: ReactNode }) {
  return <p className="d-keys">{children}</p>;
}

export function Principles({
  rows,
  icons,
}: {
  rows: readonly Row[];
  icons: readonly DocIconName[];
}) {
  return (
    <>
      <h2 className="c-h3 d-principles">Principles</h2>
      <ul
        className={`c-feats ${rows.length === 4 ? "d-feats-4" : "c-feats-3"}`}
      >
        {rows.map(([name, text], index) => (
          <li key={name}>
            <DocIcon name={icons[index] ?? "code"} />
            <p>
              <b>{name}.</b> {text}
            </p>
          </li>
        ))}
      </ul>
    </>
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
    <>
      <h2 className="c-h3">{title}</h2>
      {children}
    </>
  );
}

export function Text({ children }: { children: ReactNode }) {
  return <p className="c-text">{children}</p>;
}

export function C({ children }: { children: ReactNode }) {
  return <code className="d-inline">{children}</code>;
}

export function Install({ library }: { library: Library }) {
  return <CodeBlock tabs={{ code: installCommand(library), lang: "bash" }} />;
}

export function CodePair({ js, react }: { js: string; react: string }) {
  return (
    <CodeBlock
      tabs={[
        { label: "JavaScript", code: js, lang: "ts" },
        { label: "React", code: react, lang: "tsx" },
      ]}
    />
  );
}

/** Code in one language with no tabs, such as the HTML of a CSS-only example. */
export function SingleCode({
  code,
  lang,
}: {
  code: string;
  lang: "css" | "html";
}) {
  return <CodeBlock tabs={{ code, lang }} />;
}

/** The card a live example sits in, apart from the page text. */
export function Stage({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="c-card d-stage-card">
      <div className={`c-card-in d-stage ${className}`}>{children}</div>
    </div>
  );
}

export function ExampleCode({ js, react }: { js: string; react: string }) {
  return (
    <section className="d-ex-code" aria-label="Code">
      <CodePair js={js} react={react} />
    </section>
  );
}

export function ApiTable({ rows }: { rows: readonly Row[] }) {
  return (
    <div className="d-api">
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, text]) => (
            <tr key={name}>
              <th scope="row">
                <code>{name}</code>
              </th>
              <td>{text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A compact card at the end of a page with the prompt that builds it. */
export function AgentPrompt({ prompt }: { prompt: string }) {
  return (
    <section className="c-card d-agent" aria-label="Prompt for your agent">
      <div className="c-card-in">
        <div className="d-agent-bar">
          <p>Hand this page to your coding agent.</p>
          <CopyControl value={prompt} label="Copy" text />
        </div>
        <pre className="d-prompt">{prompt}</pre>
      </div>
    </section>
  );
}
