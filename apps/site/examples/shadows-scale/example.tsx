import "@reuse-sh/shadows/styles.css";

const levels = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;
export function Example() {
  return (
    <div className="grid gap-8">
      {["re-shadow-", "re-shadow-ring-"].map((prefix) => (
        <section key={prefix}>
          <h3 className="m-0 font-mono text-sm">{prefix}*</h3>
          <ul className="mt-[18px] grid list-none grid-cols-3 gap-5 p-0 sm:grid-cols-6">
            {levels.map((level) => (
              <li key={level} className="grid justify-items-center gap-3.5">
                <span
                  className={`${prefix}${level} block aspect-square w-full rounded-[14px] bg-white`}
                />
                <code className="text-xs text-[#858585]">{level}</code>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
