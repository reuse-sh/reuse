import { docParams } from "@reuse-sh/catalog";
import { lightboxFrame } from "../../../../../components/docs/lightbox-frame";
import { lightboxStyles } from "../../../../../components/docs/lightbox-styles";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => docParams("controls/");
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ library: string; page: string }> },
) {
  const options = lightboxStyles[(await params).page];
  if (!options) return new Response("Not found", { status: 404 });
  return new Response(lightboxFrame(options), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
