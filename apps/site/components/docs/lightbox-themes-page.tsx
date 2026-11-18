import { findLibrary } from "@reuse-sh/catalog";
import { notFound } from "next/navigation";
import { CodeBlock } from "../shell/code-block";
import { Kbd } from "../ui/typography";
import { LightboxLaunch } from "./lightbox-launch";
import { LightboxThemeSwitcher } from "./lightbox-theme-switcher";
import {
  lightboxPresets,
  lightboxThemeCode,
  lightboxThemePreview,
  lightboxThemes,
} from "./lightbox-themes";
import { C, Install, Keys, Section, Text } from "./parts";

const names: Record<string, string> = {
  dark: "Dark",
  light: "Light",
  page: "Page",
  photos: "Photos",
};

export function LightboxThemesPage() {
  const library = findLibrary("lightbox");
  if (!library) notFound();
  const themes = Object.keys(lightboxThemes).flatMap((id) => {
    const preview = lightboxThemePreview(id);
    return preview ? [{ id, name: names[id] ?? id, preview }] : [];
  });
  return (
    <>
      <LightboxThemeSwitcher
        themes={themes}
        panels={themes.map(({ id }) => {
          const code = lightboxThemeCode(id);
          return (
            <div key={id} className="space-y-4">
              <Text>{lightboxThemes[id as keyof typeof lightboxThemes]}</Text>
              <CodeBlock
                tabs={{ code: code.js, lang: "ts" }}
                caption={`${names[id]} theme`}
                snippetId={`lightbox-theme-${id}`}
                codeRole="setup"
              />
              {code.css ? (
                <CodeBlock
                  tabs={{ code: code.css, lang: "css" }}
                  caption="Page colors"
                  snippetId={`lightbox-theme-${id}-css`}
                  codeRole="setup"
                />
              ) : null}
            </div>
          );
        })}
      />
      <Keys>
        Click an image, then <Kbd>←</Kbd> <Kbd>→</Kbd> to page and{" "}
        <Kbd>Esc</Kbd> to close.
      </Keys>
      <Section title="Install">
        <Install library={library} />
        <Text>
          Import <C>base.css</C> and <C>theme.css</C>, then one file from{" "}
          <C>themes/</C>. A theme sets only <C>--re-lightbox-*</C> custom
          properties, so it never moves a control, and your own values after it
          win.
        </Text>
      </Section>
      {Object.entries(lightboxPresets).map(([id, preset]) => {
        const code = lightboxThemeCode(id);
        const preview = lightboxThemePreview(id);
        return (
          <Section key={id} title={preset.name}>
            <Text>{preset.lead}</Text>
            {preview ? <LightboxLaunch {...preview} /> : null}
            <CodeBlock
              tabs={{ code: code.js, lang: "ts" }}
              caption={preset.name}
              snippetId={`lightbox-preset-${id}`}
              codeRole="setup"
            />
            {code.css ? (
              <CodeBlock
                tabs={{ code: code.css, lang: "css" }}
                caption={`${preset.name} styles`}
                snippetId={`lightbox-preset-${id}-css`}
                codeRole="setup"
              />
            ) : null}
          </Section>
        );
      })}
    </>
  );
}
