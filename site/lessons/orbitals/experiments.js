// Experiments for lesson 5.2. The viewer announces what the student is
// looking at with an "orbitalshown" event; this file turns that into
// finished tasks.

import { createTasks } from "../../assets/js/ui/lesson.js";

const lab = createTasks(document.querySelector("[data-tasks]"), "orbitals", [
  {
    id: "hidden",
    title: "Find the orbital with a hidden inner shell",
    detail: "One shell-2 orbital is a ball inside a bigger ball. Cut it open with the slice to see the gap.",
  },
  {
    id: "plane",
    title: "Find an orbital with a nodal plane",
    detail: "Look for a flat sheet through the nucleus where there are no dots at all.",
  },
  {
    id: "down-z",
    title: "Look at 2pz straight down its own axis",
    detail: "Pick 2pz, then look down z. What happened to the dumbbell?",
  },
  {
    id: "phase-d",
    title: "See the signs of a d orbital",
    detail: "Switch on phase colours for any 3d orbital and find where the colour flips.",
  },
  {
    id: "all-2p",
    title: "Find all three 2p orbitals",
    detail: "They have the same shape and the same energy. How do they differ?",
  },
  {
    id: "nodes-3d",
    kind: "measure",
    title: "How many nodes does a 3d orbital have in total?",
    detail: "Count radial and angular nodes together. Check your answer with the readout.",
    answer: 2,
    tolerance: 0,
    unit: "nodes",
    explain: "2: every orbital has n − 1 nodes. For 3d they are both angular (l = 2) and none are radial.",
  },
  {
    id: "shell-2",
    kind: "measure",
    title: "How many orbitals are in the n = 2 shell?",
    detail: "Count them in the orbital picker.",
    answer: 4,
    tolerance: 0,
    unit: "orbitals",
    explain: "4: one 2s and three 2p. A shell holds n² orbitals, so 2 × 4 = 8 electrons.",
  },
]);

const seen2p = new Set();

document.addEventListener("orbitalshown", ({ detail: { key, l, phase, slice, view } }) => {
  if (key === "2s" && slice) lab.complete("hidden", "2s: a small ball inside a shell, with an empty sphere at r = 2 a₀.");
  if (l === 1) lab.complete("plane", `${key}: the plane between its two lobes is a node.`);
  if (key === "2pz" && view === "z") lab.complete("down-z", "Seen end-on, the dumbbell looks like a round blob: the two lobes sit one behind the other.");
  if (l === 2 && phase) lab.complete("phase-d", `${key}: neighbouring lobes have opposite signs, and the colour flips across each node.`);
  if (key.startsWith("2p")) {
    seen2p.add(key);
    if (seen2p.size === 3) lab.complete("all-2p", "2px, 2py and 2pz: same shape and energy, pointing along x, y and z.");
  }
});
