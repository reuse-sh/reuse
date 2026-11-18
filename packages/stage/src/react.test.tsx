// @vitest-environment jsdom

import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { Stage, type StageAct } from "./react.js";

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("runs a React click handler in the scene and resets React state before each pass", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "performance",
      "Date",
    ],
  });
  const seen: string[] = [];
  function Scene() {
    const [open, setOpen] = useState(false);
    seen.push(open ? "open" : "closed");
    return createElement(
      Stage,
      {
        width: 200,
        height: 100,
        label: "Opening a menu",
        delay: 0,
        reset: () => setOpen(false),
        script: async (stage: StageAct) => {
          await stage.click("share");
          await stage.wait(500);
        },
      },
      createElement(
        "button",
        {
          type: "button",
          "data-stage-target": "share",
          onClick: () => setOpen(true),
        },
        "Share",
      ),
    );
  }
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(createElement(Scene)));
  for (let elapsed = 0; elapsed < 4000; elapsed += 100)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
  expect(seen).toContain("open");
  expect(seen.lastIndexOf("closed")).toBeGreaterThan(seen.indexOf("open"));
  await act(async () => root.unmount());
  expect(container.innerHTML).toBe("");
});

it("types into a controlled React input through its onChange", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "performance",
      "Date",
    ],
  });
  const values: string[] = [];
  function Scene() {
    const [value, setValue] = useState("");
    values.push(value);
    return createElement(
      Stage,
      {
        width: 200,
        height: 100,
        label: "Typing an email",
        delay: 0,
        script: async (stage: StageAct) => {
          await stage.type("email", "mara");
          await stage.wait(10_000);
        },
      },
      createElement("input", {
        "data-stage-target": "email",
        value,
        onChange: (event: { target: HTMLInputElement }) =>
          setValue(event.target.value),
      }),
    );
  }
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(createElement(Scene)));
  for (let elapsed = 0; elapsed < 1000; elapsed += 50)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
  expect(values.at(-1)).toBe("mara");
  await act(async () => root.unmount());
});
