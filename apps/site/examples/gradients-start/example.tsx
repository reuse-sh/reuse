import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const curves = [
  ["linear", "re-gradient-linear"],
  ["ease-in-out-sine", "re-gradient-ease-in-out-sine"],
] as const;

export function Example() {
  return (
    <Card variant="raised" className="rounded-2xl">
      <CardContent
        padding="none"
        className="grid gap-3 p-7 max-sm:px-4 max-sm:py-4.5"
      >
        <div
          className="flex items-center gap-3 text-label text-subtle-foreground max-sm:gap-2"
          aria-hidden="true"
        >
          <span className="w-14 shrink-0 max-sm:w-11" />
          <span className="flex-1">Linear</span>
          <span className="flex-1">Eased</span>
        </div>
        <div className="flex items-center gap-3 max-sm:gap-2">
          <span className="w-14 shrink-0 text-label text-muted-foreground max-sm:w-11">
            Ink
          </span>
          {curves.map(([easing, className]) => (
            <span
              key={easing}
              className={cn(
                "re-gradient re-gradient-dir-r re-gradient-to-foreground h-18 min-w-0 flex-1 rounded-control",
                className,
              )}
              role="img"
              aria-label={`Ink, ${easing === "linear" ? "linear" : "eased"} fade from transparent`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
