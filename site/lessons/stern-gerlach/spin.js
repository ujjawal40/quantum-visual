// Physics for lesson 5.4: Stern–Gerlach measurements of a spin-½ particle,
// and the classical "tiny spinning magnet" model it is compared with.
//
// Directions are unit vectors {x, y, z}. The beam travels along y; magnets
// measure along an axis in the x–z plane, given as an angle from +z toward +x
// (0° = Z magnet, 90° = X magnet).

export const toRad = (deg) => (deg * Math.PI) / 180;

/** Unit vector for a magnet tilted `deg` degrees from +z toward +x. */
export const axisVector = (deg) => ({ x: Math.sin(toRad(deg)), y: 0, z: Math.cos(toRad(deg)) });

const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const neg = (a) => ({ x: -a.x, y: -a.y, z: -a.z });

/** A direction picked uniformly at random over the sphere (an unpolarised atom from the oven). */
export function randomDirection(rng = Math.random) {
  const z = 2 * rng() - 1;
  const phi = 2 * Math.PI * rng();
  const r = Math.sqrt(1 - z * z);
  return { x: r * Math.cos(phi), y: r * Math.sin(phi), z };
}

/** Chance of "up" along an axis at angle θ to the spin's last measured direction. */
export const probabilityUp = (thetaDeg) => Math.cos(toRad(thetaDeg) / 2) ** 2;

/**
 * Quantum measurement of a spin whose state is the Bloch direction `state`
 * along `axis`. Returns up (true/false) and the new state, which is the axis
 * itself for up and the opposite direction for down.
 */
export function measure(state, axis, rng = Math.random) {
  const pUp = (1 + dot(state, axis)) / 2;
  const up = rng() < pUp;
  return { up, state: up ? axis : neg(axis) };
}

/** The magnets in each setup, in order. */
export function stagesFor(setup, tiltDeg = 60) {
  switch (setup) {
    case "zz": return [{ deg: 0, label: "Z" }, { deg: 0, label: "Z" }];
    case "zx": return [{ deg: 0, label: "Z" }, { deg: 90, label: "X" }];
    case "zxz": return [{ deg: 0, label: "Z" }, { deg: 90, label: "X" }, { deg: 0, label: "Z" }];
    case "ztilt": return [{ deg: 0, label: "Z" }, { deg: tiltDeg, label: `${tiltDeg}°` }];
    default: return [{ deg: 0, label: "Z" }];
  }
}

/**
 * Send one atom through every magnet. Between magnets, the beam named by
 * `block` ("up" or "down") is stopped, so only the other one goes on.
 *
 * quantum:   each magnet gives exactly up or down (deflection ±1) and resets the state.
 * classical: the atom's magnet points in a fixed random direction; each magnet
 *            deflects it by the component along its axis, anywhere from −1 to +1.
 *
 * Returns { steps: [{ up, deflection }], blockedAt } where blockedAt is the
 * index of the magnet after which the atom was stopped, or −1 if it reached the screen.
 */
export function runAtom(mode, stages, block = "down", rng = Math.random) {
  let state = randomDirection(rng);
  const steps = [];
  for (let k = 0; k < stages.length; k++) {
    const axis = axisVector(stages[k].deg);
    let up, deflection;
    if (mode === "classical") {
      deflection = dot(state, axis);
      up = deflection >= 0;
    } else {
      const m = measure(state, axis, rng);
      up = m.up;
      state = m.state;
      deflection = up ? 1 : -1;
    }
    steps.push({ up, deflection });
    const last = k === stages.length - 1;
    if (!last && (block === "down" ? !up : up)) return { steps, blockedAt: k };
  }
  return { steps, blockedAt: -1 };
}
