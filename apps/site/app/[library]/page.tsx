import { findLibrary, libraries } from "@reuse-sh/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyControl } from "../../components/copy-control";
import { Icon, type IconName } from "../../components/icons";
import { LibraryDemo } from "../../components/library-demo";
import { LibraryShell } from "../../components/library-shell";
import { libraryGuide } from "../../lib/guides";

export const dynamicParams = false;
export function generateStaticParams() {
  return libraries.map((library) => ({ library: library.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ library: string }>;
}): Promise<Metadata> {
  const library = findLibrary((await params).library);
  return { title: library?.name, description: library?.description };
}
export default async function LibraryPage({
  params,
}: {
  params: Promise<{ library: string }>;
}) {
  const library = findLibrary((await params).library);
  if (!library) notFound();
  return (
    <LibraryShell library={library}>
      <header className="library-header">
        <h1>{library.name}</h1>
        <p>{library.description}</p>
        <div className="library-header-actions">
          <Link
            className="button button-dark"
            href={`/${library.slug}/getting-started`}
          >
            Get started <Icon name="arrow" size={14} />
          </Link>
          <CopyControl
            value={libraryGuide(library)}
            label="Copy agent guide"
            text
          />
        </div>
      </header>
      <div className="library-demo-frame">
        <LibraryDemo slug={library.slug} />
      </div>
      <section className="library-features" aria-label="Features">
        {library.features.map((feature, index) => (
          <div key={feature}>
            <Icon
              name={
                (index === 0
                  ? library.slug
                  : ["check", "code", "book"][index - 1]) as IconName
              }
              size={20}
            />
            <p>{feature}</p>
          </div>
        ))}
      </section>
      <div className="library-reading-link">
        <Link className="text-link" href={`/${library.slug}/examples`}>
          Explore the examples <Icon name="arrow" size={14} />
        </Link>
      </div>
    </LibraryShell>
  );
}
