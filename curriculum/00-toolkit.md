# Module 0 — Toolkit (4 lessons)

This short module makes sure every student can handle very large and very small numbers, and recalls the Newtonian ideas the rest of the course builds on.

| Lesson | Concept | Visual | Python lab |
| --- | --- | --- | --- |
| 0.1 Powers of ten | Scientific notation, SI prefixes (nano, pico, femto) | "Zoom" slider from a human (1 m) down to a nucleus (10⁻¹⁵ m), log scale | Convert and print sizes in scientific notation |
| 0.2 Units of energy | Joule vs electron-volt (1 eV = 1.602 × 10⁻¹⁹ J) | Bar chart comparing energies: a thrown ball, a chemical bond, a visible photon, a nuclear decay | Write `joules_to_ev()` and `ev_to_joules()` |
| 0.3 Waves | Wavelength, frequency, speed, v = fλ | Animated sine wave with sliders for λ and f | Plot two waves and their sum with NumPy + Matplotlib |
| 0.4 Newton's toolkit | F = ma, p = mv, KE = ½mv², circular motion F = mv²/r, Newton's gravity beside Coulomb's law | Planet orbiting a star next to an electron orbiting a nucleus; same equations, different constants | Compute orbital speed from force balance for the Moon and for a classical electron |

## Python setup

Install Python, Jupyter, NumPy, Matplotlib and Plotly (`pip install -r requirements.txt`). Every lab imports `labs/constants.py`, so h, c, e, mₑ, mₚ, k and a₀ have one definition across the course.

## Sample questions

- [Core] How many times larger is an atom (10⁻¹⁰ m) than a nucleus (10⁻¹⁵ m)?
- [Core] A wave has f = 5 × 10¹⁴ Hz and travels at 3 × 10⁸ m/s. Find λ in nm.
- [Core] Compare Newton's law of gravity and Coulomb's law. What plays the role of mass in each?
- [Extension] Python: make a log-scale chart of 10 objects from a proton to the Earth.
