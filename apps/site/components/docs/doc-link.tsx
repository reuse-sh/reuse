"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { frameworkHref } from "../../lib/framework";
import { useFramework } from "../../lib/framework-context";

export function DocLink({
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const framework = useFramework();
  return <Link {...props} href={frameworkHref(href, framework)} />;
}
