export function HoldLabel({
  labels,
  shown,
}: {
  labels: readonly string[];
  shown: string;
}) {
  return (
    <span className="grid justify-items-center">
      {labels.map((label) => (
        <span
          key={label}
          className="col-start-1 row-start-1 aria-hidden:invisible"
          aria-hidden={label === shown ? undefined : "true"}
        >
          {label}
        </span>
      ))}
    </span>
  );
}
