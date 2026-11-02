export type UsagePlatform = "react" | "html";
export type UsageLanguage =
  | "tsx"
  | "html"
  | "css"
  | "javascript"
  | "bash"
  | "json";
export type UsageBlock =
  | { kind: "prose"; text: string }
  | {
      kind: "code";
      id: string;
      language: UsageLanguage;
      code: string;
      label?: string;
      role?: "usage" | "setup" | "cleanup";
    };
export interface UsageSection {
  title: string;
  blocks: readonly UsageBlock[];
}
export interface UsageRecipe {
  react: readonly UsageSection[];
  html: readonly UsageSection[];
}
