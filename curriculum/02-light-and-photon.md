# Module 2 — Light and the photon (5 lessons)

Light comes in packets called photons, each carrying energy E = hf. This one idea explains the photoelectric effect and atomic spectra.

$$E = hf = \frac{hc}{\lambda}, \qquad hc \approx 1240\ \text{eV·nm}$$

| Lesson | Concept | 3D visual | Chart | Python lab |
| --- | --- | --- | --- | --- |
| 2.1 Light as a wave | EM wave: E and B fields at right angles | 3D animated EM wave, rotatable | — | Animate E and B with Matplotlib |
| 2.2 The spectrum | Radio to gamma; visible is 380–750 nm | Clickable spectrum bar showing λ, f, E and a real-world use | Photon energy (eV) vs wavelength, log axes | Convert any λ to colour (RGB) and energy |
| 2.3 Blackbody and Planck | Classical theory predicts infinite UV energy; Planck's fix | Glowing object whose colour shifts with temperature | Planck curves at 3000 K, 5800 K, 10000 K | Plot Planck's law; find the peak (Wien's law) |
| 2.4 Photoelectric effect | Electrons ejected only above a threshold frequency; KE = hf − φ | Light hits a metal plate; sliders for colour and brightness | KE vs frequency lines for 3 metals | Fit the line to data and recover h |
| 2.5 What is a photon? | Massless, travels at c, carries momentum p = h/λ | Single photons arriving as dots on a screen | — | Photons per second from a 1 mW laser |

## Sample questions

- [Core] Find the energy in eV of a 500 nm green photon.
- [Core] Why does bright red light not eject electrons when dim blue light does?
- [Extension] Python: given stopping-voltage data for 5 frequencies, use `numpy.polyfit` to find h and the work function.
- [Challenge] How many photons per second does the Sun deliver to 1 m² of Earth (≈ 1000 W)? Assume λ = 550 nm.

## Newton vs quantum

Classical wave theory says energy depends on brightness and that a hot object radiates infinite ultraviolet energy (Rayleigh–Jeans). Lab: plot Rayleigh–Jeans beside Planck and watch the classical curve blow up. Huge numbers of photons together behave like the classical wave.
