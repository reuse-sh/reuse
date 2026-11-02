import ArrowExpand01Icon from "@hugeicons/core-free-icons/ArrowExpand01Icon";
import ArrowLeftRightIcon from "@hugeicons/core-free-icons/ArrowLeftRightIcon";
import CodeIcon from "@hugeicons/core-free-icons/CodeIcon";
import Cursor01Icon from "@hugeicons/core-free-icons/Cursor01Icon";
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon";
import FavouriteIcon from "@hugeicons/core-free-icons/FavouriteIcon";
import FeatherIcon from "@hugeicons/core-free-icons/FeatherIcon";
import KeyboardIcon from "@hugeicons/core-free-icons/KeyboardIcon";
import Layers01Icon from "@hugeicons/core-free-icons/Layers01Icon";
import Link01Icon from "@hugeicons/core-free-icons/Link01Icon";
import MinusSignIcon from "@hugeicons/core-free-icons/MinusSignIcon";
import Note01Icon from "@hugeicons/core-free-icons/Note01Icon";
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon";
import Share08Icon from "@hugeicons/core-free-icons/Share08Icon";
import Timer01Icon from "@hugeicons/core-free-icons/Timer01Icon";
import TouchInteraction01Icon from "@hugeicons/core-free-icons/TouchInteraction01Icon";
import ZoomInAreaIcon from "@hugeicons/core-free-icons/ZoomInAreaIcon";
import { HugeiconsIcon } from "@hugeicons/react";

const icons = {
  resize: ArrowExpand01Icon,
  touch: TouchInteraction01Icon,
  zoom: ZoomInAreaIcon,
  keyboard: KeyboardIcon,
  layers: Layers01Icon,
  code: CodeIcon,
  cursor: Cursor01Icon,
  chevrons: ArrowLeftRightIcon,
  timer: Timer01Icon,
  feather: FeatherIcon,
  doc: Note01Icon,
  heart: FavouriteIcon,
  share: Share08Icon,
  trash: Delete02Icon,
  link: Link01Icon,
  plus: PlusSignIcon,
  minus: MinusSignIcon,
};

export type DocIconName = keyof typeof icons;

export function DocIcon({
  name,
  size = 20,
  className,
}: {
  name: DocIconName;
  size?: number;
  className?: string;
}) {
  return (
    <HugeiconsIcon
      className={className}
      icon={icons[name]}
      size={size}
      strokeWidth={1.5}
      aria-hidden="true"
    />
  );
}
