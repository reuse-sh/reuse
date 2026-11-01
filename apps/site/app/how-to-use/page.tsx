import Link from "next/link";
import { Icon } from "../../components/icons";
import { IntegrationSteps } from "../../components/integration-steps";
export default function HowToUsePage() {
  return (
    <main id="main" className="reading-page">
      <p className="eyebrow">Using Reuse</p>
      <h1>A component you can keep.</h1>
      <p>
        Start from the implementation, give your agent the guide, and make it
        part of the project you already have.
      </p>
      <IntegrationSteps wide />
      <section className="reading-section">
        <h2>One source for the mechanics</h2>
        <p>
          Use the browser module in a theme or plain page. Use the adapter in
          React. Each library owns its lifecycle and cleanup, so fixing behavior
          does not require rewriting the integration.
        </p>
        <p>
          CSS is opt-in and namespaced. Start with the default presentation,
          then match your type, spacing, surfaces, and controls.
        </p>
      </section>
      <section id="verify" className="reading-section">
        <h2>Check where it will be used</h2>
        <p>
          Use real content sizes. Try keyboard access, resize, touch where
          available, reduced motion, failure, and removal while work is pending.
          A successful build proves compilation. It does not prove gestures or
          focus.
        </p>
      </section>
      <section className="reading-section">
        <h2>Give your agent the context</h2>
        <p>
          The component guide includes the current API, behavior, example, and
          source location. It keeps the integration grounded in code that
          exists.
        </p>
        <Link className="text-link" href="/for-agents">
          Read the agent guide <Icon name="arrow" size={14} />
        </Link>
      </section>
      <p className="workspace-note">
        The packages are implemented locally and licensed under MIT. npm
        publication and migrations into existing products are separate release
        steps.
      </p>
    </main>
  );
}
