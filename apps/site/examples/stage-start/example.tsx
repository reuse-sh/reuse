"use client";

import { Avatar, AvatarGroup } from "@reuse-sh/avatars/react";
import { Stage, type StageAct } from "@reuse-sh/stage/react";
import { type FormEvent, useState } from "react";
import "./scene.css";
import { photo } from "@/lib/photos";

const image = (id: string) => `/images/marble-${id}.webp`;
const team = [
  { name: "Mara Lind", src: image("mountains") },
  { name: "Jonas Weber", src: image("coast") },
  { name: "Aiko Tanaka", src: image("forest") },
];
const guest = { name: "Lea Novak", src: image("night") };
const email = "lea@studio.design";

export function Example() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [joined, setJoined] = useState(false);
  const reset = () => {
    setOpen(false);
    setDraft("");
    setJoined(false);
  };
  const invite = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setJoined(true);
    setDraft("");
  };
  async function script(act: StageAct) {
    await act.click("share");
    await act.wait(350);
    await act.click("email");
    await act.type("email", email);
    await act.wait(300);
    await act.click("invite");
    await act.wait(1600);
    await act.click("remove");
    await act.wait(700);
    await act.click("share");
    await act.wait(500);
  }
  return (
    <Stage
      width={440}
      height={260}
      label="A pointer opens the share menu, invites Lea by email, and her avatar joins the group."
      script={script}
      reset={reset}
      interactive
      className="re-stage-start"
    >
      <div className="sd-window re-shadow-ring-sm">
        <div className="sd-bar">
          <span className="sd-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <b>Moodboard</b>
          <AvatarGroup overlap={8} clearance={2} className="sd-people">
            {team.map((person) => (
              <Avatar key={person.name} {...person} size={26} />
            ))}
            {joined ? (
              <Avatar {...guest} size={26} className="sd-joined" />
            ) : null}
          </AvatarGroup>
          <button
            type="button"
            className="sd-share"
            data-stage-target="share"
            onClick={() => setOpen((shown) => !shown)}
          >
            Share
          </button>
        </div>
        <div className="sd-board">
          {(["pink-summit", "dunes", "cloud-peak", "empty-room"] as const).map(
            (id) => (
              // biome-ignore lint/performance/noImgElement: standalone examples use native images.
              <img
                key={id}
                src={photo(id).src}
                alt=""
                width={photo(id).width}
                height={photo(id).height}
              />
            ),
          )}
        </div>
        <form
          className="sd-pop re-shadow-ring-lg"
          data-open={open ? "" : undefined}
          onSubmit={invite}
        >
          <b>Invite to Moodboard</b>
          <span className="sd-row">
            <input
              aria-label="Email"
              placeholder="Email"
              value={draft}
              data-stage-target="email"
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit" data-stage-target="invite">
              Invite
            </button>
          </span>
          {joined ? (
            <span className="sd-member">
              <Avatar {...guest} size={22} />
              <span>
                {guest.name}
                <small>Invited</small>
              </span>
              <button
                type="button"
                data-stage-target="remove"
                onClick={() => setJoined(false)}
              >
                Remove
              </button>
            </span>
          ) : (
            <small>Anyone with the link can view.</small>
          )}
        </form>
      </div>
    </Stage>
  );
}
