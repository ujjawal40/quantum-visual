// Small helpers every simulation uses.

export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Read a design token, e.g. cssVar("--signal"). */
export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * Keep a canvas sharp on any screen. Calls onResize({ ctx, w, h }) with the
 * size in CSS pixels whenever the canvas changes size; draw in CSS pixels.
 */
export function fitCanvas(canvas, onResize) {
  const ctx = canvas.getContext("2d");
  const state = { ctx, w: 0, h: 0 };
  const apply = (notify) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.w = rect.width;
    state.h = rect.height;
    if (notify) onResize?.(state);
  };
  // Size now without calling back (the caller may still be setting up);
  // the observer fires once it starts and on every later resize.
  apply(false);
  new ResizeObserver(() => apply(true)).observe(canvas);
  return state;
}

/**
 * Animation loop that pauses while the element is off-screen or the tab is
 * hidden. step(dt) gets seconds since the last frame (capped at 0.05).
 */
export function animate(el, step) {
  let visible = true;
  let last = performance.now();
  let raf = 0;
  const frame = (t) => {
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    step(dt);
    raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (raf || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? start() : stop();
  }).observe(el);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  start();
  return { stop, start };
}

/** Bind a range input to a value label and a callback; returns the current value getter. */
export function bindRange(input, { format = (v) => v, onInput } = {}) {
  const out = document.querySelector(`[data-value-for="${input.id}"]`);
  const update = () => {
    const v = Number(input.value);
    if (out) out.textContent = format(v);
    onInput?.(v);
  };
  input.addEventListener("input", update);
  update();
  return () => Number(input.value);
}

/** Format a number in scientific notation with Unicode superscripts, e.g. 2.19 × 10⁶. */
export function sci(x, digits = 3) {
  if (x === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(x)));
  if (exp >= -2 && exp <= 3) return x.toPrecision(digits);
  const mant = (x / 10 ** exp).toPrecision(digits);
  const sup = String(exp).replace(/[-0-9]/g, (d) => "⁻⁰¹²³⁴⁵⁶⁷⁸⁹"["-0123456789".indexOf(d)]);
  return `${mant} × 10${sup}`;
}
