import { DocLink as Link } from "../docs/doc-link";
import { Icon } from "../icons";

export function SiteFooter() {
  return (
    <footer className="c-foot mt-[136px] [padding:28px_0_44px]">
      <div className="c-foot-in c-col flex flex-wrap items-baseline [gap:6px_14px] text-[14px]">
        <span className="c-foot-logo inline-flex items-center gap-[6px] self-center font-semibold tracking-[-0.02em]">
          <Icon name="logo" size={16} />
          Reuse
        </span>
        <nav aria-label="Footer">
          <Link href="/for-agents">Agent guides</Link>
          <Link href="/tools">Tools</Link>
          <a
            href="https://github.com/reuse-sh/reuse"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
