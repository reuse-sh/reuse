"use client";

import { type ReactNode, useState } from "react";
import { Tabs, tabPanelProps } from "../shell/tabs";
import { type LaunchItem, LightboxLaunch } from "./lightbox-launch";

export interface ThemePreview {
  scope: string;
  css: string;
  items: LaunchItem[];
  module: string;
}

export function LightboxThemeSwitcher({
  themes,
  panels,
}: {
  themes: readonly { id: string; name: string; preview: ThemePreview }[];
  panels: readonly ReactNode[];
}) {
  const [selected, setSelected] = useState(themes[0].id);
  return (
    <div className="space-y-4">
      <Tabs
        idBase="lightbox-theme"
        label="Theme"
        items={themes.map(({ id, name }) => ({ id, label: name }))}
        selected={selected}
        onSelect={setSelected}
      />
      {themes.map(({ id, preview }) =>
        id === selected ? <LightboxLaunch key={id} {...preview} /> : null,
      )}
      {themes.map(({ id }, index) => (
        <div key={id} {...tabPanelProps("lightbox-theme", id, selected)}>
          {panels[index]}
        </div>
      ))}
    </div>
  );
}
