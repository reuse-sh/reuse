import "../preview.css";
import "../../styles/docs.css";
import "./prototype.css";
import { DocRoute } from "../../../components/docs/doc-route";
import { LibraryFrame } from "../../../components/docs/library-frame";
import { Framework } from "./framework";
import { Preview } from "./preview";
import { PrototypePicker } from "./prototype-picker";
import { exampleSource } from "./source";

export async function PrototypePage({
  query,
}: {
  query: Record<string, string | string[] | undefined>;
}) {
  const variant =
    query.__v === "1" ? "current" : query.__v === "3" ? "tabs" : "disclosure";
  return (
    <LibraryFrame
      slug="carousel"
      currentPath="/carousel"
      before={
        variant === "current" ? undefined : (
          <Framework
            variant={variant === "tabs" ? "3" : "2"}
            platform={query.framework === "html" ? "html" : "react"}
            view={query.view === "code" ? "code" : "preview"}
          />
        )
      }
    >
      {variant === "current" ? (
        <DocRoute params={Promise.resolve({ library: "carousel" })} prefix="" />
      ) : (
        <Preview
          key={variant}
          variant={variant}
          platform={query.framework === "html" ? "html" : "react"}
          view={query.view === "code" ? "code" : "preview"}
          selectedFile={typeof query.file === "string" ? query.file : undefined}
          files={
            await Promise.all([
              exampleSource("print-carousel.tsx", "tsx"),
              exampleSource("index.html", "html"),
              exampleSource("styles.css", "css"),
              exampleSource("main.js", "ts"),
            ])
          }
        />
      )}
      <PrototypePicker variant={variant} />
    </LibraryFrame>
  );
}
