# Module 4 — Waves and particles together (5 lessons)

Electrons, like photons, behave as waves with wavelength λ = h/p. That wave nature is why electrons sit in fixed energy levels, and why position and momentum cannot both be known exactly.

$$\lambda = \frac{h}{p} = \frac{h}{mv}, \qquad \Delta x\,\Delta p \geq \frac{\hbar}{2}$$

| Lesson | Concept | 3D visual | Chart | Python lab |
| --- | --- | --- | --- | --- |
| 4.1 De Broglie wavelength | Every moving object has a wavelength | λ of a cricket ball, dust grain and electron, to scale | λ vs speed for 3 masses, log axes | Write `de_broglie(m, v)` |
| 4.2 Why orbits are quantised | Whole wavelengths fit the orbit: 2πr = nλ | Standing wave on a ring; non-fitting waves cancel | — | Animate n = 1–5 standing waves on a circle |
| 4.3 Double-slit experiment | One electron at a time still builds fringes | Dots build into fringes; toggle a detector to watch them vanish | Intensity vs position | Simulate hits weighted by the interference pattern |
| 4.4 Electron microscopes | Short λ gives fine detail | Diffraction rings from a crystal | Resolution vs accelerating voltage | λ of an electron accelerated through V volts |
| 4.5 Uncertainty principle | Squeeze position and momentum spreads | Wave packet narrowing in x, widening in p | Δx vs Δp trade-off | Gaussian packet and its Fourier transform |

## Sample questions

- [Core] Find the de Broglie wavelength of an electron moving at 2.2 × 10⁶ m/s. Compare it with the size of the hydrogen atom.
- [Core] Why don't we see diffraction when a person walks through a door?
- [Extension] An electron is confined to 0.1 nm. Estimate its minimum speed.
- [Challenge] Python: show that a narrower Gaussian in x gives a wider Gaussian in p, and that their widths multiply to a constant.

## Newton vs quantum

Newton assumes exact position and velocity at every moment. For a cricket ball, ħ is so tiny that the uncertainty is unmeasurable and its de Broglie wavelength is about 10⁻³⁴ m. Lab: put an electron, a dust grain and a car on one log chart, with a line marking "wave effects visible".
