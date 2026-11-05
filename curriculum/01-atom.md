# Module 1 — What is an atom? (6 lessons)

Matter is built from atoms, and atoms from three particles: protons and neutrons in a tiny nucleus, electrons around it.

| Lesson | Concept | 3D visual | Chart | Python lab |
| --- | --- | --- | --- | --- |
| 1.1 From Democritus to Dalton | Matter is made of indivisible units; elements and compounds | Rotatable molecules (H₂O, CO₂, NaCl lattice) | Timeline of atomic models, 400 BCE–1932 | — |
| 1.2 The electron | Thomson's cathode-ray tube, charge-to-mass ratio | Animated cathode-ray tube; beam bends as E and B fields change | Deflection vs field strength | Simulate the beam path given E, B, v |
| 1.3 The nucleus | Rutherford gold foil: most α-particles pass, a few bounce back | Particle-by-particle scattering around a gold nucleus | Histogram of scattering angles | Monte Carlo scattering: count deflections > 90° |
| 1.4 Proton and neutron | Charge, mass, Z and A, isotopes | Build-an-atom: drag particles in; element name updates live | Table of p, n, e properties | Return element, charge and mass from (p, n, e) |
| 1.5 How big, how empty? | Nucleus ≈ 10⁻¹⁵ m, atom ≈ 10⁻¹⁰ m | Marble nucleus at the centre of a football stadium | Log-scale size ladder | Volume fraction occupied by the nucleus |
| 1.6 Forces inside the atom | Coulomb attraction holds electrons; why doesn't the nucleus fly apart? | Force arrows between charges, live magnitudes | Coulomb force vs distance | Plot F = kq₁q₂/r² |

## Key particle data

| Particle | Charge | Mass (kg) | Mass (relative to electron) |
| --- | --- | --- | --- |
| Proton | +e | 1.673 × 10⁻²⁷ | 1836 |
| Neutron | 0 | 1.675 × 10⁻²⁷ | 1839 |
| Electron | −e | 9.109 × 10⁻³¹ | 1 |

## Sample questions

- [Core] Carbon-14 has 6 protons. How many neutrons and electrons does a neutral atom have?
- [Core] Why did most α-particles pass straight through the gold foil?
- [Extension] Python: simulate 10,000 α-particles and estimate what fraction scatter beyond 90°.

## Newton vs quantum

Newton plus Coulomb's law predicts a "mini solar system". But an orbiting charge radiates, so a classical electron would spiral into the nucleus in about 10⁻¹¹ s. Lab: simulate that collapse.

## What this model gets wrong

Atoms are stable, so something is missing from the classical picture. Module 3 adds it.
