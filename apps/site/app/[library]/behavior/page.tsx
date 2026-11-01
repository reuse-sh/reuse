import { permanentRedirect } from "next/navigation";
import { libraryParams } from "../../../components/docs/doc-route";

export const dynamicParams = false;
export const generateStaticParams = libraryParams;
export default async function Behavior({
  params,
}: {
  params: Promise<{ library: string }>;
}) {
  permanentRedirect(`/${(await params).library}`);
}
