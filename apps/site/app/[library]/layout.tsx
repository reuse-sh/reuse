import "../styles/docs.css";
import { findLibrary } from "@reuse-sh/catalog";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { libraryParams } from "../../components/docs/doc-route";
import { LibraryFrame } from "../../components/docs/library-frame";

export const dynamicParams = false;
export const generateStaticParams = libraryParams;

export default async function LibraryLayout({
  params,
  children,
}: {
  params: Promise<{ library: string }>;
  children: ReactNode;
}) {
  const { library: slug } = await params;
  if (!findLibrary(slug)) notFound();
  return <LibraryFrame slug={slug}>{children}</LibraryFrame>;
}
