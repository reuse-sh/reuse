"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Tabs, tabPanelProps } from "../shell/tabs";
import { Card } from "../ui/card";
import type { Look, LookGroup } from "./lightbox-looks";

const lookGroups: readonly LookGroup[] = ["Themes", "Layouts", "Recipes"];

const groupLeads: Record<LookGroup, string> = {
  Themes:
    "A theme sets only --re-lightbox-* custom properties, so it never moves a control.",
  Layouts:
    "A layout moves the controls with your own stylesheet over theme.css.",
  Recipes: "A theme, slots and options put together for one kind of product.",
};

const frameWidth = 960;
const frameHeight = 600;

/** The look's viewer route, laid out at a desktop size and scaled to the frame's width. */
function LookFrame({ look }: { look: Look }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / frameWidth),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <Card className="overflow-hidden p-0">
      <div
        ref={box}
        className="relative overflow-hidden"
        style={{ aspectRatio: `${frameWidth} / ${frameHeight}` }}
      >
        {scale ? (
          <iframe
            src={`/lightbox/looks/${look.id}?open`}
            title={`${look.name} viewer`}
            className="absolute top-0 left-0 origin-top-left border-0"
            style={{
              width: frameWidth,
              height: frameHeight,
              transform: `scale(${scale})`,
            }}
          />
        ) : null}
      </div>
    </Card>
  );
}

export function LooksSwitcher({
  looks,
  panels,
}: {
  looks: readonly Look[];
  panels: readonly ReactNode[];
}) {
  const [group, setGroup] = useState<LookGroup>(looks[0].group);
  const [selected, setSelected] = useState(looks[0].id);
  const inGroup = looks.filter((look) => look.group === group);
  return (
    <div className="space-y-4">
      <Tabs
        idBase="look-group"
        label="Kind of look"
        items={lookGroups.map((id) => ({ id, label: id }))}
        selected={group}
        onSelect={(id) => {
          const next = id as LookGroup;
          setGroup(next);
          setSelected(
            looks.find((look) => look.group === next)?.id ?? selected,
          );
        }}
      />
      {lookGroups.map((id) => (
        <div
          key={id}
          {...tabPanelProps("look-group", id, group)}
          tabIndex={-1}
          className="space-y-4"
        >
          {id === group ? (
            <>
              <Tabs
                key={group}
                idBase="look"
                label={group}
                className="max-w-full flex-wrap"
                items={inGroup.map((look) => ({
                  id: look.id,
                  label: look.name,
                }))}
                selected={selected}
                onSelect={setSelected}
              />
              {inGroup.map((look) => (
                <div
                  key={look.id}
                  {...tabPanelProps("look", look.id, selected)}
                  tabIndex={-1}
                  className="space-y-4"
                >
                  {look.id === selected ? (
                    <>
                      <LookFrame look={look} />
                      <p className="text-caption text-muted-foreground">
                        The real viewer. Page, zoom and close it inside the
                        frame. {groupLeads[group]}
                      </p>
                      <p>{look.lead}</p>
                      {panels[looks.indexOf(look)]}
                    </>
                  ) : null}
                </div>
              ))}
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}
