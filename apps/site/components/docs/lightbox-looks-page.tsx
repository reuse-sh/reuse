import { findLibrary } from "@reuse-sh/catalog";
import { notFound } from "next/navigation";
import { FrameworkOnly } from "../../lib/framework-context";
import { CodeBlock } from "../shell/code-block";
import { lookCode, looks } from "./lightbox-looks";
import { LooksSwitcher } from "./lightbox-looks-switcher";
import { C, CodePair, Install, Section, Text } from "./parts";

function LookCode({ id, name }: { id: string; name: string }) {
  const code = lookCode(id);
  if (code.kind === "theme")
    return (
      <>
        <CodeBlock
          tabs={{ code: code.js, lang: "ts" }}
          caption={`${name} setup`}
          snippetId={`lightbox-look-${id}`}
          codeRole="setup"
        />
        {code.css ? (
          <CodeBlock
            tabs={{ code: code.css, lang: "css" }}
            caption={id === "page" ? "Page colors" : `${name} styles`}
            snippetId={`lightbox-look-${id}-css`}
            codeRole="setup"
          />
        ) : null}
      </>
    );
  return (
    <>
      <FrameworkOnly value="html">
        <CodeBlock
          tabs={{ lang: "html", code: code.html }}
          caption="Gallery markup"
          snippetId={`lightbox-look-${id}-markup`}
          codeRole="usage"
        />
      </FrameworkOnly>
      <CodePair
        js={code.js}
        react={code.react}
        snippetId={`lightbox-look-${id}-setup`}
        codeRole="setup"
      />
      {code.css ? (
        <CodeBlock
          tabs={{ code: code.css, lang: "css" }}
          caption="lightbox-style.css"
          snippetId={`lightbox-look-${id}-styles`}
          codeRole="setup"
        />
      ) : null}
      {code.chrome ? (
        <CodeBlock
          tabs={{ code: code.chrome, lang: "ts" }}
          caption="lightbox-chrome.js"
          snippetId={`lightbox-look-${id}-chrome`}
          codeRole="setup"
        />
      ) : null}
      <FrameworkOnly value="html">
        <CodeBlock
          tabs={{ code: code.cleanup, lang: "ts" }}
          caption="View cleanup"
          snippetId={`lightbox-look-${id}-cleanup`}
          codeRole="cleanup"
        />
      </FrameworkOnly>
    </>
  );
}

export function LightboxLooksPage() {
  const library = findLibrary("lightbox");
  if (!library) notFound();
  return (
    <>
      <LooksSwitcher
        looks={looks}
        panels={looks.map((look) => (
          <LookCode key={look.id} id={look.id} name={look.name} />
        ))}
      />
      <Section title="Install">
        <Install library={library} />
        <Text>
          Import <C>base.css</C> and <C>theme.css</C>, then a file from{" "}
          <C>themes/</C> or your own layout stylesheet. Your own{" "}
          <C>--re-lightbox-*</C> values after them win.
        </Text>
      </Section>
    </>
  );
}
