import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import CarouselHorizontal02Icon from "@hugeicons/core-free-icons/CarouselHorizontal02Icon";
import CodeIcon from "@hugeicons/core-free-icons/CodeIcon";
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon";
import CursorInWindowIcon from "@hugeicons/core-free-icons/CursorInWindowIcon";
import Edit02Icon from "@hugeicons/core-free-icons/Edit02Icon";
import Image02Icon from "@hugeicons/core-free-icons/Image02Icon";
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon";
import Layers01Icon from "@hugeicons/core-free-icons/Layers01Icon";
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon";
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon";
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon";
import ZoomInAreaIcon from "@hugeicons/core-free-icons/ZoomInAreaIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowIcon,
  type ArrowName,
  arrowPaths,
  nativeArrow,
} from "./lucide-arrows";

export const iconData = {
  lightbox: Image02Icon,
  carousel: CarouselHorizontal02Icon,
  annotations: Edit02Icon,
  loaders: Loading03Icon,
  shadows: Layers01Icon,
  "floating-tooltip": InformationCircleIcon,
  "moving-highlight": CursorInWindowIcon,
  "hold-to-confirm": Tick02Icon,
  avatars: UserGroupIcon,
  book: BookOpen01Icon,
  code: CodeIcon,
  copy: Copy01Icon,
  check: Tick02Icon,
  close: Cancel01Icon,
  zoom: ZoomInAreaIcon,
};

export type IconName = keyof typeof iconData | ArrowName;

export function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  if (name in arrowPaths)
    return (
      <ArrowIcon name={name as ArrowName} size={size} className={className} />
    );
  return (
    <HugeiconsIcon
      icon={iconData[name as keyof typeof iconData]}
      size={size}
      strokeWidth={1.6}
      className={className}
      aria-hidden="true"
    />
  );
}

function nativeIcon(data: typeof Cancel01Icon) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  for (const [tag, attributes] of data) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attributes)) {
      if (key !== "key")
        element.setAttribute(
          key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
          String(value),
        );
    }
    svg.append(element);
  }
  return svg;
}

export const lightboxIcons = {
  close: () => nativeIcon(Cancel01Icon),
  prev: () => nativeArrow("left"),
  next: () => nativeArrow("right"),
  zoom: () => nativeIcon(ZoomInAreaIcon),
};
