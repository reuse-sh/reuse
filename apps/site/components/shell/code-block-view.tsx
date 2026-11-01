"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { CopyControl } from "../copy-control";
import { Icon } from "../icons";
import type { CodeRun } from "./highlight";
import { Tabs, tabPanelProps } from "./tabs";

export interface HighlightedTab {
  label?: "JavaScript" | "React";
  code: string;
  runs: CodeRun[];
}

const KEY = "re-code-tab";
const EVENT = "re-code-tab";

function readTab() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function writeTab(label: string) {
  try {
    localStorage.setItem(KEY, label);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function Code({ runs }: { runs: CodeRun[] }) {
  return (
    <code>
      {runs.map((run, index) =>
        run.color ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: runs are derived from fixed text and never reorder.
          <span key={index} style={{ color: run.color }}>
            {run.text}
          </span>
        ) : (
          run.text
        ),
      )}
    </code>
  );
}

const tabIcons = { JavaScript: "js", React: "react" } as const;

export function CodeBlockView({ list }: { list: HighlightedTab[] }) {
  const idBase = useId();
  const remembered = useSyncExternalStore(subscribe, readTab, () => null);
  const [chosen, setChosen] = useState<string>(list[0].label ?? "");
  const labels: string[] = list.map((tab) => tab.label ?? "");
  const selected =
    remembered && labels.includes(remembered) ? remembered : chosen;
  const active = list[labels.indexOf(selected)] ?? list[0];
  const tabbed = list.length > 1 || Boolean(list[0].label);

  if (!tabbed)
    return (
      <div className="c-code">
        <pre>
          <Code runs={active.runs} />
        </pre>
        <CopyControl value={active.code} className="c-code-float" />
      </div>
    );

  return (
    <div className="c-code">
      <div className="c-code-bar">
        <Tabs
          idBase={idBase}
          label="Code"
          selected={selected}
          onSelect={(label) => {
            setChosen(label);
            writeTab(label);
          }}
          items={list.map((tab) => ({
            id: tab.label ?? "",
            label: (
              <>
                {tab.label ? (
                  <Icon name={tabIcons[tab.label]} size={14} />
                ) : null}
                <span>{tab.label}</span>
              </>
            ),
          }))}
        />
        <CopyControl value={active.code} />
      </div>
      {list.map((tab) => (
        <pre
          key={tab.label}
          {...tabPanelProps(idBase, tab.label ?? "", selected)}
        >
          <Code runs={tab.runs} />
        </pre>
      ))}
    </div>
  );
}
