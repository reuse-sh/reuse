import { libraries } from "@reuse-sh/catalog";
import Link from "next/link";
import { CopyControl } from "../../components/copy-control";
import { Icon, type IconName } from "../../components/icons";
import { agentGuide } from "../../lib/guides";
export default function AgentPage() {
  return (
    <main id="main" className="reading-page">
      <p className="eyebrow">For coding agents</p>
      <h1>
        Read the guide.
        <br />
        Use the real component.
      </h1>
      <p>
        Each library has a small Markdown guide with its API, integration notes,
        and behavior to verify. Start with the library that solves the task.
      </p>
      <div className="library-header-actions">
        <CopyControl value={agentGuide} label="Copy integration guide" text />
        <a className="text-link" href="/llms.txt">
          llms.txt <Icon name="arrow" size={14} />
        </a>
      </div>
      <div className="library-index-grid" style={{ marginTop: 40 }}>
        {libraries.map((library) => (
          <Link href={`/${library.slug}/guide.md`} key={library.slug}>
            <Icon name={library.slug as IconName} />
            <h3>
              {library.name}
              <Icon name="arrow" size={13} />
            </h3>
            <p>Read the Markdown guide.</p>
          </Link>
        ))}
      </div>
      <section className="reading-section">
        <h2>Keep the mechanics shared</h2>
        <p>
          Inspect the host project, read the actual types, adapt styles and
          data, and connect teardown. Exercise the result in the real interface.
          Do not recreate the controller or invent an installation command for
          an unpublished package.
        </p>
      </section>
    </main>
  );
}
