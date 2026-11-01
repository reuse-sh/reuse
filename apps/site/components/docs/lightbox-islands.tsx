"use client";

import { Avatar } from "@reuse-sh/avatars/react";
import { createMovingHighlight } from "@reuse-sh/interactions";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { photos } from "../../lib/photos";

function useHighlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current) return;
    const highlight = createMovingHighlight(ref.current);
    return () => highlight.destroy();
  }, []);
  return ref;
}

const sizes = [
  ["30 × 20", "$62"],
  ["40 × 30", "$84"],
  ["60 × 45", "$126"],
] as const;

export function ProductOptions() {
  const [size, setSize] = useState(1);
  const [added, setAdded] = useState(false);
  const group = useHighlight<HTMLFieldSetElement>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const [label, cost] = sizes[size];
  return (
    <>
      <p className="x-price">
        <span>{cost}</span>
        <span className="x-meta">Archival paper · {label} cm</span>
      </p>
      <p className="x-desc">
        Coral, sand and blue drift across the sheet like ink on water. Printed
        to order on matte cotton paper with a 2 cm border.
      </p>
      <fieldset ref={group} className="x-field">
        <legend className="x-label">Size</legend>
        <div className="x-sizes">
          {sizes.map(([name], index) => (
            <label
              key={name}
              data-re-row
              data-current={index === size ? "" : undefined}
            >
              <input
                type="radio"
                name="x-size"
                className="sr-only"
                checked={index === size}
                onChange={() => setSize(index)}
              />
              {name}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        className="x-buy"
        data-done={added ? "" : undefined}
        onClick={() => {
          setAdded(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setAdded(false), 1600);
        }}
      >
        {added ? "Added to bag" : "Add to bag"}
      </button>
    </>
  );
}

const marble = (index: number) =>
  ({
    "--re-avatar-background": `url(${photos[index].src}) center / cover`,
  }) as CSSProperties;

const people = [
  ["Mara Lind", "Proofs from the new series, finally", "18:42"],
  ["Jonas Weber", "Invoice is in the shared folder", "16:05"],
  ["Aiko Tanaka", "See you at ten", "Thu"],
  ["Lea Novak", "Thanks, that works", "Tue"],
] as const;

export function ChatList() {
  const rows = useHighlight<HTMLDivElement>();
  const [current, setCurrent] = useState(0);
  return (
    <div className="x-list">
      <p className="x-list-title">Messages</p>
      <div className="x-list-rows" ref={rows}>
        {people.map(([name, text, time], index) => (
          <button
            key={name}
            type="button"
            className="x-person"
            data-re-row
            data-current={index === current ? "" : undefined}
            aria-current={index === current ? "true" : undefined}
            onClick={() => setCurrent(index)}
          >
            <Avatar name={name} size={36} style={marble(index)} />
            <span className="x-person-text">
              <b>{name}</b>
              <small>{text}</small>
            </span>
            <time>{time}</time>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThreadHead() {
  return (
    <div className="x-thread-head">
      <Avatar
        name="Mara Lind"
        size={32}
        badge={{ type: "dot", label: "Online" }}
        style={marble(0)}
      />
      <span>
        <b>Mara Lind</b>
        <small>Active now</small>
      </span>
    </div>
  );
}
