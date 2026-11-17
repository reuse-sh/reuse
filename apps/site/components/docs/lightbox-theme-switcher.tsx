"use client";

import { type ReactNode, useState } from "react";
import { Tabs, tabPanelProps } from "../shell/tabs";
import { Card, CardContent } from "../ui/card";

export function LightboxThemeSwitcher({
  themes,
  panels,
}: {
  themes: readonly { id: string; name: string }[];
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
      <Card>
        <CardContent padding="none" className="overflow-hidden rounded-panel">
          <iframe
            key={selected}
            className="block aspect-portrait w-full border-0 md:aspect-lightbox"
            title={`Lightbox preview, ${selected} theme`}
            src={`/lightbox/themes/${selected}/frame`}
          />
        </CardContent>
      </Card>
      {themes.map(({ id }, index) => (
        <div key={id} {...tabPanelProps("lightbox-theme", id, selected)}>
          {panels[index]}
        </div>
      ))}
    </div>
  );
}
