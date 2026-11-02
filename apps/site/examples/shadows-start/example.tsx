import "@reuse-sh/shadows/styles.css";
export function Example() {
  return (
    <div className="grid justify-items-start gap-7">
      <div className="re-card re-shadow-ring-md">Your content</div>
      <button
        type="button"
        className="re-shadow-xs rounded-lg border-0 bg-white px-4 py-2 text-sm"
      >
        Order a proof
      </button>
    </div>
  );
}
