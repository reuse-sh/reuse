import "./preview.css";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export default function PreviewLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return children;
}
