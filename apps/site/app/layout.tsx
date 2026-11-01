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
    default: "Reuse · Interface parts for any stack",
    template: "%s · Reuse",
  },
  description:
    "A lightbox, a carousel, tooltips, loaders and more, as plain browser modules with React wrappers and guides your coding agent can follow on any stack.",
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
