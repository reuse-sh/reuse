export function HoldLabel({
  labels,
  shown,
}: {
  labels: readonly string[];
  shown: string;
}) {
  return (
    <span className="c-hold-label">
      {labels.map((label) => (
        <span key={label} aria-hidden={label === shown ? undefined : "true"}>
          {label}
        </span>
      ))}
    </span>
  );
}
