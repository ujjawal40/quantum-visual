# Module 3 — Energy levels and the Bohr atom (6 lessons)

Electrons can only have certain energies. Jumping between levels absorbs or emits a photon of exactly the energy difference. This module also answers "how fast does an electron move?": about 2.2 × 10⁶ m/s in hydrogen's ground state, roughly c/137.

$$E_n = -\frac{13.6\ \text{eV}}{n^2}, \qquad r_n = 0.0529\ \text{nm} \times n^2, \qquad v_n = \frac{2.19 \times 10^6\ \text{m/s}}{n}$$

| Lesson | Concept | 3D visual | Chart | Python lab |
| --- | --- | --- | --- | --- |
| 3.1 Line spectra | Each element emits only certain colours | Glowing gas tubes (H, He, Ne, Na) with their spectra | Emission lines for 4 elements | Draw a spectrum from a list of wavelengths |
| 3.2 Bohr's postulates | Fixed orbits; angular momentum L = nħ | Electron on orbits n = 1–6; radius grows as n² | Orbit radius vs n | Compute rₙ for n = 1–10 |
| 3.3 Energy levels | Eₙ = −13.6/n² eV; negative means bound | 3D energy ladder beside the orbits | Energy-level diagram | Draw the level diagram with Matplotlib |
| 3.4 Jumps and photons | ΔE = hf; Lyman (UV), Balmer (visible), Paschen (IR) | Electron jumps down; a coloured photon flies out | All allowed transitions with wavelengths | **[`labs/03-bohr/balmer_lines.ipynb`](../labs/03-bohr/balmer_lines.ipynb)** |
| 3.5 How fast is the electron? | vₙ = 2.19 × 10⁶ / n m/s; Z-dependence | Race: electron, rifle bullet, light | Speed vs n; speed vs Z | v/c for the 1s electron of H, Fe, Au, U |
| 3.6 Ionisation | 13.6 eV frees hydrogen's electron | Photon of rising energy until the electron escapes | Ionisation energy vs Z (1–20) | Plot ionisation energies; label noble-gas peaks |

## Sample questions

- [Core] Find the wavelength of the photon emitted when hydrogen's electron drops from n = 3 to n = 2. What colour is it?
- [Core] How much energy is needed to ionise hydrogen from n = 2?
- [Extension] How many times slower than light is the electron in hydrogen's ground state?
- [Extension] Python: list all transitions between n = 1–6 that produce visible light.
- [Challenge] Why does gold look yellow while silver looks white? (Hint: relativistic speed of inner electrons.)

## Newton vs quantum

Bohr's model is Newton's force balance mv²/r = ke²/r² plus one quantum rule, L = nħ. Newton gives the electron's speed correctly here. As n grows, the gaps between levels shrink and energy looks continuous: the correspondence principle.

## What this model gets wrong

Bohr works only for one-electron atoms and treats the electron as a ball on a track. The real electron has no definite path.
