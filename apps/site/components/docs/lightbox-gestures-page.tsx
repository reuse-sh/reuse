import { lightboxGestures } from "@reuse-sh/catalog";
import { Card } from "@/components/ui/card";
import { DocLink } from "./doc-link";
import { GestureVideo } from "./gesture-video";
import { Section, Text } from "./parts";

const columns = [
  ["reuse", "Reuse"],
  ["ios", "iOS Photos"],
  ["macos", "macOS Photos"],
  ["google", "Google Photos"],
] as const;

const clips = [
  {
    id: "dismiss",
    name: "Swipe down",
    caption:
      "The photo follows the finger, and on release it shrinks back into its tile.",
  },
  {
    id: "pinch",
    name: "Pinch",
    caption:
      "Two fingers spread to zoom in on the pine, then pinch back to fit.",
  },
  {
    id: "edge-paging",
    name: "Swipe against a zoomed photo's edge",
    caption:
      "After a pinch, a pan stops at the photo's edge and stretches. A second swipe goes to the next photo.",
  },
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
      <Section title="Three gestures on a phone">
        <Text>
          Each clip is the lightbox on the Album example, recorded on this site
          at phone size with touch input. The circles mark the fingers.
        </Text>
        <div className="grid gap-8 sm:grid-cols-3 sm:gap-4">
          {clips.map((clip) => (
            <figure key={clip.id} className="max-w-60 sm:max-w-none">
              <Card className="overflow-hidden p-0">
                <GestureVideo
                  src={`/videos/gestures/${clip.id}.mp4`}
                  poster={`/videos/gestures/${clip.id}.jpg`}
                  width={576}
                  height={1246}
                  label={clip.name}
                />
              </Card>
              <figcaption className="mt-2.5 space-y-0.5">
                <span className="block text-ui font-medium text-foreground">
                  {clip.name}
                </span>
                <span className="block text-caption text-subtle-foreground">
                  {clip.caption}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>
    </>
  );
}
