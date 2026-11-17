import { lightboxGestures } from "@reuse-sh/catalog";
import { DocLink } from "./doc-link";
import { Section, Text } from "./parts";

const columns = [
  ["reuse", "Reuse"],
  ["ios", "iOS Photos"],
  ["macos", "macOS Photos"],
  ["google", "Google Photos"],
] as const;

export function LightboxGesturesPage() {
  return (
    <>
      <div className="overflow-x-auto rounded-panel bg-card p-4 shadow-raised max-sm:px-5 max-sm:py-2">
        <table className="w-full text-left text-ui max-sm:block">
          <thead className="max-sm:sr-only">
            <tr className="border-b border-border text-subtle-foreground">
              <th className="p-3 font-medium">Gesture or key</th>
              {columns.map(([key, name]) => (
                <th key={key} className="p-3 font-medium">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="max-sm:block">
            {lightboxGestures.map((row) => (
              <tr
                key={row.input}
                className="border-b border-border last:border-0 max-sm:block max-sm:py-3"
              >
                <th className="p-3 align-top font-medium text-foreground max-sm:block max-sm:p-0 max-sm:pb-1">
                  {row.input}
                </th>
                {columns.map(([key, name]) => (
                  <td
                    key={key}
                    className={
                      key === "reuse"
                        ? "p-3 align-top text-foreground max-sm:block max-sm:p-0"
                        : "p-3 align-top text-muted-foreground max-sm:block max-sm:p-0"
                    }
                  >
                    <span className="text-subtle-foreground sm:hidden">
                      {name}:{" "}
                    </span>
                    {row[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Section title="What this table rests on">
        <Text>
          The Reuse column is what the lightbox does, and browser tests check it
          on a phone-sized touch screen in Chromium and WebKit and on a laptop
          with a mouse in Chromium and Firefox. The other three columns describe
          those apps as they are known to behave. Nobody has yet checked them
          side by side on devices, so read them as a guide, not as measured
          parity.
        </Text>
        <Text>
          Where Reuse differs from all three apps, it does so on purpose: a
          swipe up closes instead of opening details, a zoomed photo needs a
          second swipe to page, and a mouse click on the photo zooms. To try the
          gestures by hand, follow the{" "}
          <DocLink
            href="/lightbox/examples/device-check"
            className="text-foreground underline underline-offset-4"
          >
            device check
          </DocLink>
          .
        </Text>
      </Section>
    </>
  );
}
