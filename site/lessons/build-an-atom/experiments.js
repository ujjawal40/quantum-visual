// Experiments for lesson 1.4. The simulation announces every change with an
// "atomchange" event carrying { p, n, e, A, charge, element, notation, stability }.

import { createTasks } from "../../assets/js/ui/lesson.js";

const lab = createTasks(document.querySelector("[data-tasks]"), "build-an-atom", [
  {
    id: "h1",
    title: "Make the simplest atom",
    detail: "Build a neutral hydrogen-1 atom: the most common atom in the universe.",
  },
  {
    id: "c12",
    title: "Make a neutral carbon-12 atom",
    detail: "The atom that life is built on. How many of each particle does it need?",
  },
  {
    id: "c-iso",
    title: "Make a different isotope of carbon",
    detail: "Keep it carbon, but give it a mass number other than 12.",
  },
  {
    id: "pos-ion",
    title: "Make a positive ion",
    detail: "Any element, with more protons than electrons.",
  },
  {
    id: "neg-ion",
    title: "Make a negative ion",
    detail: "Any element, with more electrons than protons.",
  },
  {
    id: "alpha",
    title: "Build an alpha particle",
    detail: "The helium-4 nucleus that radioactive atoms fire out: a nucleus with no electrons at all.",
  },
  {
    id: "o18",
    kind: "measure",
    title: "How many neutrons are in oxygen-18?",
    detail: "Build it, or work it out from A = Z + N.",
    answer: 10,
    tolerance: 0,
    unit: "neutrons",
    explain: "10 neutrons: oxygen always has 8 protons, and 18 − 8 = 10.",
  },
]);

// Check only once the student pauses, so atoms passed through on the way
// to another one (carbon-8 on the way to carbon-12) don't count.
const SETTLE_MS = 700;
let timer = 0;
document.addEventListener("atomchange", ({ detail }) => {
  clearTimeout(timer);
  timer = setTimeout(() => check(detail), SETTLE_MS);
});

function check(d) {
  const { p, n, e, A, charge, element } = d;
  if (p === 1 && n === 0 && e === 1) lab.complete("h1", "1 proton and 1 electron, no neutron needed.");
  if (p === 6 && n === 6 && e === 6) lab.complete("c12", "6 protons, 6 neutrons, 6 electrons.");
  // Known carbon isotopes run from carbon-8 to carbon-22.
  if (p === 6 && A !== 12 && A >= 8 && A <= 22) {
    lab.complete("c-iso", `Carbon-${A}: still 6 protons, now ${n} neutrons${d.stability === "stable" ? "" : ", and unstable"}.`);
  }
  if (element && charge > 0 && e > 0) lab.complete("pos-ion", `${d.notation}: ${p} protons but only ${e} electrons.`);
  if (element && charge < 0) lab.complete("neg-ion", `${d.notation}: ${e} electrons around ${p} protons.`);
  if (p === 2 && n === 2 && e === 0) lab.complete("alpha", "2 protons and 2 neutrons with no electrons: charge +2.");
}
