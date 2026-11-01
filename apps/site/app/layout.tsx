import "@reuse-sh/shadows/styles.css";
import "@reuse-sh/carousel/styles.css";
import "@reuse-sh/lightbox/styles.css";
import "@reuse-sh/annotations/styles.css";
import "@reuse-sh/loaders/styles.css";
import "@reuse-sh/interactions/styles.css";
import "@reuse-sh/avatars/styles.css";
import "./globals.css";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "../components/icons";
import { LibraryMenu } from "../components/navigation";

export const metadata: Metadata = {
  metadataBase: new URL("https://reuse.sh"),
  title: {
    default: "Reuse · Good components, ready to reuse",
    template: "%s · Reuse",
  },
  description:
    "Native web libraries for the things you use in every project. Lightbox, carousel, annotations, and considered interactions, with React adapters and guides for your agent.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <Link href="/" className="wordmark" aria-label="Reuse home">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            reuse<span>.</span>
          </Link>
          <nav className="global-nav" aria-label="Main navigation">
            <LibraryMenu />
            <Link href="/how-to-use">How to use</Link>
            <Link
              className="agent-nav-link"
              href="/for-agents"
              aria-label="For agents"
            >
              <Icon name="code" size={17} />
              <span>For agents</span>
            </Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <Link href="/" className="footer-wordmark">
            Reuse
          </Link>
          <nav aria-label="Footer">
            <Link href="/how-to-use">How to use</Link>
            <a href="/llms.txt">llms.txt</a>
            <a href="https://opensource.org/license/mit">
              MIT License <Icon name="arrow" size={12} />
            </a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
