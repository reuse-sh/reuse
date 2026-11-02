import { interfaceUsage } from "./usage-interface.js";
import { mediaUsage } from "./usage-media.js";
import { styleUsage } from "./usage-style.js";
import type {
  UsagePlatform,
  UsageRecipe,
  UsageSection,
} from "./usage-types.js";

export const usageRecipes: Readonly<Record<string, UsageRecipe>> = {
  ...mediaUsage,
  ...interfaceUsage,
  ...styleUsage,
};

export function getUsage(
  slug: string,
  path: string,
  platform: UsagePlatform,
): readonly UsageSection[] | undefined {
  return usageRecipes[`${slug}/${path}`]?.[platform];
}
