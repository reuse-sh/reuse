import {
  docHref,
  type Library,
  libraryPrompt,
  pagePrompt,
} from "@reuse-sh/catalog";
import { buttonVariants } from "@/components/ui/button";
import { PromptButton } from "../copy-control";
import { DocLink } from "./doc-link";

export function DocActions({
  library,
  path,
}: {
  library: Library;
  path: string;
}) {
  return (
    <div
      data-slot="doc-actions"
      className="mt-6 flex flex-wrap items-center gap-2"
    >
      <PromptButton
        prompt={pagePrompt(library, path) ?? libraryPrompt(library)}
      />
      {path === "" ? (
        <DocLink
          href={docHref(library, "getting-started")}
          className={buttonVariants({ variant: "ghost" })}
        >
          Get started
        </DocLink>
      ) : null}
    </div>
  );
}
