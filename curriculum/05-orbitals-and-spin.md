# Module 5 — The quantum atom: orbitals and spin (7 lessons)

An electron in an atom is described by four quantum numbers (n, l, mₗ, mₛ). The last one, spin, can only be +½ or −½, and the rule that no two electrons share all four builds the periodic table.

| Quantum number | Name | Allowed values | What it sets |
| --- | --- | --- | --- |
| n | Principal | 1, 2, 3, … | Energy and size of the orbital |
| l | Angular momentum | 0 to n − 1 (s, p, d, f) | Shape |
| mₗ | Magnetic | −l to +l | Orientation in space |
| mₛ | Spin | +½ or −½ | Spin direction ("up" or "down") |

| Lesson | Concept | 3D visual | Chart | Python lab |
| --- | --- | --- | --- | --- |
| 5.1 From orbits to orbitals | An orbital is a probability cloud, not a path | **[`visuals/05-orbitals`](../visuals/05-orbitals/index.html)**: 1s point cloud | Radial probability for 1s, peak at a₀ | **[`labs/05-orbitals/orbital_cloud.ipynb`](../labs/05-orbitals/orbital_cloud.ipynb)** |
| 5.2 Shapes: s, p, d, f | l sets the shape | Gallery of rotatable orbitals with nodes highlighted | Radial curves for 1s, 2s, 3s | Plot an isosurface of a 2p orbital |
| 5.3 Four quantum numbers | n, l, mₗ, mₛ as an "address" | Address picker: choose n, l, mₗ and the orbital appears | Orbitals per shell (n²) | Enumerate every allowed set for n ≤ 4 |
| 5.4 Spin: +½ and −½ | Intrinsic angular momentum; only two outcomes when measured | Stern–Gerlach: a beam splits into exactly two spots | Classical smear vs actual two spots | Simulate random spin measurements |
| 5.5 Pauli exclusion | No two electrons share all four numbers | Box-and-arrow diagrams that fill as electrons are added | Electrons per shell: 2, 8, 18, 32 | Fill orbitals for any Z |
| 5.6 Aufbau and Hund | Fill order 1s 2s 2p 3s 3p 4s 3d … | Periodic table lighting up block by block | Subshell energy ordering | Configurations for Z = 1–36; check Cr, Cu |
| 5.7 Why chemistry works | Valence electrons, bonding, periodic trends | Two H atoms approach; orbitals overlap into a bond | Atomic radius vs Z | Plot radius and electronegativity trends |

## Sample questions

- [Core] Write the four quantum numbers for each electron in a helium atom.
- [Core] How many electrons can the n = 3 shell hold? Show why using quantum numbers.
- [Core] Why did the Stern–Gerlach beam split into two spots instead of a smear?
- [Extension] Write the electron configuration of iron (Z = 26) and draw its 3d box diagram.
- [Extension] Python: write `electron_config(Z)` that returns a string like `1s2 2s2 2p6`.
- [Challenge] Python: plot the radial probability of the 2s orbital and find the node.

## Newton vs quantum

A classical spinning top can have any angular momentum, so a classical Stern–Gerlach beam would smear into a continuous band. Quantum angular momentum comes in units of ħ, and spin gives exactly two spots. Large angular momenta (many units of ħ) look continuous again.
