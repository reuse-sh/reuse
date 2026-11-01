import {
  type DocParams,
  DocRoute,
  docMetadata,
  pageParams,
} from "../../../../components/docs/doc-route";

export const dynamicParams = false;
export const generateStaticParams = pageParams("guides/");
export const generateMetadata = ({ params }: { params: DocParams }) =>
  docMetadata(params, "guides/");
export default function Page({ params }: { params: DocParams }) {
  return <DocRoute params={params} prefix="guides/" />;
}
