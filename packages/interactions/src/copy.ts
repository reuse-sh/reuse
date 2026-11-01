export type CopyButtonState = "idle" | "copied" | "error";

interface CopyButtonCallbacks {
  resetMs?: number;
  onCopy?: (text: string) => void;
  onError?: (error: unknown) => void;
}

export type CopyButtonOptions = CopyButtonCallbacks &
  (
    | { text: string; getText?: never }
    | { getText: () => string | Promise<string>; text?: never }
  );

const ICONS =
  '<svg class="re-copy-button-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>' +
  '<svg class="re-copy-button-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' +
  '<svg class="re-copy-button-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7l10 10M17 7L7 17"/></svg>';

const MESSAGES: Record<CopyButtonState, string> = {
  idle: "",
  copied: "Copied",
  error: "Copy failed",
};

function copyWithSelection(text: string, host: Element): boolean {
  const document = host.ownerDocument;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.setAttribute("aria-hidden", "true");
  area.style.cssText =
    "position:fixed;inset:0 auto auto 0;opacity:0;pointer-events:none";
  const focused = document.activeElement as HTMLElement | null;
  const selection = document.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  // An open modal dialog makes the rest of the page inert, so the textarea
  // has to live inside it to take focus and a selection.
  (host.closest("dialog[open]") ?? document.body).append(area);
  area.focus({ preventScroll: true });
  area.select();
  let copied = false;
  try {
    copied = document.activeElement === area && document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  if (range && selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
  focused?.focus?.({ preventScroll: true });
  return copied;
}

async function writeText(text: string, host: Element): Promise<void> {
  const clipboard = host.ownerDocument.defaultView?.navigator.clipboard;
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      return;
    } catch (error) {
      if (copyWithSelection(text, host)) return;
      throw error;
    }
  }
  if (!copyWithSelection(text, host))
    throw new Error("The browser did not allow copying.");
}

export function createCopyButton(
  button: HTMLButtonElement,
  options: CopyButtonOptions,
) {
  const document = button.ownerDocument;
  const view = document.defaultView;
  if (!view) throw new Error("The button must belong to a window.");
  const resetMs = options.resetMs ?? 1600;
  if (!Number.isFinite(resetMs) || resetMs <= 0)
    throw new RangeError("resetMs must be positive.");
  if (options.text === undefined && typeof options.getText !== "function")
    throw new TypeError("Pass text or getText.");

  const originalState = button.getAttribute("data-state");
  const originalLabel = button.getAttribute("aria-label");
  const hadClass = button.classList.contains("re-copy-button");
  const hadClassAttribute = button.hasAttribute("class");
  const icon = document.createElement("span");
  icon.className = "re-copy-button-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = ICONS;
  const status = document.createElement("span");
  status.className = "re-copy-button-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const named =
    button.textContent?.trim() ||
    originalLabel ||
    button.hasAttribute("aria-labelledby");
  if (!named) button.setAttribute("aria-label", "Copy");
  button.classList.add("re-copy-button");
  button.prepend(icon);
  button.after(status);

  let timer: number | undefined;
  let attempt = 0;
  let destroyed = false;

  const set = (state: CopyButtonState) => {
    view.clearTimeout(timer);
    timer = undefined;
    button.setAttribute("data-state", state);
    status.textContent = MESSAGES[state];
    if (state !== "idle") timer = view.setTimeout(() => set("idle"), resetMs);
  };

  const click = async () => {
    const current = ++attempt;
    let text: string;
    try {
      text = await (options.getText ? options.getText() : options.text);
      if (!text) throw new Error("There is no text to copy.");
      await writeText(text, button);
      if (destroyed || current !== attempt) return;
    } catch (error) {
      if (destroyed || current !== attempt) return;
      set("error");
      options.onError?.(error);
      return;
    }
    set("copied");
    try {
      options.onCopy?.(text);
    } catch (error) {
      view.reportError(error);
    }
  };

  set("idle");
  button.addEventListener("click", click);

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      view.clearTimeout(timer);
      timer = undefined;
      button.removeEventListener("click", click);
      icon.remove();
      status.remove();
      if (!hadClass) button.classList.remove("re-copy-button");
      if (!hadClassAttribute && !button.classList.length)
        button.removeAttribute("class");
      if (originalState === null) button.removeAttribute("data-state");
      else button.setAttribute("data-state", originalState);
      if (!named && button.getAttribute("aria-label") === "Copy")
        button.removeAttribute("aria-label");
    },
  };
}
