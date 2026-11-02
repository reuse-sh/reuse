import "../styles/docs.css";
import "../styles/examples.css";
import { findLibrary } from "@reuse-sh/catalog";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { libraryParams } from "../../components/docs/doc-route";

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
  return children;
}
