import {
  type DocParams,
  DocRoute,
  docMetadata,
  libraryParams,
} from "../../../components/docs/doc-route";

export const dynamicParams = false;
export const generateStaticParams = libraryParams;
export const generateMetadata = ({ params }: { params: DocParams }) =>
  docMetadata(params, "api");
export default function Page({ params }: { params: DocParams }) {
  return <DocRoute params={params} prefix="api" />;
}
