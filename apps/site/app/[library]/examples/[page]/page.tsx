import {
  type DocParams,
  DocRoute,
  docMetadata,
  pageParams,
} from "../../../../components/docs/doc-route";

export const dynamicParams = false;
export const generateStaticParams = pageParams("examples/");
export const generateMetadata = ({ params }: { params: DocParams }) =>
  docMetadata(params, "examples/");
export default function Page({ params }: { params: DocParams }) {
  return <DocRoute params={params} prefix="examples/" />;
}
