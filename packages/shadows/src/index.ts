export const shadowLevels = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;
export type ShadowLevel = (typeof shadowLevels)[number];
export * from "./fade-edge.js";
