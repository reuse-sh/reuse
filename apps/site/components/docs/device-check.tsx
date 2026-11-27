import { Text as Paragraph } from "../ui/typography";
import { DocLink } from "./doc-link";
import { Section, Text } from "./parts";

type Check = readonly [gesture: string, expected: string];

const phone: readonly Check[] = [
  [
    "Swipe to close",
    "Drag a photo down. It follows the finger, the backdrop and the controls fade, and past a distance or a quick flick it flies back to its tile. A drag up closes the same way. A drag that comes back to the middle stays open.",
  ],
  [
    "Pinch",
    "Spread two fingers. The photo zooms around them and pans with them. Pinch it below three quarters of its fitted size and let go to close.",
  ],
  [
    "Double tap",
    "Double tap zooms in at the tap and double tap again zooms out. One tap on the photo hides or shows the controls after a short pause. A tap beside the photo closes.",
  ],
  [
    "Paging",
    "Swipe sideways to the next photo with the system's momentum. While zoomed, the first swipe stops at the edge with a rubber band, and a second swipe pages.",
  ],
  [
    "Scroll lock",
    "While the viewer is open, the page behind it does not scroll. After close the page is where it was.",
  ],
  [
    "Back",
    "The browser's Back button or edge swipe closes the viewer. The page stays, and its address does not change.",
  ],
];

const mac: readonly Check[] = [
  [
    "Trackpad pinch",
    "Pinch on the trackpad. The photo zooms around the pointer and stops at its fitted size. Esc or the close button closes it.",
  ],
  [
    "Trackpad swipe",
    "Swipe sideways with two fingers to page. A vertical scroll does nothing until the photo is zoomed, then it pans.",
  ],
];

const examples = [
  ["/lightbox/examples/product", "Product page"],
  ["/lightbox/examples/chat", "Chat thread"],
  ["/lightbox/examples/journal", "Journal"],
  ["/lightbox/looks/immersive", "Immersive layout"],
  ["/lightbox/looks/photos", "Photos theme"],
  ["/carousel/examples/product-strip", "Carousel product strip"],
] as const;

function Checklist({ checks }: { checks: readonly Check[] }) {
  return (
    <ul className="max-w-prose space-y-4">
      {checks.map(([gesture, expected]) => (
        <li key={gesture}>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 size-4 shrink-0" />
            <span>
              <span className="block text-ui font-medium text-foreground">
                {gesture}
              </span>
              <Paragraph>{expected}</Paragraph>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

export function DeviceCheck() {
  return (
    <>
      <Section title="Examples to open">
        <Text>
          Open each one on the device, then open a photo in it. The checks hold
          on every example.
        </Text>
        <ul className="max-w-prose list-disc space-y-1 pl-5 text-body text-muted-foreground">
          {examples.map(([href, title]) => (
            <li key={href}>
              <DocLink
                href={href}
                className="text-foreground underline underline-offset-4"
              >
                {title}
              </DocLink>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="iPhone with Safari and Android with Chrome">
        <Checklist checks={phone} />
      </Section>
      <Section title="Mac with Safari">
        <Checklist checks={mac} />
      </Section>
    </>
  );
}
