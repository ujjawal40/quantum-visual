# Contributing to Quantum Visual

Corrections, new questions and whole new lessons are welcome. This guide shows how the site is put together and how to add an interactive lesson.

## Run the site locally

The site is plain HTML, CSS and JavaScript modules. There is no build step.

```bash
npm run serve          # http://localhost:8000
```

Any static server works; modules need to be served over http, not opened as files.

## Run the checks

```bash
npm ci
npx playwright install chromium   # once
npm test                          # physics and course-map unit tests
node tests/smoke.mjs              # loads every page in a real browser
node tests/smoke.mjs --only bohr-spectra --shots shots/   # screenshots for review
```

The same checks, plus running every Python notebook, run on GitHub for each push.

## How a lesson is built

Every interactive lesson lives in `site/lessons/<slug>/` and has three files:

| File | What it does |
| --- | --- |
| `index.html` | The lesson text, the bench markup (canvas, controls, readouts), the quiz questions as JSON, the Newton vs quantum box and the Python lab card |
| `sim.js` | The simulation. It draws on the canvas and announces what happens with `document` events, for example `emitted` or `absorbed` |
| `experiments.js` | The experiments checklist. It listens for the simulation's events and ticks tasks off |

Keeping the simulation and the experiments apart means the simulation never needs to know what students are being asked to do.

### Shared pieces

| Module | Use it for |
| --- | --- |
| `assets/js/ui/lesson.js` | Import first. Adds the header, footer, quiz and Colab links, and re-exports `createTasks` |
| `assets/js/ui/tasks.js` | `createTasks(host, slug, tasks)`; tasks are `observe` (call `lab.complete(id, note)`) or `measure` (student types a value checked against `answer ± tolerance`) |
| `assets/js/ui/simkit.js` | `fitCanvas` for sharp canvases, `animate` for a loop that pauses off-screen, `bindRange` for sliders, `sci` for 2.19 × 10⁶ style numbers |
| `assets/js/physics/*.js` | Constants, wavelength → colour, Bohr-model helpers. Add physics here, with tests in `tests/`, rather than inside a lesson |

### Steps to add a lesson

1. Add a `slug` and a one-sentence `summary` to the lesson in `site/assets/js/course.js`. The course map, navigation and tests pick it up from there.
2. Copy `site/lessons/bohr-spectra/` to `site/lessons/<slug>/` and replace the content.
3. Keep the six parts in order: concept, simulation, experiments, quiz, Newton vs quantum, Python lab.
4. Put the notebook in `labs/<module>/` and link it with `<a data-colab="labs/...">`.
5. Run `npm test` and `node tests/smoke.mjs --only <slug> --shots shots/`, and look at the screenshots in light, dark and phone sizes.

## Writing style

- Write for a 16-year-old meeting the idea for the first time. One idea per section, short sentences, plain words.
- Give numbers with units, and check them. The simulations must be physically correct; say so in a caption when a drawing is not to scale.
- Every quiz answer gets a one- or two-sentence explanation, including for wrong choices where it helps.
- The stage background stays dark in both themes, because the colours of light only read correctly on black.

## Python labs

Notebooks import shared values with:

```python
import sys; sys.path.append("..")
from constants import *
```

Every code cell must run top to bottom without errors; the checks on GitHub run each notebook.
