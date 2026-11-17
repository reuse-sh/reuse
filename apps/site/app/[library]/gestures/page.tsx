import { docParams } from "@reuse-sh/catalog";
import {
  type DocParams,
  DocRoute,
  docMetadata,
} from "../../../components/docs/doc-route";
import type { DocSearch } from "../../../lib/framework";

export const dynamicParams = false;
export const generateStaticParams = () =>
  docParams("gestures").map(({ library }) => ({ library }));
export const generateMetadata = ({ params }: { params: DocParams }) =>
  docMetadata(params, "gestures");
export default function Page({
  params,
  searchParams,
}: {
  params: DocParams;
  searchParams: Promise<DocSearch>;
}) {
  return (
    <DocRoute params={params} searchParams={searchParams} prefix="gestures" />
  );
}
