// The course map: every module and lesson, in teaching order.
// A lesson with a `slug` has an interactive page at lessons/<slug>/.
// Lessons without one are planned; the course page links to their outline.

export const REPO = "https://github.com/ujjawal40/quantum-visual";

export const MODULES = [
  {
    n: 0, title: "Toolkit", outline: "curriculum/00-toolkit.md",
    blurb: "Powers of ten, the electron-volt, waves, and the Newton you already know.",
    lessons: [
      { id: "0.1", title: "Powers of ten" },
      { id: "0.2", title: "Units of energy" },
      { id: "0.3", title: "Waves" },
      { id: "0.4", title: "Newton's toolkit" },
    ],
  },
  {
    n: 1, title: "What is an atom?", outline: "curriculum/01-atom.md",
    blurb: "Protons, neutrons and electrons, and how we found them.",
    lessons: [
      { id: "1.1", title: "From Democritus to Dalton" },
      { id: "1.2", title: "The electron" },
      { id: "1.3", title: "The nucleus" },
      { id: "1.4", title: "Build an atom", slug: "build-an-atom",
        summary: "Drag protons, neutrons and electrons together and watch the element, charge and mass change." },
      { id: "1.5", title: "How big, how empty?" },
      { id: "1.6", title: "Forces inside the atom" },
    ],
  },
  {
    n: 2, title: "Light and the photon", outline: "curriculum/02-light-and-photon.md",
    blurb: "Light arrives in packets, and each packet's energy is set by its colour.",
    lessons: [
      { id: "2.1", title: "Light as a wave" },
      { id: "2.2", title: "The spectrum" },
      { id: "2.3", title: "Blackbody and Planck" },
      { id: "2.4", title: "The photoelectric effect", slug: "photoelectric",
        summary: "Shine light on metal. Find out why colour matters and brightness doesn't, then measure Planck's constant." },
      { id: "2.5", title: "What is a photon?" },
    ],
  },
  {
    n: 3, title: "Energy levels", outline: "curriculum/03-energy-levels.md",
    blurb: "Electrons live on rungs of a ladder, and every jump makes a photon.",
    lessons: [
      { id: "3.1", title: "Line spectra" },
      { id: "3.2", title: "Bohr's postulates" },
      { id: "3.3", title: "Energy levels" },
      { id: "3.4", title: "Jumps and photons", slug: "bohr-spectra",
        summary: "Excite a hydrogen atom, watch the electron fall, and build hydrogen's spectrum one photon at a time." },
      { id: "3.5", title: "How fast is the electron?" },
      { id: "3.6", title: "Ionisation" },
    ],
  },
  {
    n: 4, title: "Waves and particles", outline: "curriculum/04-wave-particle.md",
    blurb: "Electrons interfere like waves, yet arrive one dot at a time.",
    lessons: [
      { id: "4.1", title: "De Broglie wavelength" },
      { id: "4.2", title: "Why orbits are quantised" },
      { id: "4.3", title: "The double-slit experiment", slug: "double-slit",
        summary: "Fire electrons one at a time through two slits. Then look at which slit they use, and watch the pattern vanish." },
      { id: "4.4", title: "Electron microscopes" },
      { id: "4.5", title: "The uncertainty principle" },
    ],
  },
  {
    n: 5, title: "Orbitals and spin", outline: "curriculum/05-orbitals-and-spin.md",
    blurb: "Probability clouds, four quantum numbers, and spin up or down.",
    lessons: [
      { id: "5.1", title: "From orbits to orbitals" },
      { id: "5.2", title: "Orbital shapes in 3D", slug: "orbitals",
        summary: "Rotate hydrogen's s, p and d orbitals and find their nodes, where the electron is never found." },
      { id: "5.3", title: "Four quantum numbers" },
      { id: "5.4", title: "Spin: up or down", slug: "stern-gerlach",
        summary: "Send silver atoms through a magnet and get two spots, never a smear. Then chain magnets and get surprised." },
      { id: "5.5", title: "Pauli exclusion" },
      { id: "5.6", title: "Aufbau and Hund" },
      { id: "5.7", title: "Why chemistry works" },
    ],
  },
  {
    n: 6, title: "Inside the nucleus", outline: "curriculum/06-nucleus.md",
    blurb: "The strong force, radioactive decay, and E = mc².",
    lessons: [
      { id: "6.1", title: "The strong force" },
      { id: "6.2", title: "Stability and isotopes" },
      { id: "6.3", title: "Radioactive decay" },
      { id: "6.4", title: "Half-life", slug: "half-life",
        summary: "Watch a thousand nuclei decay at random, then predict when half of them will be gone." },
      { id: "6.5", title: "Mass defect and energy" },
    ],
  },
  {
    n: 7, title: "Modern quantum", outline: "curriculum/07-modern-quantum.md",
    blurb: "Wavefunctions, tunnelling, superposition and the qubit.",
    lessons: [
      { id: "7.1", title: "The wavefunction" },
      { id: "7.2", title: "Particle in a box" },
      { id: "7.3", title: "Quantum tunnelling" },
      { id: "7.4", title: "Superposition and measurement" },
      { id: "7.5", title: "Entanglement" },
      { id: "7.6", title: "Qubits" },
    ],
  },
];

/** Interactive lessons in teaching order, each with its module attached. */
export const INTERACTIVE = MODULES.flatMap((m) =>
  m.lessons.filter((l) => l.slug).map((l) => ({ ...l, module: m }))
);

export const findLesson = (slug) => INTERACTIVE.find((l) => l.slug === slug);
