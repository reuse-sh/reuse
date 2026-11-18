import { arc, moveDuration, moveEasing, type StagePoint } from "./path.js";

export { arc, cubicBezier, moveDuration, type StagePoint } from "./path.js";

/** A target name from data-stage-target, an element inside the scene, or a point in scene units. */
export type StageTarget = string | Element | StagePoint;

export interface StageAct {
  /** Aborts when the pass ends early: the stage left the screen, the visitor took over, or it was destroyed. */
  readonly signal: AbortSignal;
  move(target: StageTarget, options?: { duration?: number }): Promise<void>;
  click(target?: StageTarget): Promise<void>;
  press(target?: StageTarget): Promise<void>;
  release(): Promise<void>;
  type(
    target: string | Element,
    text: string,
    options?: { interval?: number },
  ): Promise<void>;
  scroll(
    target: string | Element,
    to: { left?: number; top?: number },
    options?: { duration?: number },
  ): Promise<void>;
  wait(ms: number): Promise<void>;
  /** Applies a change, then waits until it is painted. */
  run(change: () => void | Promise<void>): Promise<void>;
  /** Waits, frame by frame, until check returns true. */
  until(check: () => boolean, timeout?: number): Promise<void>;
}

export interface StageOptions {
  /** The scene's design width; the scene scales to the root's width. */
  width: number;
  /** The scene's design height. */
  height: number;
  /** What the scene shows, for assistive technology. */
  label: string;
  /** One pass of the scene. It plays again from reset() until the stage stops. */
  script: (act: StageAct) => void | Promise<void>;
  /** Puts the scene back in its first frame. Runs before every pass. */
  reset?: () => void;
  /** Shows the frame reduced motion keeps. Defaults to reset. */
  still?: () => void;
  /** Where the cursor waits between passes, in scene units. */
  rest?: StagePoint;
  /** Lets a pointer that enters the stage take over the scene. */
  interactive?: boolean;
  /** How long the first frame holds before the cursor appears, in ms. */
  delay?: number;
}

export type StageStatus = "waiting" | "playing" | "visitor" | "still";

export interface Stage {
  readonly status: StageStatus;
  /** Ends the current pass and plays from the first frame. */
  restart(): void;
  destroy(): void;
}

class Aborted extends Error {
  constructor() {
    super("The stage pass ended early.");
  }
}

const POINTER_ID = 1931;
const NATIVE =
  "a[href], area[href], button, input, select, textarea, summary, iframe, [contenteditable]";
const FOCUSABLE = `${NATIVE}, [tabindex]`;
const HOVERABLE =
  '[data-stage-target], button, a, input, select, textarea, label, summary, [role="button"], [role="tab"], [role="option"], [role="menuitem"], [role="slider"]';
const scripted = new WeakSet<Event>();

/** Whether a stage cursor sent this event, so page code that closes on an outside press can ignore it. */
export function isStageEvent(event: Event) {
  return scripted.has(event);
}

const CURSOR =
  '<svg viewBox="0 0 20 22" aria-hidden="true"><path d="M3 2v15.6l4-3.7 2.6 5.8 2.7-1.2-2.6-5.7h5.6z" fill="#0a0a0a" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';

function positive(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError(`${name} must be a positive number.`);
  return value;
}

export function createStage(root: HTMLElement, options: StageOptions): Stage {
  const document = root.ownerDocument;
  const window = document.defaultView;
  if (!window) throw new Error("The stage root must belong to a window.");
  const view = window;
  const width = positive(options.width, "width");
  const height = positive(options.height, "height");
  if (!options.label.trim())
    throw new TypeError("Describe the scene in label.");
  const delay = Math.max(0, options.delay ?? 400);
  const rest = options.rest ?? { x: width * 0.82, y: height * 0.86 };

  const original = {
    style: root.getAttribute("style"),
    role: root.getAttribute("role"),
    label: root.getAttribute("aria-label"),
    hadClass: root.classList.contains("re-stage"),
  };
  const first = root.firstElementChild;
  const ownScene =
    root.childElementCount === 1 && first?.classList.contains("re-stage-scene");
  const scene = ownScene
    ? (first as HTMLElement)
    : document.createElement("div");
  const sceneHidden = scene.getAttribute("aria-hidden");
  if (!ownScene) {
    scene.className = "re-stage-scene";
    scene.append(...root.childNodes);
    root.append(scene);
  }
  scene.setAttribute("aria-hidden", "true");
  root.classList.add("re-stage");
  root.setAttribute("role", "img");
  root.setAttribute("aria-label", options.label);
  root.style.setProperty("--re-stage-width", `${width}px`);
  root.style.setProperty("--re-stage-height", `${height}px`);
  root.style.setProperty("--re-stage-ratio", `${width} / ${height}`);

  const shield = document.createElement("div");
  shield.className = "re-stage-shield";
  const cursor = document.createElement("div");
  cursor.className = "re-stage-cursor";
  cursor.innerHTML = `${CURSOR}<span class="re-stage-ring"></span>`;
  const ring = cursor.lastElementChild as HTMLElement;
  root.append(shield, cursor);

  let scale = 1;
  const measure = () => {
    const next = root.clientWidth / width;
    scale = next > 0 ? next : 1;
    root.style.setProperty("--re-stage-scale", String(scale));
    draw();
  };

  const silenced = new Map<Element, string | null>();
  const silence = () => {
    for (const element of scene.querySelectorAll(FOCUSABLE)) {
      if (!silenced.has(element))
        silenced.set(element, element.getAttribute("tabindex"));
      if (!element.matches(NATIVE)) element.removeAttribute("tabindex");
      else if (element.getAttribute("tabindex") !== "-1")
        element.setAttribute("tabindex", "-1");
    }
  };
  const mutations = new view.MutationObserver(silence);
  mutations.observe(scene, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["tabindex", "href", "contenteditable"],
  });
  silence();
  const keepFocus = (event: FocusEvent) => {
    if (visitor) return;
    const previous = event.relatedTarget;
    if (previous instanceof view.HTMLElement && !scene.contains(previous))
      previous.focus({ preventScroll: true });
    else (event.target as HTMLElement).blur();
  };
  scene.addEventListener("focusin", keepFocus);

  let position = { ...rest };
  let over: Element | null = null;
  let hovered: Element | null = null;
  let active: Element | null = null;
  let pressed: Element | null = null;

  function draw() {
    cursor.style.transform = `translate(${position.x * scale}px, ${position.y * scale}px) scale(${scale})`;
  }

  /** Scene units to window coordinates, through the scene's measured box. */
  function client(point: StagePoint) {
    const box = scene.getBoundingClientRect();
    return {
      x: box.left + box.width / 2 + (point.x - width / 2) * scale,
      y: box.top + box.height / 2 + (point.y - height / 2) * scale,
    };
  }

  function centerOf(element: Element): StagePoint {
    const box = scene.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return {
      x:
        width / 2 +
        (rect.left + rect.width / 2 - box.left - box.width / 2) / scale,
      y:
        height / 2 +
        (rect.top + rect.height / 2 - box.top - box.height / 2) / scale,
    };
  }

  function element(target: string | Element) {
    if (typeof target !== "string") {
      if (!scene.contains(target))
        throw new Error("The stage target must be inside the scene.");
      return target;
    }
    for (const candidate of scene.querySelectorAll("[data-stage-target]"))
      if (candidate.getAttribute("data-stage-target") === target)
        return candidate;
    throw new Error(`The stage has no target "${target}".`);
  }

  function locate(target: StageTarget) {
    if (typeof target === "object" && !(target instanceof view.Element))
      return { point: target as StagePoint, element: null };
    const found = element(target as string | Element);
    return { point: centerOf(found), element: found };
  }

  function emit(
    type: string,
    target: Element,
    init: { button?: number; bubbles?: boolean } = {},
  ) {
    const at = client(position);
    const Event =
      (type.startsWith("pointer") || type === "click") && view.PointerEvent
        ? view.PointerEvent
        : view.MouseEvent;
    const event = new Event(type, {
      bubbles: init.bubbles ?? true,
      cancelable: true,
      composed: true,
      clientX: at.x,
      clientY: at.y,
      screenX: at.x + view.screenX,
      screenY: at.y + view.screenY,
      button: init.button ?? -1,
      buttons: pressed ? 1 : 0,
      detail: type === "click" ? 1 : 0,
      pointerId: POINTER_ID,
      pointerType: "mouse",
      isPrimary: true,
      width: 1,
      height: 1,
      pressure: pressed ? 0.5 : 0,
    } as PointerEventInit);
    scripted.add(event);
    target.dispatchEvent(event);
  }

  const chain = (from: Element | null) => {
    const list: Element[] = [];
    for (
      let node = from;
      node && scene.contains(node);
      node = node.parentElement
    )
      list.push(node);
    return list;
  };

  function enter(next: Element | null) {
    if (next === over) return;
    const before = chain(over);
    const after = chain(next);
    if (over) {
      emit("pointerout", over);
      emit("mouseout", over);
      for (const node of before)
        if (!after.includes(node)) {
          emit("pointerleave", node, { bubbles: false });
          emit("mouseleave", node, { bubbles: false });
        }
    }
    over = next;
    if (next) {
      emit("pointerover", next);
      emit("mouseover", next);
      for (const node of [...after].reverse())
        if (!before.includes(node)) {
          emit("pointerenter", node, { bubbles: false });
          emit("mouseenter", node, { bubbles: false });
        }
    }
    const target = next?.closest(HOVERABLE) ?? null;
    const hover = target && scene.contains(target) ? target : null;
    if (hover !== hovered) {
      hovered?.removeAttribute("data-stage-hover");
      hovered = hover;
      hovered?.setAttribute("data-stage-hover", "");
    }
  }

  function hit() {
    const at = client(position);
    const stack = document.elementsFromPoint?.(at.x, at.y) ?? [];
    return stack.find((node) => scene.contains(node)) ?? null;
  }

  /** The element under the cursor now, the way a real press or release finds it. */
  function under() {
    const found = hit();
    if (found) enter(found);
    else if (over && !over.isConnected) enter(null);
    return over ?? scene;
  }

  function step(point: StagePoint, aim: Element | null, arrived: boolean) {
    position = point;
    draw();
    const found = hit();
    if (found) enter(found);
    else if (arrived && !(aim && over && aim.contains(over))) enter(aim);
    if (over) {
      emit("pointermove", over);
      emit("mousemove", over);
    }
  }

  const frame = (signal: AbortSignal) =>
    new Promise<number>((resolve, reject) => {
      if (signal.aborted) return reject(new Aborted());
      const abort = () => {
        view.cancelAnimationFrame(id);
        reject(new Aborted());
      };
      const id = view.requestAnimationFrame((time) => {
        signal.removeEventListener("abort", abort);
        resolve(time);
      });
      signal.addEventListener("abort", abort, { once: true });
    });

  function makeAct(signal: AbortSignal): StageAct {
    const check = () => {
      if (signal.aborted) throw new Aborted();
    };
    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        if (signal.aborted) return reject(new Aborted());
        const abort = () => {
          view.clearTimeout(timer);
          reject(new Aborted());
        };
        const timer = view.setTimeout(
          () => {
            signal.removeEventListener("abort", abort);
            resolve();
          },
          Math.max(0, ms),
        );
        signal.addEventListener("abort", abort, { once: true });
      });
    const animate = async (ms: number, draw: (t: number) => void) => {
      let start: number | undefined;
      for (;;) {
        const time = await frame(signal);
        start ??= time;
        const t = Math.min(1, (time - start) / ms);
        draw(t);
        if (t >= 1) return;
      }
    };
    const move: StageAct["move"] = async (target, moveOptions = {}) => {
      check();
      const from = { ...position };
      const goal = locate(target);
      const distance = Math.hypot(goal.point.x - from.x, goal.point.y - from.y);
      const ms = moveOptions.duration ?? moveDuration(distance);
      if (ms > 0)
        await animate(ms, (t) => {
          const point = goal.element ? centerOf(goal.element) : goal.point;
          step(arc(from, point)(moveEasing(t)), goal.element, t >= 1);
        });
      else
        step(
          goal.element ? centerOf(goal.element) : goal.point,
          goal.element,
          true,
        );
    };
    const press: StageAct["press"] = async (target) => {
      if (target !== undefined) await move(target);
      check();
      if (pressed) return;
      const on = under();
      pressed = on;
      cursor.setAttribute("data-pressed", "");
      active = hovered;
      active?.setAttribute("data-stage-active", "");
      ring.animate?.(
        [
          { opacity: 0.32, transform: "translate(-50%, -50%) scale(0.3)" },
          { opacity: 0, transform: "translate(-50%, -50%) scale(1)" },
        ],
        { duration: 420, easing: "cubic-bezier(0.2, 0, 0, 1)" },
      );
      emit("pointerdown", on, { button: 0 });
      emit("mousedown", on, { button: 0 });
      await wait(90);
    };
    const release: StageAct["release"] = async () => {
      check();
      const down = pressed;
      if (!down) return;
      const up = under();
      pressed = null;
      cursor.removeAttribute("data-pressed");
      active?.removeAttribute("data-stage-active");
      active = null;
      emit("pointerup", up, { button: 0 });
      emit("mouseup", up, { button: 0 });
      let common: Element | null = down;
      while (common && !common.contains(up)) common = common.parentElement;
      if (common && scene.contains(common))
        emit("click", common, { button: 0 });
      await wait(60);
    };
    return {
      signal,
      move,
      press,
      release,
      async click(target) {
        await press(target);
        await wait(70);
        await release();
      },
      async type(target, text, typeOptions = {}) {
        check();
        const field = element(target);
        if (
          !(field instanceof view.HTMLInputElement) &&
          !(field instanceof view.HTMLTextAreaElement)
        )
          throw new TypeError("The stage can only type into a text field.");
        const interval = typeOptions.interval ?? 55;
        for (const [index, character] of [...text].entries()) {
          // Frameworks such as React track value writes on the element, so the
          // prototype setter is what makes the input event read as a change.
          const setter = Object.getOwnPropertyDescriptor(
            Object.getPrototypeOf(field),
            "value",
          )?.set;
          setter?.call(field, field.value + character);
          const event = new view.InputEvent("input", {
            bubbles: true,
            data: character,
            inputType: "insertText",
          });
          scripted.add(event);
          field.dispatchEvent(event);
          await wait(interval * (0.7 + ((index * 7 + 3) % 5) * 0.15));
        }
      },
      async scroll(target, to, scrollOptions = {}) {
        check();
        const box = element(target);
        const from = { left: box.scrollLeft, top: box.scrollTop };
        const goal = { left: to.left ?? from.left, top: to.top ?? from.top };
        const distance = Math.hypot(goal.left - from.left, goal.top - from.top);
        const ms = scrollOptions.duration ?? moveDuration(distance) + 160;
        if (ms <= 0) return;
        await animate(ms, (t) => {
          const eased = moveEasing(t);
          box.scrollLeft = from.left + (goal.left - from.left) * eased;
          box.scrollTop = from.top + (goal.top - from.top) * eased;
        });
      },
      wait,
      async run(change) {
        check();
        await change();
        await frame(signal);
        await frame(signal);
      },
      async until(test, timeout = 3000) {
        const limit = Date.now() + timeout;
        while (!test()) {
          if (Date.now() > limit)
            throw new Error("The stage waited longer than the timeout.");
          await frame(signal);
        }
      },
    };
  }

  let controller: AbortController | null = null;
  let status: StageStatus = "waiting";
  let destroyed = false;
  let failed = false;
  let visible = !view.IntersectionObserver;
  let visitor = false;
  let resume: number | undefined;
  const reduced = view.matchMedia?.("(prefers-reduced-motion: reduce)");

  const showCursor = (shown: boolean) =>
    cursor.toggleAttribute("data-visible", shown);

  function letGo() {
    if (pressed) {
      emit("pointercancel", pressed, { button: 0 });
      pressed = null;
    }
    cursor.removeAttribute("data-pressed");
    active?.removeAttribute("data-stage-active");
    active = null;
    enter(null);
  }

  function stop(next: StageStatus, after?: () => void) {
    controller?.abort();
    controller = null;
    letGo();
    showCursor(false);
    status = next;
    after?.();
  }

  async function play(own: AbortController) {
    const act = makeAct(own.signal);
    let firstPass = true;
    for (;;) {
      options.reset?.();
      await act.run(() => {});
      if (firstPass) {
        position = { ...rest };
        draw();
        await act.wait(delay);
        showCursor(true);
        firstPass = false;
      }
      await options.script(act);
      await act.release();
      await act.move(rest);
      await act.wait(500);
    }
  }

  function update() {
    if (destroyed) return;
    if (reduced?.matches) {
      if (status !== "still")
        stop("still", () => (options.still ?? options.reset)?.());
      return;
    }
    if (visitor) {
      if (status !== "visitor") stop("visitor");
      return;
    }
    if (!visible || document.visibilityState === "hidden" || failed) {
      if (controller) stop("waiting", () => options.reset?.());
      else status = "waiting";
      return;
    }
    if (controller) return;
    const own = new AbortController();
    controller = own;
    status = "playing";
    play(own).catch((error) => {
      if (error instanceof Aborted || controller !== own) return;
      failed = true;
      stop("waiting");
      view.reportError(error);
    });
  }

  const intersection = view.IntersectionObserver
    ? new view.IntersectionObserver(
        ([entry]) => {
          visible = Boolean(
            entry?.isIntersecting && entry.intersectionRatio >= 0.4,
          );
          update();
        },
        { threshold: [0, 0.4] },
      )
    : null;
  intersection?.observe(root);
  const resize = view.ResizeObserver ? new view.ResizeObserver(measure) : null;
  resize?.observe(root);
  measure();

  const takeOver = (event: PointerEvent) => {
    if (scripted.has(event)) return;
    view.clearTimeout(resume);
    visitor = true;
    root.setAttribute("data-visitor", "");
    update();
    if (event.pointerType === "touch") giveBack(4000);
  };
  const giveBack = (ms: number) => {
    view.clearTimeout(resume);
    resume = view.setTimeout(() => {
      visitor = false;
      root.removeAttribute("data-visitor");
      update();
    }, ms);
  };
  const enterRoot = (event: PointerEvent) => {
    if (event.pointerType !== "touch") takeOver(event);
  };
  const downRoot = (event: PointerEvent) => {
    if (event.pointerType === "touch") takeOver(event);
  };
  const leaveRoot = (event: PointerEvent) => {
    if (!scripted.has(event) && event.pointerType !== "touch" && visitor)
      giveBack(1200);
  };
  if (options.interactive) {
    root.addEventListener("pointerenter", enterRoot);
    root.addEventListener("pointerdown", downRoot);
    root.addEventListener("pointerleave", leaveRoot);
  }
  const onPage = () => update();
  document.addEventListener("visibilitychange", onPage);
  reduced?.addEventListener?.("change", onPage);
  update();

  return {
    get status() {
      return status;
    },
    restart() {
      if (destroyed) return;
      failed = false;
      if (controller) stop("waiting");
      update();
    },
    destroy() {
      if (destroyed) return;
      stop("waiting");
      destroyed = true;
      view.clearTimeout(resume);
      intersection?.disconnect();
      resize?.disconnect();
      mutations.disconnect();
      scene.removeEventListener("focusin", keepFocus);
      document.removeEventListener("visibilitychange", onPage);
      reduced?.removeEventListener?.("change", onPage);
      root.removeEventListener("pointerenter", enterRoot);
      root.removeEventListener("pointerdown", downRoot);
      root.removeEventListener("pointerleave", leaveRoot);
      for (const [node, value] of silenced) {
        if (value === null) node.removeAttribute("tabindex");
        else node.setAttribute("tabindex", value);
      }
      shield.remove();
      cursor.remove();
      if (sceneHidden === null) scene.removeAttribute("aria-hidden");
      else scene.setAttribute("aria-hidden", sceneHidden);
      if (!ownScene) {
        root.append(...scene.childNodes);
        scene.remove();
      }
      root.removeAttribute("data-visitor");
      if (!original.hadClass) root.classList.remove("re-stage");
      if (original.role === null) root.removeAttribute("role");
      else root.setAttribute("role", original.role);
      if (original.label === null) root.removeAttribute("aria-label");
      else root.setAttribute("aria-label", original.label);
      if (original.style === null) root.removeAttribute("style");
      else root.setAttribute("style", original.style);
    },
  };
}
