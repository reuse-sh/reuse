import "@reuse-sh/shadows/styles.css";

const levels = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;
export function Example() {
  return (
    <div className="grid gap-4">
      {["re-shadow-", "re-shadow-ring-"].map((prefix) => (
        <section key={prefix} className="[&:first-child_h2]:mt-10">
          <h2 className="mt-11 mb-2 flex items-center gap-2.5 text-[17px] font-semibold leading-6 tracking-[-0.016em]">
            <code className="rounded-[5px] bg-black/[0.045] px-[5px] py-px font-mono text-[0.86em] tracking-normal text-[#111]">
              {prefix}*
            </code>
          </h2>
          <div className="mt-11 rounded-[25.6px] bg-white/55 p-1 shadow-[0_0_0_0.5px_#00000014]">
            <div className="grid min-h-[280px] content-center gap-6 rounded-[21.6px] bg-white p-8 shadow-[0_0_0_0.5px_#00000014,0_1px_2px_#0000000d,0_4px_8px_#00000009]">
              <ul className="m-0 grid list-none grid-cols-6 gap-5 p-0 max-[760px]:grid-cols-3">
                {levels.map((level) => (
                  <li key={level} className="grid justify-items-center gap-3.5">
                    <span
                      className={`${prefix}${level} block aspect-square w-full rounded-[14px] bg-white`}
                    />
                    <code className="text-center font-mono text-[11.5px] text-[#858585] [overflow-wrap:anywhere]">
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
