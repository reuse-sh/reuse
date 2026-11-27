import { Container } from "@/components/ui/container";
import { DocLink as Link } from "../docs/doc-link";
import { Logo } from "./logo";

export function SiteFooter({ layout }: { layout?: "content" | "docs" }) {
  return (
    <footer className="mt-32 pt-7 pb-11">
      <Container
        size={layout}
        className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5 text-ui"
      >
        <span className="inline-flex self-center">
          <Logo />
          <span className="sr-only">Reuse</span>
        </span>
        <nav
          className="-my-0.5 ml-auto flex gap-4 text-muted-foreground"
          aria-label="Footer"
        >
          <Link
            className="py-0.5 transition-colors hover:text-foreground"
            href="/for-agents"
          >
            Agent guides
          </Link>
          <Link
            className="py-0.5 transition-colors hover:text-foreground"
            href="/tools"
          >
            Tools
          </Link>
          <a
            className="py-0.5 transition-colors hover:text-foreground"
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
