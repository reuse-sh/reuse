"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CopyControl } from "../../../components/copy-control";

const variants = [
  { id: "current", number: "1", label: "Current" },
  { id: "disclosure", number: "2", label: "Disclosure" },
  { id: "tabs", number: "3", label: "Underlined tabs" },
] as const;

export function PrototypePicker({ variant }: { variant: string }) {
  const query = useSearchParams();
  const router = useRouter();
  const link = (number: string) => {
    const next = new URLSearchParams(query);
    next.set("__v", number);
    next.delete("view");
    next.delete("file");
    return `/preview/carousel?${next}`;
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, button, a, summary, [contenteditable="true"], [role="tablist"]',
        )
      )
        return;
      const next = variants.find((item) => item.number === event.key);
      if (!next) return;
      const params = new URLSearchParams(query);
      params.set("__v", next.number);
      params.delete("view");
      params.delete("file");
      router.push(`/preview/carousel?${params}`, { scroll: false });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [query, router]);
  const config = JSON.stringify({
    variant: variants.find((item) => item.id === variant)?.label,
    ...(query.get("framework") === "html"
      ? { framework: "HTML + JavaScript" }
      : {}),
  });
  return (
    <nav aria-label="Prototype variants" className="proto-picker">
      {variants.map((item) => (
        <Link
          key={item.id}
          href={link(item.number)}
          scroll={false}
          className="proto-picker-item"
          aria-current={item.id === variant ? "true" : undefined}
        >
          {item.label}
        </Link>
      ))}
      <CopyControl value={config} label="Copy prototype choice" />
    </nav>
  );
}
