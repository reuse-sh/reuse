import { docParams } from "@reuse-sh/catalog";
import {
  type DocParams,
  DocRoute,
  docMetadata,
} from "../../../components/docs/doc-route";
import type { DocSearch } from "../../../lib/framework";

export const dynamicParams = false;
export const generateStaticParams = () =>
  docParams("looks").map(({ library }) => ({ library }));
export const generateMetadata = ({ params }: { params: DocParams }) =>
  docMetadata(params, "looks");
export default function Page({
  params,
  searchParams,
}: {
  params: DocParams;
  searchParams: Promise<DocSearch>;
}) {
  return (
    <DocRoute params={params} searchParams={searchParams} prefix="looks" />
  );
}
