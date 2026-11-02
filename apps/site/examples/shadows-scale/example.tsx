const levels = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;
export function Example() {
  return (
    <div className="grid gap-4">
      {["re-shadow-", "re-shadow-ring-"].map((prefix) => (
        <section key={prefix} className="[&:first-child_h2]:mt-10">
          <h2 className="mt-11 mb-2 flex items-center gap-2.5 text-subsection font-semibold leading-6 tracking-tight">
            <code className="rounded-md bg-accent px-1 py-px font-mono text-caption tracking-normal text-foreground">
              {prefix}*
            </code>
          </h2>
          <div className="mt-11 rounded-frame bg-frame p-1 shadow-ring">
            <div className="grid min-h-70 content-center gap-6 rounded-panel bg-card p-8 shadow-raised">
              <ul className="m-0 grid list-none grid-cols-6 gap-5 p-0 max-md:grid-cols-3">
                {levels.map((level) => (
                  <li key={level} className="grid justify-items-center gap-3.5">
                    <span
                      className={`${prefix}${level} block aspect-square w-full rounded-xl bg-card`}
                    />
                    <code className="text-center font-mono text-caption text-subtle-foreground wrap-anywhere">
                      {level}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
