// Experiments for lesson 5.4. The simulation sends an "sg-update" event with
// its counts after every atom; this file turns those into finished tasks.

import { createTasks } from "../../assets/js/ui/lesson.js";

const lab = createTasks(document.querySelector("[data-tasks]"), "stern-gerlach", [
  {
    id: "smear",
    title: "See what classical physics predicts",
    detail: "Switch to Classical magnets with one Z magnet and fire at least 60 atoms.",
  },
  {
    id: "two",
    title: "See what really happens",
    detail: "Switch to Quantum spin with one Z magnet and fire at least 40 atoms.",
  },
  {
    id: "zz",
    title: "Measure z twice",
    detail: "Use Z, then Z again. Do the atoms from the first magnet change their answer?",
  },
  {
    id: "zx",
    title: "Measure z, then x",
    detail: "Use Z, then X, and fire at least 100 atoms to the screen.",
  },
  {
    id: "zxz",
    title: "Bring back the beam you blocked",
    detail: "Use Z, then X, then Z. Can atoms you filtered out at the start reappear?",
  },
  {
    id: "zx-percent",
    kind: "measure",
    title: "What percentage come out +x after Z, then X?",
    detail: "Results are random, so get at least 200 atoms to the screen before you read it.",
    answer: 50,
    tolerance: 3,
    unit: "%",
    explain: "50%: x is 90° from z, and cos²(45°) = ½. Knowing z tells you nothing about x.",
  },
  {
    id: "tilt-percent",
    kind: "measure",
    title: "Tilt the second magnet to 60°. What percentage come out up?",
    detail: "Use Z, then a tilted magnet, and fire a few hundred atoms.",
    answer: 75,
    tolerance: 3,
    unit: "%",
    explain: "75%: cos²(60° ÷ 2) = cos²(30°) = ¾.",
  },
]);

document.addEventListener("sg-update", ({ detail: d }) => {
  const reached = d.up + d.down;
  const upPc = reached ? Math.round((100 * d.up) / reached) : 0;

  if (d.mode === "classical" && d.setup === "z" && reached >= 60) {
    lab.complete("smear", "A smear from top to bottom: every angle gives a different push.");
  }
  if (d.mode !== "quantum") return;

  if (d.setup === "z" && reached >= 40) {
    lab.complete("two", `Two spots, ${d.up} up and ${d.down} down, and nothing in between.`);
  }
  if (d.setup === "zz" && reached >= 30 && (d.up === 0 || d.down === 0)) {
    lab.complete("zz", `All ${reached} came out the same way again: the first measurement fixed the answer.`);
  }
  if (d.setup === "zx" && reached >= 100 && upPc >= 35 && upPc <= 65) {
    lab.complete("zx", `${upPc}% went +x, ${100 - upPc}% went −x: about half and half.`);
  }
  if (d.setup === "zxz" && reached >= 20 && Math.min(d.up, d.down) >= 5) {
    const back = d.block === "down" ? d.down : d.up;
    lab.complete("zxz", `${back} atoms came out ${d.block} again, even though that beam was blocked after the first magnet. Measuring x erased z.`);
  }
});
