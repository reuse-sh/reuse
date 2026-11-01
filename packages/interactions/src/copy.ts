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

function copyWithSelection(text: string, document: Document): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.setAttribute("aria-hidden", "true");
  area.style.cssText =
    "position:fixed;inset:0 auto auto 0;opacity:0;pointer-events:none";
  const focused = document.activeElement as HTMLElement | null;
  const selection = document.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  document.body.append(area);
  area.focus({ preventScroll: true });
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
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

async function writeText(text: string, document: Document): Promise<void> {
  const clipboard = document.defaultView?.navigator.clipboard;
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      return;
    } catch (error) {
      if (copyWithSelection(text, document)) return;
      throw error;
    }
  }
  if (!copyWithSelection(text, document))
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
  const originalClass = button.getAttribute("class");
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
    try {
      const text = await (options.getText ? options.getText() : options.text);
      if (!text) throw new Error("There is no text to copy.");
      await writeText(text, document);
      if (destroyed || current !== attempt) return;
      set("copied");
      options.onCopy?.(text);
    } catch (error) {
      if (destroyed || current !== attempt) return;
      set("error");
      options.onError?.(error);
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
      if (originalClass === null) button.removeAttribute("class");
      else button.setAttribute("class", originalClass);
      if (originalState === null) button.removeAttribute("data-state");
      else button.setAttribute("data-state", originalState);
      if (originalLabel === null) button.removeAttribute("aria-label");
      else button.setAttribute("aria-label", originalLabel);
    },
  };
}
