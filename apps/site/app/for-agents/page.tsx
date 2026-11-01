import "../styles/home.css";
import { libraries } from "@reuse-sh/catalog";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import type { Metadata } from "next";
import { CopyControl } from "../../components/copy-control";
import { Icon, type IconName } from "../../components/icons";
import { agentPrompt } from "../../lib/prompt";

export const metadata: Metadata = { title: "Agent guides" };

const steps = [
  [
    "Try it on the site.",
    "Each library page opens with the working part, so you can judge how it behaves before anyone writes code.",
  ],
  [
    "Hand your agent the guide.",
    "Paste the prompt or a guide link. The guide lists the markup the part expects, its options, and how to remove it cleanly.",
  ],
  [
    "Check what it built.",
    "Every guide ends with checks: keyboard, narrow screens, reduced motion and teardown. Ask your agent to run them and show you the result.",
  ],
];

export default function AgentGuidesPage() {
  return (
    <main id="main" className="c-col h-page">
      <h1 className="c-h1">Agent guides</h1>
      <p className="h-lead">
        Every library has a guide written for coding agents. Give your agent the
        link and say where the part should go.
      </p>
      <ol className="h-steps">
        {steps.map(([title, text], index) => (
          <li key={title} className="c-card">
            <div className="c-card-in">
              <span className="h-step-n">{index + 1}</span>
              <p>
                <b>{title}</b> {text}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="c-card h-prompt">
        <div className="c-card-in">
          <pre>{agentPrompt}</pre>
          <div className="h-prompt-bar">
            <CopyControl value={agentPrompt} label="Copy prompt" text />
          </div>
        </div>
      </div>
      <h2 className="c-h2 h-guides-h">Guides</h2>
      <MovingHighlight className="h-guides">
        {libraries.map((library) => (
          <a
            key={library.slug}
            className="h-guide"
            data-reuse-row=""
            href={`/${library.slug}/guide.md`}
          >
            <Icon name={library.slug as IconName} size={18} />
            <span className="h-guide-name">{library.name}</span>
            <code>/{library.slug}/guide.md</code>
          </a>
        ))}
      </MovingHighlight>
      <p className="h-index-note">
        The index of every guide is at{" "}
        <a className="c-link" href="/llms.txt">
          /llms.txt
        </a>
        .
      </p>
    </main>
  );
}
