import "./globals.css";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import type { ReactNode } from "react";

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
        <a
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-card focus:px-3 focus:py-2 focus:shadow-raised"
          href="#main"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
