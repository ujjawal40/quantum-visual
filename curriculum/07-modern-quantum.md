# Module 7 — Bridge to modern quantum physics (6 lessons, [Extension]/[Challenge])

The wavefunction ψ and Schrödinger's equation replace orbits entirely. From there students meet tunnelling, superposition and the qubit. Light calculus (derivatives) appears here.

$$-\frac{\hbar^2}{2m}\frac{d^2\psi}{dx^2} + V(x)\,\psi = E\,\psi$$

| Lesson | Concept | 3D visual | Chart | Python lab |
| --- | --- | --- | --- | --- |
| 7.1 The wavefunction | ψ holds all we can know; \|ψ\|² is probability density | Probability surface over a 2D plane | ψ and \|ψ\|² side by side | Normalise a given ψ numerically |
| 7.2 Particle in a box | Eₙ ∝ n²; zero-point energy | Standing waves in a 1D box and a 3D cube | Levels and wavefunctions n = 1–4 | Finite-difference solver vs exact answer |
| 7.3 Quantum tunnelling | Particles leak through classically forbidden barriers | Wave packet hitting a barrier | Transmission vs barrier width | Split-step time evolution |
| 7.4 Superposition and measurement | A mix of states until measured | Bloch sphere | Outcome probabilities | Repeated measurements of a superposed spin |
| 7.5 Entanglement | Two particles share one state | Two linked Bloch spheres | Correlation vs detector angle | Simulate correlated spin pairs |
| 7.6 Qubits and quantum computers | Spin ½ as a qubit; gates rotate the Bloch arrow | Bloch sphere driven by X, H, Z buttons | Histogram of results | First Qiskit circuit: Hadamard + measure |

## Sample questions

- [Extension] An electron is in a 1 nm box. Find its ground-state energy in eV.
- [Extension] Why can an electron tunnel through a barrier but a football cannot?
- [Challenge] Python: solve the 1D Schrödinger equation for a harmonic oscillator and plot the first 4 states.

## Newton vs quantum

Ehrenfest's theorem: the *average* position and momentum of a wave packet obey F = ma. Lab: send a ball and an electron at the same barrier, and show the packet's average tracking the Newtonian trajectory.
