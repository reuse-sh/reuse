"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import { type Framework, frameworkFrom } from "./framework";

const Context = createContext<Framework | null>(null);
const EVENT = "re-framework-change";

function subscribe(update: () => void) {
  window.addEventListener("popstate", update);
  window.addEventListener(EVENT, update);
  return () => {
    window.removeEventListener("popstate", update);
    window.removeEventListener(EVENT, update);
  };
}

function read() {
  return frameworkFrom(
    new URLSearchParams(window.location.search).get("framework"),
  );
}

export function FrameworkScope({
  framework,
  children,
}: {
  framework: Framework;
  children: ReactNode;
}) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: framework }));
  }, [framework]);
  return <Context value={framework}>{children}</Context>;
}

export function useFramework() {
  const context = useContext(Context);
  const browser = useSyncExternalStore(subscribe, read, () => "react" as const);
  return context ?? browser;
}

export function useDocFramework() {
  return useContext(Context);
}

export function FrameworkOnly({
  value,
  children,
}: {
  value: Framework;
  children: ReactNode;
}) {
  return useFramework() === value ? children : null;
}
