# Quantum Visual

**Learn quantum physics by running it.** An open course for grades 11 and 12 that starts with the atom and works up to electron spin and the qubit. Every lesson has a live simulation, experiments that check what you find, instant-feedback questions, a comparison with Newtonian physics, and a Python lab that opens in Google Colab.

**Website:** https://ujjawal40.github.io/quantum-visual/

Written for AP Physics and Chemistry, CBSE and ICSE Class 11–12, JEE, and Chinese senior high physics. Nothing to install and no accounts; progress is saved in each student's own browser.

## Interactive lessons

| Lesson | What you do | Python lab |
| --- | --- | --- |
| [1.4 Build an atom](https://ujjawal40.github.io/quantum-visual/lessons/build-an-atom/) | Add protons, neutrons and electrons; watch the element, isotope and charge change | [build_an_atom.ipynb](labs/01-atom/build_an_atom.ipynb) |
| [2.4 The photoelectric effect](https://ujjawal40.github.io/quantum-visual/lessons/photoelectric/) | Find why colour matters and brightness doesn't, then measure Planck's constant | [photoelectric_fit.ipynb](labs/02-light/photoelectric_fit.ipynb) |
| [3.4 Jumps and photons](https://ujjawal40.github.io/quantum-visual/lessons/bohr-spectra/) | Excite hydrogen, build its spectrum photon by photon, ionise it with a photon gun | [balmer_lines.ipynb](labs/03-bohr/balmer_lines.ipynb) |
| [4.3 The double-slit experiment](https://ujjawal40.github.io/quantum-visual/lessons/double-slit/) | Fire electrons one at a time; watch fringes form, then vanish when you look | [double_slit.ipynb](labs/04-wave-particle/double_slit.ipynb) |
| [5.2 Orbital shapes in 3D](https://ujjawal40.github.io/quantum-visual/lessons/orbitals/) | Rotate s, p and d orbitals and slice them open to find their nodes | [orbital_cloud.ipynb](labs/05-orbitals/orbital_cloud.ipynb) |
| [5.4 Spin: up or down](https://ujjawal40.github.io/quantum-visual/lessons/stern-gerlach/) | Send silver atoms through Stern–Gerlach magnets; get two spots, never a smear | [spin_measurements.ipynb](labs/05-orbitals/spin_measurements.ipynb) |
| [6.4 Half-life](https://ujjawal40.github.io/quantum-visual/lessons/half-life/) | Watch thousands of nuclei decay at random; carbon-date a bone | [half_life.ipynb](labs/06-nucleus/half_life.ipynb) |

The full course has 8 modules and 44 lessons; outlines for all of them are in [`curriculum/`](curriculum/), and [the Newtonian thread](curriculum/newtonian-thread.md) shows how each quantum idea connects to classical physics.

## How each lesson works

| Part | What it is |
| --- | --- |
| Concept | One idea in plain language, with at most one key formula |
| Simulation | A live model beside the text: sliders, buttons, readouts |
| Experiments | Tasks that tick themselves when you find something, or check a value you measured |
| Questions | Multiple choice with an explanation for every answer |
| Newton vs quantum | What classical physics predicts, what actually happens, and where they agree |
| Python lab | A Jupyter notebook that opens in Google Colab |

## Run it locally

```bash
git clone https://github.com/ujjawal40/quantum-visual.git
cd quantum-visual
npm run serve                      # website at http://localhost:8000
pip install -r requirements.txt    # for the Python labs
jupyter lab labs/
```

## Repository layout

```
site/          the website: plain HTML, CSS and JavaScript modules, no build step
  assets/      shared styles, physics code, experiments, quiz and page chrome
  lessons/     one folder per interactive lesson (page, simulation, experiments)
labs/          Python notebooks, one folder per module; constants.py is shared
curriculum/    outlines for all 8 modules, plus the Newtonian thread
questions/     question banks in YAML
data/          measured data used by labs (spectral lines)
tests/         physics and course-map unit tests, and a browser smoke test
```

## Checks

Every push runs the physics unit tests, loads every page in a real browser (light, dark and phone sizes in local review), and executes every notebook from top to bottom. The site deploys to GitHub Pages from `main`.

```bash
npm ci && npx playwright install chromium
npm test
node tests/smoke.mjs
```

## Contributing

New lessons, corrections and translations are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) explains how a lesson is put together and how to add one.
