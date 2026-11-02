import type { Metadata } from "next";
import { PrototypePage } from "./prototype-page";

export const metadata: Metadata = {
  title: "Carousel",
  robots: { index: false, follow: false },
};

export default async function PreviewEntry({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PrototypePage query={await searchParams} />;
}
