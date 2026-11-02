import { Heading, Text } from "@/components/ui/typography";
import { DocLink as Link } from "../components/docs/doc-link";
import { SiteFrame } from "../components/site-frame";
export default function NotFound() {
  return (
    <SiteFrame>
      <main id="main" className="mx-auto w-page pt-24 pb-10">
        <Heading variant="page">This page is missing.</Heading>
        <Text className="mt-4 mb-4 max-w-prose">
          The address may be old. Every library is in the Libraries menu above.
        </Text>
        <Link
          className="text-foreground underline decoration-border underline-offset-4 hover:decoration-current"
          href="/"
        >
          Go to the home page
        </Link>
      </main>
    </SiteFrame>
  );
}
