// Experiments for the energy-level 3D lab. The simulation reports the atom's
// state with "atomstate" events and each emitted photon with "photonemitted".

import { createTasks } from "../../assets/js/ui/lesson.js";

const lab = createTasks(document.querySelector("[data-tasks]"), "transition", [
  {
    id: "drive",
    title: "Use light to lift the atom to 2p",
    detail: "On 1s ↔ 2p, switch the light on with no detuning and get the upper level above 95%.",
  },
  {
    id: "slosh",
    title: "Watch the cloud slosh",
    detail: "Keep the atom between 30% and 70% upper for three seconds on an allowed jump. Follow the yellow arrow.",
  },
  {
    id: "forbidden",
    title: "Try a jump light can't drive",
    detail: "Pick 1s ↔ 2s, switch the light on strong, and wait. Why does nothing happen?",
  },
  {
    id: "detune",
    title: "Detune the light until the atom only gets halfway",
    detail: "With the light on 1s ↔ 2p, set the detuning Δ at least as big as Ω and watch a full cycle.",
  },
  {
    id: "emit",
    title: "Catch the atom giving out a photon",
    detail: "Put the atom in the upper level of an allowed jump and wait. Look at the shape of the shell.",
  },
  {
    id: "red",
    title: "Make hydrogen's red light",
    detail: "Catch a photon from the 2p ↔ 3d jump.",
  },
  {
    id: "freq",
    kind: "measure",
    title: "How many times a second does the real 1s ↔ 2p cloud slosh?",
    detail: "Use the photon energy readout and f = ΔE / h, with h = 4.136 × 10⁻¹⁵ eV·s.",
    answer: 2.47,
    tolerance: 0.04,
    unit: "× 10¹⁵ Hz",
    explain: "2.47 × 10¹⁵ Hz: f = 10.20 eV ÷ 4.136 × 10⁻¹⁵ eV·s. The light it gives out has exactly this frequency.",
  },
]);

document.addEventListener("atomstate", ({ detail: d }) => {
  if (d.key === "1s-2p" && d.light && Math.abs(d.Delta) < 0.05 && d.p2 > 0.95) {
    lab.complete("drive", "Up to 2p. Keep watching: the same light drives it back down again (stimulated emission).");
  }
  if (d.allowed && d.halfTime >= 3) {
    lab.complete("slosh", "The cross term swings the cloud above and below the nucleus at ω = ΔE/ħ, like a tiny antenna.");
  }
  if (d.key === "1s-2s" && d.light && d.strength >= 0.5 && d.runTime >= 6 && d.maxP2 < 0.01) {
    lab.complete("forbidden", "⟨1s|z|2s⟩ = 0: both clouds are spherical, so the light can't push the cloud to one side. Δl must be ±1.");
  }
  if (d.key === "1s-2p" && d.light && d.Omega > 0 && Math.abs(d.Delta) >= d.Omega) {
    const period = (2 * Math.PI) / Math.hypot(d.Omega, d.Delta);
    if (d.runTime >= period && d.maxP2 < 0.62) {
      lab.complete("detune", `It peaked at ${(d.maxP2 * 100).toFixed(0)}%. Off resonance the most you can reach is Ω²/(Ω² + Δ²).`);
    }
  }
});

document.addEventListener("photonemitted", ({ detail: d }) => {
  lab.complete("emit", "One photon, at a random moment. The shell is dark along z: a dipole sends no light along its own axis.");
  if (d.key === "2p-3d") lab.complete("red", `${d.nm.toFixed(0)} nm: Balmer-α, the red that colours glowing hydrogen.`);
});
