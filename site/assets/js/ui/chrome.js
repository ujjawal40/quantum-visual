// Page chrome shared by every page: header, footer, theme switch and
// previous/next lesson links. Pages include <header data-chrome></header>
// and <footer data-chrome></footer> and load this module.

import { INTERACTIVE, findLesson, REPO } from "../course.js";
import { allTransitions } from "../physics/hydrogen.js";
import { isVisible, wavelengthToCSS, VISIBLE_MIN, VISIBLE_MAX } from "../physics/spectrum.js";
import { getTheme, setTheme } from "./store.js";

/** URL of the site root, worked out from where this file lives. */
export const ROOT = new URL("../../../", import.meta.url);
export const url = (path) => new URL(path, ROOT).href;

/** Hydrogen's visible lines as an SVG strip: the site's signature. */
export function spectrumStrip({ height = 6, label = true } = {}) {
  const lines = allTransitions(6).filter((t) => isVisible(t.nm));
  const span = VISIBLE_MAX - VISIBLE_MIN;
  const ticks = lines
    .map((t) => {
      const x = ((t.nm - VISIBLE_MIN) / span) * 1000;
      return `<rect x="${x - 2.5}" y="0" width="5" height="${height}" fill="${wavelengthToCSS(t.nm)}"/>`;
    })
    .join("");
  const title = label ? `<title>Hydrogen's visible spectrum: lines at ${lines.map((t) => Math.round(t.nm)).join(", ")} nm</title>` : "";
  return `<svg class="spectrum-strip" viewBox="0 0 1000 ${height}" preserveAspectRatio="none" role="img" aria-label="Hydrogen's visible spectrum">${title}<rect width="1000" height="${height}" class="spectrum-strip__bg"/>${ticks}</svg>`;
}

function applyTheme(theme) {
  if (theme) document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set) return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function header() {
  const el = document.querySelector("header[data-chrome]");
  if (!el) return;
  el.className = "site-header";
  el.innerHTML = `
    <div class="site-header__bar">
      <a class="wordmark" href="${url("index.html")}">Quantum Visual</a>
      <nav class="site-nav" aria-label="Main">
        <a href="${url("index.html#course")}">Course</a>
        <a href="${REPO}/tree/main/labs">Python labs</a>
        <a href="${REPO}">GitHub</a>
        <button class="theme-switch" type="button" aria-label="Switch to dark mode"></button>
      </nav>
    </div>
    ${spectrumStrip()}`;

  const btn = el.querySelector(".theme-switch");
  const sync = () => {
    const dark = currentTheme() === "dark";
    btn.textContent = dark ? "Light" : "Dark";
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  };
  btn.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
    sync();
    document.dispatchEvent(new CustomEvent("themechange", { detail: next }));
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    sync();
    document.dispatchEvent(new CustomEvent("themechange", { detail: currentTheme() }));
  });
  sync();
}

function lessonNav() {
  const slug = document.body.dataset.lesson;
  const host = document.querySelector("[data-lesson-nav]");
  if (!slug || !host) return;
  const i = INTERACTIVE.findIndex((l) => l.slug === slug);
  const prev = INTERACTIVE[i - 1];
  const next = INTERACTIVE[i + 1];
  const link = (l, dir) =>
    l
      ? `<a class="lesson-nav__link lesson-nav__link--${dir}" href="${url(`lessons/${l.slug}/`)}">
           <span class="lesson-nav__dir">${dir === "prev" ? "Previous" : "Next"} lesson</span>
           <span class="lesson-nav__title">${l.id} ${l.title}</span></a>`
      : `<span></span>`;
  host.className = "lesson-nav";
  host.innerHTML = link(prev, "prev") + link(next, "next");
}

function crumbs() {
  const slug = document.body.dataset.lesson;
  const host = document.querySelector("[data-crumbs]");
  const lesson = slug && findLesson(slug);
  if (!host || !lesson) return;
  host.className = "crumbs";
  host.innerHTML = `<a href="${url("index.html#module-" + lesson.module.n)}">Module ${lesson.module.n}: ${lesson.module.title}</a>
    <span aria-hidden="true">/</span> <span>Lesson ${lesson.id}</span>`;
}

function footer() {
  const el = document.querySelector("footer[data-chrome]");
  if (!el) return;
  el.className = "site-footer";
  el.innerHTML = `
    <p>Quantum Visual is an open course for grades 11 and 12.
       Lesson text, simulations and Python labs are on
       <a href="${REPO}">GitHub</a>; corrections and new lessons are welcome.</p>`;
}

applyTheme(getTheme());
header();
crumbs();
lessonNav();
footer();
