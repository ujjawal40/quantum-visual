# Module 6 — Inside the nucleus (5 lessons)

The strong force holds protons and neutrons together against electric repulsion. A small loss of mass in nuclear reactions becomes a large energy through E = mc².

| Lesson | Concept | 3D visual | Chart | Python lab |
| --- | --- | --- | --- | --- |
| 6.1 The strong force | Short-range (~1 fm), stronger than Coulomb up close | Nucleons with force lines; pull them apart | Strong vs electric force against distance | Plot both forces on one axis |
| 6.2 Stability and isotopes | Neutron-to-proton ratio; the valley of stability | 3D chart of nuclides: Z vs N vs half-life | N vs Z band of stable nuclei | Plot stable isotopes from a CSV |
| 6.3 Radioactive decay | Alpha, beta, gamma | A nucleus emitting each particle type | Penetration: paper, aluminium, lead | Apply a decay to (Z, A) |
| 6.4 Half-life | Random for one nucleus, predictable for many | 1000 nuclei flipping colour as they decay | N vs t with half-lives marked | Monte Carlo vs N = N₀e^(−λt); carbon dating |
| 6.5 Mass defect and energy | Binding energy; fission and fusion | Uranium splitting; hydrogens fusing | Binding energy per nucleon vs A (peak at Fe-56) | Binding energy of He-4 from masses |

## Sample questions

- [Core] What happens to Z and A when a nucleus emits an alpha particle?
- [Core] A sample has a half-life of 5 days. What fraction remains after 20 days?
- [Extension] Find the energy released when 4 hydrogen nuclei fuse into helium-4.
- [Extension] Python: simulate the decay of 10,000 nuclei and fit the half-life from your data.

## Newton vs quantum

Classically, a nucleus is either stable or not, and an alpha particle without enough energy can never escape. Quantum tunnelling lets it leak out, which sets the half-life (previewed in Module 7).
