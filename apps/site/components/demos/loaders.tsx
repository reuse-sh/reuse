import { Example as Figures } from "@/examples/loaders-figures/example";
import { Example as Loading } from "@/examples/loaders-start/example";

export function LoadersDemo({ gallery = false }: { gallery?: boolean }) {
  return gallery ? (
    <div className="mt-11">
      <Figures />
    </div>
  ) : (
    <Loading />
  );
}
