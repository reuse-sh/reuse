"use client";

import { useEffect, useState } from "react";
import { Tabs } from "../shell/tabs";

const motions = [
  { id: "roll", label: "Roll" },
  { id: "rise", label: "Rise" },
  { id: "blur", label: "Blur" },
  { id: "fade", label: "Fade" },
];

export function CaptionMotionSwitch() {
  const [selected, setSelected] = useState("roll");
  useEffect(() => {
    const asked = new URLSearchParams(location.search).get("caption");
    if (asked && motions.some(({ id }) => id === asked)) setSelected(asked);
  }, []);
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--re-lightbox-caption-motion", selected);
    return () => {
      root.removeProperty("--re-lightbox-caption-motion");
    };
  }, [selected]);
  return (
    <Tabs
      idBase="caption-motion"
      label="Caption motion"
      items={motions}
      selected={selected}
      onSelect={setSelected}
    />
  );
}
