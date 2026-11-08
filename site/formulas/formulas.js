// The formulas page: typeset the maths with KaTeX, keep the contents open on
// wide screens, and highlight the formula being read.
//
// KaTeX loads from a CDN as classic deferred scripts. If it cannot load, the
// TeX source stays on the page as plain text, which is still readable.

const contents = document.querySelector(".ftoc details");
const wide = matchMedia("(min-width: 961px)");
const syncContents = () => { if (contents) contents.open = wide.matches; };
syncContents();
wide.addEventListener("change", syncContents);

function typeset() {
  if (typeof window.renderMathInElement !== "function") return false;
  window.renderMathInElement(document.querySelector(".formulas"), {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\(", right: "\\)", display: false },
    ],
    throwOnError: false,
    ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option", "a"],
  });
  // Typesetting changes the page's height, so a link to #some-formula that the
  // browser already followed now points at the wrong place. Go there again.
  const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
  return true;
}

if (!typeset()) window.addEventListener("load", typeset, { once: true });

// Highlight the formula currently in view in the contents.
const links = new Map(
  [...document.querySelectorAll(".ftoc a[href^='#']")].map((a) => [a.getAttribute("href").slice(1), a])
);
let current = null;
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const link = links.get(entry.target.id);
      if (!link || link === current) continue;
      current?.removeAttribute("aria-current");
      link.setAttribute("aria-current", "true");
      current = link;
    }
  },
  { rootMargin: "-90px 0px -70% 0px" }
);
for (const card of document.querySelectorAll(".fcard[id]")) observer.observe(card);
