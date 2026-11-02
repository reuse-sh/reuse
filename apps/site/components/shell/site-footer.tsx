import { Container } from "@/components/ui/container";
import { DocLink as Link } from "../docs/doc-link";
import { Icon } from "../icons";

export function SiteFooter() {
  return (
    <footer className="mt-32 pt-7 pb-11">
      <Container className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5 text-ui">
        <span className="inline-flex items-center gap-1.5 self-center font-semibold tracking-tight">
          <Icon name="logo" size={16} />
          Reuse
        </span>
        <nav
          className="ml-auto flex gap-4 text-muted-foreground"
          aria-label="Footer"
        >
          <Link
            className="transition-colors hover:text-foreground"
            href="/for-agents"
          >
            Agent guides
          </Link>
          <Link
            className="transition-colors hover:text-foreground"
            href="/tools"
          >
            Tools
          </Link>
          <a
            className="transition-colors hover:text-foreground"
            href="https://github.com/reuse-sh/reuse"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </Container>
    </footer>
  );
}
