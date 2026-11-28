import { carouselEffectsUsage } from "./usage-carousel-effects.js";
import { interfaceUsage } from "./usage-interface.js";
import { lightboxGalleryUsage } from "./usage-lightbox-galleries.js";
import { lightboxMediaUsage } from "./usage-lightbox-media.js";
import { mediaUsage } from "./usage-media.js";
import { styleUsage } from "./usage-style.js";
import type {
  UsagePlatform,
  UsageRecipe,
  UsageSection,
} from "./usage-types.js";

export const usageRecipes: Readonly<Record<string, UsageRecipe>> = {
  ...mediaUsage,
  ...lightboxGalleryUsage,
  ...lightboxMediaUsage,
  ...carouselEffectsUsage,
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
