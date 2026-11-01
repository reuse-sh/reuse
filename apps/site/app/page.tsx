import { libraries } from "@reuse-sh/catalog";
import Link from "next/link";
import { CarouselDemo, GalleryDemo } from "../components/demos/media";
import { Icon, type IconName } from "../components/icons";
import { IntegrationSteps } from "../components/integration-steps";

export default function HomePage() {
  return (
    <main id="main" className="marketing-main">
      <section className="home-hero">
        <h1>
          Good components,
          <br />
          <span>ready to reuse.</span>
        </h1>
        <p>
          Lightbox, carousel, annotations, and the small interactions you reach
          for in every project. Native browser behavior, with room for your own
          design.
        </p>
        <div className="hero-actions">
          <a className="button button-dark" href="#libraries">
            Explore the libraries <Icon name="down" size={15} />
          </a>
          <Link className="text-link" href="/how-to-use">
            How it works <Icon name="arrow" size={14} />
          </Link>
        </div>
      </section>
      <section className="home-media">
        <div className="section-label">
          <h2>A gallery, with the details worked out.</h2>
          <Link href="/lightbox">
            Explore Lightbox <Icon name="arrow" size={14} />
          </Link>
        </div>
        <GalleryDemo compact />
      </section>
      <section className="home-features" aria-label="What the libraries share">
        {[
          {
            icon: "carousel",
            title: "Native at the core.",
            text: "Touch scrolling, browser controls, and small JavaScript modules that do one job well.",
          },
          {
            icon: "shadows",
            title: "One implementation.",
            text: "Keep the mechanics in one place. Use the same library in React, a theme, or a plain page.",
          },
          {
            icon: "code",
            title: "Ready for your agent.",
            text: "Each guide covers the real API, integration steps, and behavior to check in your project.",
          },
          {
            icon: "annotations",
            title: "Your own interface.",
            text: "Start with a useful default. Adapt the styles and connect your data without rebuilding the behavior.",
          },
        ].map((feature) => (
          <div key={feature.title}>
            <Icon name={feature.icon as IconName} size={22} />
            <p>
              <strong>{feature.title}</strong> {feature.text}
            </p>
          </div>
        ))}
      </section>
      <section className="home-carousel">
        <div className="section-label">
          <h2>Keep the browser’s scroll.</h2>
          <Link href="/carousel">
            Explore Carousel <Icon name="arrow" size={14} />
          </Link>
        </div>
        <CarouselDemo compact />
      </section>
      <section id="libraries" className="library-index">
        <div className="section-label">
          <h2>The libraries</h2>
          <span>Independent parts. Shared care.</span>
        </div>
        <div className="library-index-grid">
          {libraries.map((library) => (
            <Link key={library.slug} href={`/${library.slug}`}>
              <Icon name={library.slug as IconName} size={24} />
              <h3>
                {library.name}
                <Icon name="arrow" size={14} />
              </h3>
              <p>{library.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="home-steps">
        <div className="section-label">
          <h2>Bring one into your project.</h2>
          <Link href="/how-to-use">
            See the workflow <Icon name="arrow" size={14} />
          </Link>
        </div>
        <IntegrationSteps />
      </section>
    </main>
  );
}
