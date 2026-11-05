# Quantum Visual

**Learn quantum physics from the atom up — with interactive 3D visuals, charts, and Python labs.**

Quantum Visual is an open curriculum for students in grades 11–12 (US AP Physics/Chemistry, Indian CBSE/ICSE Class 11–12 and JEE, Chinese senior high physics). It starts from "what is an atom?" and builds up to electron spin, orbitals, the nucleus, and a first look at qubits. Every idea is connected back to the Newtonian physics students already know.

## How each lesson works

Every lesson has the same six parts:

| Part | What it is |
| --- | --- |
| 1. Concept | One idea, under 600 words, at most one key formula |
| 2. 3D visual | An interactive scene to rotate, zoom and adjust with sliders |
| 3. Graph or chart | The same idea as numbers: energy diagrams, spectra, probability curves |
| 4. Check questions | 3 conceptual + 3 numerical, with worked answers |
| 5. Python lab | A notebook where students compute or plot the idea themselves |
| 6. Newton vs quantum | What classical physics predicts, what actually happens, and when Newton is still good enough |

Difficulty tags: **[Core]** all students · **[Extension]** JEE / AP 5 level · **[Challenge]** olympiad or early university.

## Course map

| Module | Topic | Lessons |
| --- | --- | --- |
| [0](curriculum/00-toolkit.md) | Toolkit: powers of ten, energy units, waves, Newton review | 4 |
| [1](curriculum/01-atom.md) | What is an atom? Electron, proton, neutron, nucleus | 6 |
| [2](curriculum/02-light-and-photon.md) | Light and the photon: E = hf, photoelectric effect | 5 |
| [3](curriculum/03-energy-levels.md) | Energy levels and the Bohr atom; how fast is the electron? | 6 |
| [4](curriculum/04-wave-particle.md) | Waves and particles together: de Broglie, double slit, uncertainty | 5 |
| [5](curriculum/05-orbitals-and-spin.md) | Orbitals, quantum numbers, spin +½ and −½, Pauli | 7 |
| [6](curriculum/06-nucleus.md) | Inside the nucleus: strong force, decay, half-life, E = mc² | 5 |
| [7](curriculum/07-modern-quantum.md) | Bridge to modern quantum: Schrödinger, tunnelling, qubits | 6 |
| — | [The Newtonian thread](curriculum/newtonian-thread.md): how classical and quantum physics connect | — |

## Try it now

**3D visual:** open [`visuals/05-orbitals/index.html`](visuals/05-orbitals/index.html) in any browser to explore hydrogen orbitals (1s, 2s, 2p, 3d) as rotatable probability clouds.

**Python lab:**

```bash
git clone https://github.com/<owner>/quantum-visual.git
cd quantum-visual
pip install -r requirements.txt
jupyter lab labs/03-bohr/balmer_lines.ipynb
```

No install? Upload any notebook in `labs/` to [Google Colab](https://colab.research.google.com/).

## Repository layout

```
quantum-visual/
├── curriculum/      # lesson text, one Markdown file per module
├── visuals/         # interactive 3D scenes (Three.js, run in any browser)
│   ├── shared/      # shared styles and constants for scenes
│   └── 05-orbitals/
├── labs/            # Jupyter notebooks, one folder per module
│   └── constants.py # physical constants every lab imports
├── questions/       # question bank in YAML (loadable by a quiz page)
├── solutions/       # lab solutions (kept separate from labs)
├── data/            # CSVs: spectral lines, ionisation energies, isotopes
└── mkdocs.yml       # build the site with `mkdocs serve`
```

## Build the website

```bash
pip install mkdocs-material
mkdocs serve      # preview at http://127.0.0.1:8000
```

## Roadmap

- [x] Curriculum outline for all 8 modules
- [x] Shared constants and the first lab (Balmer lines)
- [x] First 3D visual (hydrogen orbitals)
- [ ] Module 1 and Module 3 visuals and labs (the core)
- [ ] Module 5 full set (orbitals and spin), then Modules 2 and 4
- [ ] Modules 0, 6, 7; question bank page; auto-graded labs with `pytest`

## Contributing

Each new lesson should include all six parts. Put lesson text in `curriculum/`, the scene in `visuals/<module>/`, the notebook in `labs/<module>/`, and questions in `questions/<module>.yaml`. Import physical constants from `labs/constants.py` rather than redefining them.
