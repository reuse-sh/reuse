import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="c-foot">
      <div className="c-foot-in c-col">
        <span className="c-foot-logo">reuse</span>
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
