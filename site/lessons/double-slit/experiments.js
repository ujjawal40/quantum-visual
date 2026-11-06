// Experiments for lesson 4.3. The simulation announces what happens with
// document events (fired, hit, setup); this file turns them into finished tasks.

import { createTasks } from "../../assets/js/ui/lesson.js";
import { deBroglie, fringeSpacing } from "./model.js";

const lab = createTasks(document.querySelector("[data-tasks]"), "double-slit", [
  {
    id: "single",
    title: "Fire 10 electrons one at a time",
    detail: "Use \"Fire one electron\". Does each electron spread out, or land in one place?",
  },
  {
    id: "pattern",
    title: "Build the pattern with 1,000 electrons",
    detail: "With both slits open and no detectors, keep firing until 1,000 have landed.",
  },
  {
    id: "watch",
    title: "Watch which slit they use",
    detail: "Turn on the detectors and collect 500 electrons. What happens to the fringes?",
  },
  {
    id: "one",
    title: "Close one slit",
    detail: "Collect 300 electrons through a single slit and compare with two slits.",
  },
  {
    id: "wider",
    title: "Make the fringes wider",
    detail: "Change the setup until the fringe spacing is at least 1.5 times its starting 12.3 µm.",
  },
  {
    id: "predict",
    kind: "measure",
    title: "Predict the fringe spacing",
    detail: "Electrons at 20 kV, slits 2.0 µm apart, screen 1 m away. Work out Δy = λL/d, then check it in the simulation.",
    answer: 4.34,
    tolerance: 0.1,
    unit: "µm",
    explain: "λ = 8.67 pm at 20 kV, so Δy = 8.67 × 10⁻¹² × 1 ÷ 2.0 × 10⁻⁶ = 4.3 µm.",
  },
  {
    id: "double",
    kind: "measure",
    title: "If the slits are twice as far apart, the fringe spacing becomes how many times as big?",
    detail: "Try it: note the spacing, double the slit separation, and compare.",
    answer: 0.5,
    tolerance: 0.01,
    unit: "times",
    explain: "0.5 times: Δy = λL/d, so doubling d halves the spacing and the fringes crowd together.",
  },
]);

const START_SPACING = fringeSpacing(deBroglie(10000), 1e-6);
let singles = 0;
let setup = { mode: "both", spacing: START_SPACING };

document.addEventListener("fired", ({ detail }) => {
  if (!detail.single) return;
  singles++;
  if (singles >= 10) lab.complete("single", "Every electron landed as a single dot in one place.");
});

document.addEventListener("setup", ({ detail }) => {
  setup = detail;
});

document.addEventListener("hit", ({ detail: { total, mode } }) => {
  if (mode === "both" && total >= 1000) lab.complete("pattern", "Bright and dark fringes: no electron lands in the dark bands.");
  if (mode === "watch" && total >= 500) lab.complete("watch", "The fringes vanished: knowing the path destroys the interference.");
  if (mode === "one" && total >= 300) lab.complete("one", "One broad hump: one slit gives no fringes.");
  if (mode === "both" && total >= 200 && setup.spacing >= 1.5 * START_SPACING) {
    lab.complete("wider", `Spacing ${(setup.spacing * 1e6).toFixed(1)} µm. Lower energy or closer slits both widen the fringes.`);
  }
});
