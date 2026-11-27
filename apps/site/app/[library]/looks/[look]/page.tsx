import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LightboxLaunch } from "../../../../components/docs/lightbox-launch";
import { LightboxLookOpen } from "../../../../components/docs/lightbox-look-open";
import { lookPreview, looks } from "../../../../components/docs/lightbox-looks";

type Params = Promise<{ library: string; look: string }>;

export const dynamicParams = false;
export const generateStaticParams = () =>
  looks.map(({ id }) => ({ library: "lightbox", look: id }));

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { look } = await params;
  const found = looks.find(({ id }) => id === look);
  return {
    title: `${found?.name ?? "Look"} viewer · Lightbox`,
    robots: { index: false },
  };
}

/** The viewer the Looks page frames: one look's gallery, opened by ?open. */
export default async function Page({ params }: { params: Params }) {
  const { look } = await params;
  const preview = lookPreview(look);
  if (!preview) notFound();
  return (
    <main id="main" className="min-h-dvh bg-background p-10">
      <LightboxLookOpen>
        <LightboxLaunch {...preview} />
      </LightboxLookOpen>
    </main>
  );
}
