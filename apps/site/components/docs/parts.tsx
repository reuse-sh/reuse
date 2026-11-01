import {
  docHref,
  docPages,
  installCommand,
  type Library,
  type Row,
} from "@reuse-sh/catalog";
import Link from "next/link";
import type { ReactNode } from "react";
import { libraryGuide } from "../../lib/guides";
import { CopyControl } from "../copy-control";
import { Icon } from "../icons";
import { CodeBlock } from "../shell/code-block";
import { DocIcon, type DocIconName } from "./doc-icon";

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
        <Link className="d-pager-prev" href={docHref(library, prev.path)}>
          <small>
            <Icon name="left" size={13} className="d-pager-icon" />
            Previous
          </small>
          <span className="d-pager-title">{prev.title}</span>
        </Link>
      ) : null}
      {next ? (
        <Link className="d-pager-next" href={docHref(library, next.path)}>
          <small>
            Next
            <Icon name="right" size={13} className="d-pager-icon" />
          </small>
          <span className="d-pager-title">{next.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}

export function OverviewActions({ library }: { library: Library }) {
  return (
    <div className="d-actions">
      <Link className="c-btn" href={docHref(library, "getting-started")}>
        Get started
      </Link>
      <CopyControl
        value={libraryGuide(library)}
        label="Copy agent guide"
        text
      />
    </div>
  );
}

export function Keys({ children }: { children: ReactNode }) {
  return <p className="d-keys">{children}</p>;
}

export function Features({
  rows,
  icons,
  columns = 3,
}: {
  rows: readonly Row[];
  icons: readonly DocIconName[];
  columns?: 3 | 4;
}) {
  return (
    <ul className={`c-feats ${columns === 3 ? "c-feats-3" : "d-feats-4"}`}>
      {rows.map(([name, text], index) => (
        <li key={name}>
          <DocIcon name={icons[index] ?? "code"} />
          <p>
            <b>{name}.</b> {text}
          </p>
        </li>
      ))}
    </ul>
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
        { label: "JavaScript", code: js },
        { label: "React", code: react },
      ]}
    />
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

export function AgentCard({ library }: { library: Library }) {
  return (
    <div className="c-card d-cta">
      <div className="c-card-in">
        <h2 className="d-cta-title">
          Hand {library.name} to your coding agent
        </h2>
        <p className="d-cta-text">
          The guide lists the markup {library.name} expects, its options, and
          the checks to run once it is in. Paste this prompt into your agent.
        </p>
        <pre className="d-prompt">{library.agentPrompt}</pre>
        <div className="d-cta-actions">
          <CopyControl value={library.agentPrompt} label="Copy prompt" text />
          <a className="c-link" href={`/${library.slug}/guide.md`}>
            reuse.sh/{library.slug}/guide.md
          </a>
        </div>
      </div>
    </div>
  );
}
