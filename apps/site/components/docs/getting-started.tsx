import type { Library } from "@reuse-sh/catalog";
import type { ReactNode } from "react";
import type { Framework } from "../../lib/framework";
import { CodeBlock } from "../shell/code-block";
import { C, Install, Section, Text } from "./parts";

const fallback: Record<string, string> = {
  lightbox:
    "Images and ordinary links stay in the page. JavaScript adds the modal viewer, paging and zoom.",
  carousel:
    "The strip scrolls and snaps with CSS. JavaScript adds dragging, the active counter and controls.",
  annotations:
    "The image and existing notes are rendered as HTML. JavaScript adds editing and recalculates the layout when its container changes.",
  avatars:
    "Photos, initials and badges are in the initial markup. JavaScript handles failed images and measures badge and group cutouts.",
  loaders:
    "Static dots and a readable status remain visible. JavaScript replaces the static figure with the animated canvas.",
  shadows:
    "Every shadow and card pattern works from the stylesheet alone. No JavaScript is required for the shadows.",
  "easing-gradients":
    "The initial HTML has a CSS gradient. You can also compute an eased gradient on the server; only scroll-aware fading needs a browser controller.",
  "floating-tooltip":
    "The buttons and links keep their accessible names. JavaScript adds the floating hint, so essential instructions stay in the page itself.",
  "moving-highlight":
    "Links, labels and the selected state remain in HTML. JavaScript moves the decorative background and manages the demonstrated menu or tab keyboard behavior.",
  "hold-to-confirm":
    "The action starts disabled. JavaScript enables the hold controller; an unenhanced button cannot confirm an action.",
  "copy-button":
    "The text to copy stays readable and selectable. The copy action is enabled when the browser controller is ready.",
};

export function GettingStarted({
  library,
  framework,
  children,
}: {
  library: Library;
  framework: Framework;
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <Section title="Install">
        <Install library={library} />
      </Section>
      <Section
        title={framework === "react" ? "Add the component" : "Add the files"}
      >
        <Text>
          {framework === "react" ? (
            <>
              Use a React 19 project with Tailwind CSS 4 configured. Copy{" "}
              <C>example.tsx</C> from the Code tab, then render the component.
              The file includes its data and package stylesheet imports.
            </>
          ) : (
            <>
              Copy <C>index.html</C>, <C>styles.css</C>
              {library.slug === "shadows" ? null : (
                <>
                  {" "}
                  and <C>main.js</C>
                </>
              )}{" "}
              from the Code tab into the same folder in a project with an ES
              module bundler, such as Vite.
            </>
          )}
        </Text>
        <CodeBlock
          tabs={{
            code:
              framework === "react"
                ? 'import { Example } from "./example";\n\nexport default function Page() {\n  return <Example />;\n}'
                : "npm install --save-dev vite\nnpx vite",
            lang: framework === "react" ? "tsx" : "bash",
          }}
        />
        <Text>
          {framework === "react" ? (
            <>
              Tailwind styles the example. Package CSS keeps the component
              mechanics independent of your styling framework. Follow the{" "}
              <a
                className="c-link"
                href="https://tailwindcss.com/docs/installation/using-vite"
                target="_blank"
                rel="noreferrer"
              >
                Tailwind installation guide
              </a>{" "}
              if your project does not use it yet.
            </>
          ) : (
            <>
              The HTML links to the stylesheet.
              {library.slug === "shadows"
                ? " This example needs no JavaScript."
                : " The script loads as an ES module."}
              The bundler resolves the package imports. Keep the initial markup
              and its <C>re-</C> classes when adapting the example.
            </>
          )}
        </Text>
      </Section>
      <Section title="Before JavaScript">
        <Text>{fallback[library.slug]}</Text>
        {framework === "react" ? (
          <Text>
            Server rendering or prerendering produces this initial HTML. A
            client-only React application still needs JavaScript to render its
            first page.
          </Text>
        ) : null}
      </Section>
      <Section title="Adapt it">
        <Text>
          Replace the synthetic content with your own data and keep the
          library's principles. The complete source includes setup, updates and
          cleanup. For another framework, initialize the browser controller
          after mounting the markup and destroy it when the owner unmounts.
        </Text>
      </Section>
    </>
  );
}
