"use client";

import { HoldToConfirmButton } from "@reuse-sh/interactions/react";
import { useState } from "react";
import { Icon } from "../icons";
import { DocIcon } from "./doc-icon";

export function DeleteFile() {
  const [deleted, setDeleted] = useState(false);
  return (
    <div className="x-file-wrap">
      {deleted ? (
        <div className="x-file x-file-gone" role="status">
          <p>
            <b className="x-file-gone-name">coral-sky-proof-03.tif</b> was moved
            to the trash.
          </p>
          <button
            type="button"
            className="x-text-btn"
            onClick={() => setDeleted(false)}
          >
            Undo
          </button>
        </div>
      ) : (
        <div className="x-file">
          <span className="x-file-icon" aria-hidden="true">
            <DocIcon name="doc" size={20} />
          </span>
          <span className="x-file-text">
            <b className="x-file-name">coral-sky-proof-03.tif</b>
            <small className="x-file-meta">
              48.2 MB · Edited 2 hours ago by Mara Lind
            </small>
          </span>
          <div className="c-hold-wrap x-file-hold">
            <HoldToConfirmButton
              className="c-hold"
              onConfirm={() => setDeleted(true)}
            >
              <Icon name="trash" size={16} />
              <span>Hold to delete</span>
            </HoldToConfirmButton>
          </div>
        </div>
      )}
      <p className="c-hold-hint">
        Release early, move off the button or press <kbd>Esc</kbd> to cancel.
      </p>
    </div>
  );
}

const rows = [
  ["Workspace name", "Ink and Paper"],
  ["Members", "6 people"],
  ["Default paper", "Matte cotton, 310 g"],
] as const;

export function SettingsRow() {
  const [scheduled, setScheduled] = useState(false);
  return (
    <section className="x-settings" aria-labelledby="x-settings-h">
      <h2 id="x-settings-h" className="x-settings-title">
        Workspace
      </h2>
      <dl>
        {rows.map(([name, value]) => (
          <div key={name} className="x-setting">
            <dt className="x-setting-name">{name}</dt>
            <dd className="x-setting-value">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="x-setting x-setting-danger">
        <div>
          <b className="x-setting-danger-title">Delete workspace</b>
          <p className="x-setting-note" role="status">
            {scheduled
              ? "Scheduled. Everything is removed in 7 days."
              : "Removes every print, order and member after 7 days."}
          </p>
        </div>
        {scheduled ? (
          <button
            type="button"
            className="x-text-btn"
            onClick={() => setScheduled(false)}
          >
            Cancel deletion
          </button>
        ) : (
          <HoldToConfirmButton
            className="c-hold"
            holdMs={2000}
            onConfirm={() => setScheduled(true)}
          >
            Hold to delete
          </HoldToConfirmButton>
        )}
      </div>
    </section>
  );
}
