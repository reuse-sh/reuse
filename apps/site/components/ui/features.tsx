import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Text } from "./typography";

export function FeatureCopy({
  title,
  children,
  stacked = false,
}: {
  title: string;
  children: ReactNode;
  stacked?: boolean;
}) {
  return (
    <Text variant="feature" data-slot="feature-copy">
      <strong
        className={cn("font-semibold text-foreground", stacked && "block")}
      >
        {title}
      </strong>{" "}
      {children}
    </Text>
  );
}

export function FeatureGrid({
  items,
  columns = 3,
  className,
}: {
  items: readonly { title: string; description: string; icon: ReactNode }[];
  columns?: 2 | 3;
  className?: string;
}) {
  return (
    <ul
      data-slot="feature-grid"
      className={cn(
        "grid gap-x-8 gap-y-8 sm:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
        className,
      )}
    >
      {items.map(({ title, description, icon }) => (
        <li key={title} className="min-w-0 space-y-3.5">
          <div className="flex size-5 items-center text-foreground [&>svg]:size-5">
            {icon}
          </div>
          <FeatureCopy title={`${title}.`}>{description}</FeatureCopy>
        </li>
      ))}
    </ul>
  );
}
