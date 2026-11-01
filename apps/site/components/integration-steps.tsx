import { findLibrary } from "@reuse-sh/catalog";
import Image from "next/image";
import Link from "next/link";
import { libraryGuide } from "../lib/guides";
import { CopyControl } from "./copy-control";
import { Icon } from "./icons";

export function IntegrationSteps({ wide = false }: { wide?: boolean }) {
  const lightbox = findLibrary("lightbox");
  return (
    <div className={`steps-grid${wide ? " steps-wide" : ""}`}>
      <article className="step-card reuse-shadow-ring-sm">
        <span className="step-number">1</span>
        <h3>
          <Link href="/lightbox">
            Find your component <Icon name="arrow" size={16} />
          </Link>
        </h3>
        <p>Try the real thing. Choose the behavior your project needs.</p>
        <div className="step-preview step-preview-library" aria-hidden="true">
          <div className="preview-label">
            <Icon name="lightbox" size={16} />
            <span>Lightbox</span>
            <span className="preview-pill">Native</span>
          </div>
          <div className="preview-photos">
            <Image
              src="/images/lake.webp"
              alt=""
              width={240}
              height={320}
              sizes="180px"
            />
            <Image
              src="/images/coast.webp"
              alt=""
              width={240}
              height={320}
              sizes="180px"
            />
            <Image
              src="/images/forest.webp"
              alt=""
              width={240}
              height={320}
              sizes="180px"
            />
          </div>
        </div>
      </article>
      <article className="step-card reuse-shadow-ring-sm">
        <span className="step-number">2</span>
        <h3>
          <Link href="/for-agents">
            Give your agent the guide <Icon name="arrow" size={16} />
          </Link>
        </h3>
        <p>The API, integration notes, and checks. All in one place.</p>
        <div className="step-preview step-preview-guide">
          <div className="preview-file">
            <Icon name="book" size={17} />
            <span>lightbox / guide.md</span>
          </div>
          <div className="guide-sections" aria-hidden="true">
            <span>Behavior</span>
            <span>Native & React API</span>
            <span>Integration checks</span>
          </div>
          {lightbox ? (
            <CopyControl
              value={libraryGuide(lightbox)}
              label="Copy Lightbox guide"
              text
            />
          ) : null}
        </div>
      </article>
      <article className="step-card reuse-shadow-ring-sm">
        <span className="step-number">3</span>
        <h3>
          <Link href="/how-to-use#verify">
            Make it part of your project <Icon name="arrow" size={16} />
          </Link>
        </h3>
        <p>Connect your content. Match your design. Keep the mechanics.</p>
        <div className="step-preview step-preview-project" aria-hidden="true">
          <div className="preview-browser">
            <span />
            <span />
            <span />
            <i>Your project</i>
          </div>
          <div className="preview-project-content">
            <div className="preview-project-title">A weekend away</div>
            <div className="preview-project-images">
              <Image
                src="/images/mountains.webp"
                alt=""
                width={300}
                height={200}
                sizes="200px"
              />
              <Image
                src="/images/woods.webp"
                alt=""
                width={200}
                height={200}
                sizes="100px"
              />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
