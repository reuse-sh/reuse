import {
  lightboxPresets,
  lightboxThemeFrame,
  lightboxThemes,
} from "../../../../../components/docs/lightbox-themes";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () =>
  [...Object.keys(lightboxThemes), ...Object.keys(lightboxPresets)].map(
    (theme) => ({ library: "lightbox", theme }),
  );
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ library: string; theme: string }> },
) {
  const page = lightboxThemeFrame((await params).theme);
  if (!page) return new Response("Not found", { status: 404 });
  return new Response(page, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
