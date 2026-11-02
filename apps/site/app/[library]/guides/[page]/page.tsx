import {
  type DocParams,
  DocRoute,
  docMetadata,
  pageParams,
} from "../../../../components/docs/doc-route";
import type { DocSearch } from "../../../../lib/framework";

export const dynamicParams = false;
export const generateStaticParams = pageParams("guides/");
export const generateMetadata = ({ params }: { params: DocParams }) =>
  docMetadata(params, "guides/");
export default function Page({
  params,
  searchParams,
}: {
  params: DocParams;
  searchParams: Promise<DocSearch>;
}) {
  return (
    <DocRoute params={params} searchParams={searchParams} prefix="guides/" />
  );
}
