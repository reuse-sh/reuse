import {
  type DocParams,
  DocRoute,
  docMetadata,
  libraryParams,
} from "../../components/docs/doc-route";
import type { DocSearch } from "../../lib/framework";

export const dynamicParams = false;
export const generateStaticParams = libraryParams;
export const generateMetadata = ({ params }: { params: DocParams }) =>
  docMetadata(params, "");
export default function Page({
  params,
  searchParams,
}: {
  params: DocParams;
  searchParams: Promise<DocSearch>;
}) {
  return <DocRoute params={params} searchParams={searchParams} prefix="" />;
}
