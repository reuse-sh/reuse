import {
  type DocParams,
  DocRoute,
  docMetadata,
  pageParams,
} from "../../../../components/docs/doc-route";

export const dynamicParams = false;
export const generateStaticParams = pageParams("controls/");
export const generateMetadata = ({ params }: { params: DocParams }) =>
  docMetadata(params, "controls/");
export default function Page({ params }: { params: DocParams }) {
  return <DocRoute params={params} prefix="controls/" />;
}
