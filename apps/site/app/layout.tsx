import "@reuse-sh/shadows/styles.css";
import "@reuse-sh/carousel/styles.css";
import "@reuse-sh/lightbox/styles.css";
import "@reuse-sh/annotations/styles.css";
import "@reuse-sh/loaders/styles.css";
import "@reuse-sh/interactions/styles.css";
import "@reuse-sh/avatars/styles.css";
import "./globals.css";
import "./styles/shell.css";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import type { ReactNode } from "react";
import { SiteFooter } from "../components/shell/site-footer";
import { SiteHeader } from "../components/shell/site-header";
import { TooltipRoot } from "../components/shell/tooltip-root";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-fraunces",
});

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
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable}`}
    >
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <TooltipRoot />
      </body>
    </html>
  );
}
