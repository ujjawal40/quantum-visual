// Experiments for lesson 2.4. The simulation announces every change with a
// "pe-change" event and the graph with "pe-data"; this file turns those into
// finished tasks.

import { createTasks } from "../../assets/js/ui/lesson.js";

const lab = createTasks(document.querySelector("[data-tasks]"), "photoelectric", [
  {
    id: "eject",
    title: "Free an electron",
    detail: "Find a colour of light that knocks electrons out of the sodium plate.",
  },
  {
    id: "bright-nothing",
    title: "Make the brightest light that frees nothing",
    detail: "Turn the brightness to the top with a colour that still frees no electrons.",
  },
  {
    id: "more-not-faster",
    title: "Show that brighter light gives more electrons, not faster ones",
    detail: "Keep the colour fixed and change the brightness a lot. Watch the current and the fastest electron's energy.",
  },
  {
    id: "stop",
    title: "Stop the current with a stopping voltage",
    detail: "While electrons are flowing, raise the voltage until the meter reads zero.",
  },
  {
    id: "threshold",
    kind: "measure",
    title: "Find sodium's threshold wavelength",
    detail: "What is the longest wavelength that still frees electrons from sodium?",
    answer: 544,
    tolerance: 6,
    unit: "nm",
    explain: "About 544 nm (green): λ₀ = 1240 ÷ 2.28 eV. Any longer and a photon has less energy than the work function.",
  },
  {
    id: "points",
    title: "Record four measurements",
    detail: "Use four different colours on one metal and record each stopping voltage on the graph.",
  },
  {
    id: "planck",
    kind: "measure",
    title: "Measure Planck's constant",
    detail: "Read the slope of your best-fit line.",
    answer: 4.14,
    tolerance: 0.15,
    unit: "×10⁻¹⁵ eV·s",
    explain: "h = 4.14 × 10⁻¹⁵ eV·s, which is 6.63 × 10⁻³⁴ J·s. Every metal gives the same slope.",
  },
]);

// For "more, not faster": the brightness range seen at each colour + metal while electrons flow.
const seen = new Map();

document.addEventListener("pe-change", ({ detail: d }) => {
  if (d.brightness > 0 && d.keMax > 0) {
    lab.complete("eject", `${d.nm} nm photons carry ${d.E.toFixed(2)} eV, more than the ${d.phi.toFixed(2)} eV work function.`);

    const key = `${d.nm}|${d.metal}|${d.V}`;
    const r = seen.get(key) ?? { lo: d, hi: d };
    if (d.brightness < r.lo.brightness) r.lo = d;
    if (d.brightness > r.hi.brightness) r.hi = d;
    seen.set(key, r);
    if (r.hi.brightness - r.lo.brightness >= 0.4 && r.lo.current > 0) {
      lab.complete(
        "more-not-faster",
        `Current went from ${r.lo.current.toFixed(0)} to ${r.hi.current.toFixed(0)} µA, but the fastest electron stayed at ${d.keMax.toFixed(2)} eV.`
      );
    }

    if (d.V >= d.keMax) lab.complete("stop", `${d.V.toFixed(2)} V turned back even the ${d.keMax.toFixed(2)} eV electrons.`);
  }

  if (d.brightness >= 0.95 && d.keMax <= 0) {
    lab.complete("bright-nothing", `Full brightness at ${d.nm} nm: each photon has only ${d.E.toFixed(2)} eV, so nothing escapes.`);
  }
});

document.addEventListener("pe-data", ({ detail: d }) => {
  if (d.count >= 4) lab.complete("points", `${d.count} points recorded.`);
});
