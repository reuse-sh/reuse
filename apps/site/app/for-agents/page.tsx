import "../styles/home.css";
import { libraries } from "@reuse-sh/catalog";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import type { Metadata } from "next";
import { PromptButton } from "../../components/copy-control";
import { Icon, type IconName } from "../../components/icons";
import { agentPrompt } from "../../lib/prompt";

export const metadata: Metadata = { title: "Agent guides" };

const steps = [
  [
    "Try it on the site.",
    "Each library page opens with the working part and its principles. You see the rules at work before anyone writes code.",
  ],
  [
    "Hand your agent the guide.",
    "Paste the prompt or a guide link. The guide starts with the principles your agent must keep, then the markup, the options and the cleanup.",
  ],
  [
    "Check that it kept them.",
    "Every guide ends with checks for keyboard, narrow screens, reduced motion and teardown. Ask your agent to run them and show you that each principle still holds.",
  ],
];

export default function AgentGuidesPage() {
  return (
    <main id="main" className="c-col h-page pt-[56px]">
      <h1 className="c-h1">Agent guides</h1>
      <p className="h-lead max-w-[600px] mt-[10px] text-[17px] leading-[27px] text-[color:var(--prose)] text-pretty">
        Every library has a guide written for coding agents. It opens with the
        library's principles, and your agent must keep them on any framework.
        Give it the link and say where the part should go.
      </p>
      <div className="h-actions flex flex-wrap items-center gap-[8px] mt-[36px]">
        <PromptButton prompt={agentPrompt} />
      </div>
      <ol className="h-steps grid [grid-template-columns:repeat(3,_minmax(0,_1fr))] gap-[12px] mt-[40px]">
        {steps.map(([title, text], index) => (
          <li key={title} className="c-card">
            <div className="c-card-in">
              <span className="h-step-n grid place-items-center w-[24px] h-[24px] mb-[80px] rounded-[50%] [background:var(--surface)] shadow-[var(--shadow-control)] text-[12.5px] font-[560] tabular-nums">
                {index + 1}
              </span>
              <p>
                <b>{title}</b> {text}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <h2 className="c-h2 h-guides-h mt-[64px]">Guides</h2>
      <MovingHighlight className="h-guides">
        {libraries.map((library) => (
          <a
            key={library.slug}
            className="h-guide grid [grid-template-columns:18px_168px_minmax(0,_1fr)] items-center gap-[14px] min-h-[44px] [padding:10px_12px] rounded-[10px]"
            data-re-row=""
            href={`/${library.slug}/guide.md`}
          >
            <Icon name={library.slug as IconName} size={18} />
            <span className="h-guide-name font-[540]">{library.name}</span>
            <code>/{library.slug}/guide.md</code>
          </a>
        ))}
      </MovingHighlight>
      <p className="h-index-note mt-[16px] text-[color:var(--prose)]">
        The index of every guide is at{" "}
        <a className="c-link" href="/llms.txt">
          /llms.txt
        </a>
        .
      </p>
    </main>
  );
}
