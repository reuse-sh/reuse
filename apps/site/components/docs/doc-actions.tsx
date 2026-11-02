import {
  docHref,
  type Library,
  libraryPrompt,
  pagePrompt,
} from "@reuse-sh/catalog";
import { buttonVariants } from "@/components/ui/button";
import type { Framework } from "../../lib/framework";
import { PromptButton } from "../copy-control";
import { DocLink } from "./doc-link";

export function DocActions({
  library,
  path,
  framework,
}: {
  library: Library;
  path: string;
  framework: Framework;
}) {
  return (
    <div
      data-slot="doc-actions"
      className="mt-6 flex flex-wrap items-center gap-2"
    >
      <PromptButton
        prompt={pagePrompt(library, path, framework) ?? libraryPrompt(library)}
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
