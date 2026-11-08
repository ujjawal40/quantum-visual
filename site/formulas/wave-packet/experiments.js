// Experiments for the Schrödinger 3D lab. The simulation reports what is
// happening with a "wavestate" event; this file turns that into finished tasks.

import { createTasks } from "../../assets/js/ui/lesson.js";

const lab = createTasks(document.querySelector("[data-tasks]"), "wave-packet", [
  {
    id: "spread",
    title: "Watch a free packet spread",
    detail: "In free space, let a packet run until its width has at least doubled. Nothing is pushing it.",
  },
  {
    id: "tunnel",
    title: "Tunnel through a wall you can't climb",
    detail: "Pick the barrier. Keep ⟨E⟩ below V₀ and get at least 3% of the packet past the wall.",
  },
  {
    id: "thick",
    title: "Make the wall thick enough to stop it",
    detail: "Still with ⟨E⟩ below V₀, raise the thickness until less than 1% gets through.",
  },
  {
    id: "slits",
    title: "Send one particle through two slits",
    detail: "Pick the double slit and wait for the fringes behind the wall.",
  },
  {
    id: "swing",
    title: "Let a packet swing once in the well",
    detail: "In the harmonic well, wait one full period, 2π/ω. Where does the packet end up?",
  },
  {
    id: "collapse",
    title: "Collapse the wavefunction",
    detail: "Press Measure position while the packet is spread out, then watch what happens next.",
  },
  {
    id: "speed",
    kind: "measure",
    title: "How fast does a packet with k = 3 move?",
    detail: "Set k = 3 in free space. Use ⟨x⟩ and the time readout at two moments: speed = Δx / Δt.",
    answer: 3,
    tolerance: 0.3,
    unit: "length per unit time",
    explain: "3. The group velocity is ħk/m, and with ħ = m = 1 that is just k.",
  },
]);

const run = { thickChecked: false };

document.addEventListener("wavestate", ({ detail: d }) => {
  if (d.measured) {
    lab.complete("collapse", "One point was picked with probability |ψ|², and the spike that replaced the wave spreads fast: Δx small means Δp large.");
    return;
  }
  if (d.potential === "free") {
    const grown = Math.sqrt(1 + (d.t / (2 * d.sigma * d.sigma)) ** 2);
    if (grown >= 2) lab.complete("spread", `Width now ${grown.toFixed(1)} × σ₀. The narrower you start, the faster it spreads.`);
  }
  if (d.potential === "barrier" && d.energy < d.V0) {
    if (d.beyond >= 0.03) {
      lab.complete("tunnel", `${(d.beyond * 100).toFixed(1)}% got through a wall of height ${d.V0} with only ⟨E⟩ = ${d.energy.toFixed(2)}.`);
    }
    // Judge "stopped" once the packet has had time to reach and leave the wall.
    if (d.t > 9 / Math.max(d.k, 0.5) + 4 && d.beyond < 0.01 && d.thickness >= 1) {
      lab.complete("thick", `Only ${(d.beyond * 100).toFixed(2)}% through at thickness ${d.thickness}. Tunnelling falls off as e^(−2κa).`);
    }
  }
  if (d.potential === "slits" && d.beyond > 0.05 && d.t > 4) {
    lab.complete("slits", "The fringes come from one packet passing through both slits and meeting itself.");
  }
  if (d.potential === "well" && d.t >= (2 * Math.PI) / d.omega) {
    lab.complete("swing", "Back where it started after one period, just like a pendulum: ⟨x⟩ obeys Newton's laws (Ehrenfest's theorem).");
  }
});
