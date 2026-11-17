import { type FrameOptions, frameOf, loaded } from "./iframe.js";
import type {
  LightboxContent,
  LightboxItem,
  LightboxMounted,
} from "./index.js";

export interface EmbedProvider {
  name: string;
  pattern: RegExp;
  url(match: RegExpExecArray, item: LightboxItem): string;
  /** Width over height, 16 / 9 when missing. */
  aspect?: number;
}

type Command = "play" | "pause" | "mute";

// A player's postMessage API: how to greet it, send it a command and read its state.
type Remote = {
  greet(send: (message: object) => void): void;
  command(command: Command): object;
  state(data: Record<string, unknown>): "playing" | "paused" | undefined;
};

const parse = (data: unknown) => {
  try {
    const value = typeof data === "string" ? JSON.parse(data) : data;
    return typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
};

const youtubeRemote: Remote = {
  greet: (send) => send({ event: "listening", id: 1, channel: "widget" }),
  command: (command) => ({
    event: "command",
    func: command === "mute" ? "mute" : `${command}Video`,
    args: [],
  }),
  state(data) {
    const info = data.info as { playerState?: number } | undefined;
    const value = info?.playerState;
    return value === 1 || value === 3
      ? "playing"
      : value === 2 || value === 0
        ? "paused"
        : undefined;
  },
};

const vimeoRemote: Remote = {
  greet(send) {
    for (const value of ["play", "pause", "ended"])
      send({ method: "addEventListener", value });
  },
  command: (command) =>
    command === "mute"
      ? { method: "setVolume", value: 0 }
      : { method: command },
  state: (data) =>
    data.event === "play"
      ? "playing"
      : data.event === "pause" || data.event === "ended"
        ? "paused"
        : undefined,
};

const remotes = new WeakMap<EmbedProvider, Remote>();

const youtube = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&playsinline=1`;

const providers: EmbedProvider[] = [
  {
    name: "youtube-shorts",
    pattern: /^https?:\/\/(?:www\.|m\.)?youtube\.com\/shorts\/([\w-]+)/,
    url: (match) => youtube(match[1]),
    aspect: 9 / 16,
  },
  {
    name: "youtube",
    pattern:
      /^https?:\/\/(?:(?:www\.|m\.)?youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/)|youtu\.be\/)([\w-]+)/,
    url: (match) => youtube(match[1]),
  },
  {
    name: "vimeo",
    pattern:
      /^https?:\/\/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)(?:\/([\da-f]+))?/,
    url: (match) =>
      `https://player.vimeo.com/video/${match[1]}${match[2] ? `?h=${match[2]}` : ""}`,
  },
];
remotes.set(providers[0], youtubeRemote);
remotes.set(providers[1], youtubeRemote);
remotes.set(providers[2], vimeoRemote);

/** Adds a provider ahead of the built-in YouTube and Vimeo ones. */
export function registerEmbed(provider: EmbedProvider): void {
  providers.unshift(provider);
}

// The source URL's own parameters, such as a start time, carry over to the player.
function withParameters(url: string, source: string) {
  try {
    const target = new URL(url);
    for (const [key, value] of new URL(source).searchParams) {
      // YouTube links say t=30s; its player reads start=30.
      const name = key === "t" ? "start" : key;
      if (key !== "v" && !target.searchParams.has(name))
        target.searchParams.set(
          name,
          key === "t" ? `${Number.parseInt(value, 10)}` : value,
        );
    }
    return target.href;
  } catch {
    return url;
  }
}

const MUTED_RETRY = 1000;

export function embed(options: FrameOptions = {}): LightboxContent {
  return {
    type: "embed",
    mount(container, { item, signal, autoplay }): LightboxMounted {
      const source = item.embed ?? item.src ?? "";
      let provider: EmbedProvider | undefined;
      let match: RegExpExecArray | null = null;
      for (const candidate of providers) {
        match = candidate.pattern.exec(source);
        if (match) {
          provider = candidate;
          break;
        }
      }
      const url =
        provider && match
          ? withParameters(provider.url(match, item), source)
          : source;
      const frame = frameOf(
        container,
        url,
        item.alt ?? provider?.name ?? "",
        options,
      );
      const ready = loaded(frame, signal);
      const base = {
        interactive: true,
        aspect: provider?.aspect,
        ready,
        unmount: () => frame.remove(),
      };
      const remote = provider && remotes.get(provider);
      if (!remote) return base;
      const origin = new URL(url).origin;
      const send = (message: object) =>
        frame.contentWindow?.postMessage(JSON.stringify(message), origin);
      let pending = autoplay;
      let current = false;
      let state: "playing" | "paused" | undefined;
      let retry: ReturnType<typeof setTimeout> | undefined;
      container.ownerDocument.defaultView?.addEventListener(
        "message",
        (event) => {
          if (event.source !== frame.contentWindow || event.origin !== origin)
            return;
          const data = parse(event.data);
          state = (data && remote.state(data)) ?? state;
          if (state === "playing") {
            pending = false;
            clearTimeout(retry);
          }
        },
        { signal },
      );
      signal.addEventListener("abort", () => clearTimeout(retry));
      void ready.then(() => remote.greet(send));
      return {
        ...base,
        pause() {
          current = false;
          clearTimeout(retry);
          send(remote.command("pause"));
        },
        resume() {
          current = true;
          if (!pending) return;
          pending = false;
          void ready.then(() => {
            // A slide left before its player loaded stays quiet.
            if (signal.aborted || !current) return;
            send(remote.command("play"));
            // A player the browser keeps from starting with sound gets one muted try.
            retry = setTimeout(() => {
              if (state === "playing") return;
              send(remote.command("mute"));
              send(remote.command("play"));
            }, MUTED_RETRY);
          });
        },
      };
    },
  };
}
