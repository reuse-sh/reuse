import Link from "next/link";
import { Icon } from "../icons";

export function SiteFooter() {
  return (
    <footer className="c-foot">
      <div className="c-foot-in c-col">
        <span className="c-foot-logo">
          <Icon name="logo" size={16} />
          Reuse
        </span>
        <nav aria-label="Footer">
          <Link href="/for-agents">Agent guides</Link>
          <Link href="/tools">Tools</Link>
          <a href="https://github.com/reuse-sh/reuse">GitHub</a>
          <a href="https://github.com/reuse-sh/reuse/blob/main/LICENSE">
            License
          </a>
        </nav>
      </div>
    </footer>
  );
}
