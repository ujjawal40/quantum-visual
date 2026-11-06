// The first twenty elements, and which of their isotopes are stable.
// Stable = no observed decay. Potassium-40 and calcium-48 are radioactive
// (though very long-lived), so they are left out.

export const ELEMENTS = [
  null,
  { symbol: "H", name: "hydrogen", stable: [1, 2] },
  { symbol: "He", name: "helium", stable: [3, 4] },
  { symbol: "Li", name: "lithium", stable: [6, 7] },
  { symbol: "Be", name: "beryllium", stable: [9] },
  { symbol: "B", name: "boron", stable: [10, 11] },
  { symbol: "C", name: "carbon", stable: [12, 13] },
  { symbol: "N", name: "nitrogen", stable: [14, 15] },
  { symbol: "O", name: "oxygen", stable: [16, 17, 18] },
  { symbol: "F", name: "fluorine", stable: [19] },
  { symbol: "Ne", name: "neon", stable: [20, 21, 22] },
  { symbol: "Na", name: "sodium", stable: [23] },
  { symbol: "Mg", name: "magnesium", stable: [24, 25, 26] },
  { symbol: "Al", name: "aluminium", stable: [27] },
  { symbol: "Si", name: "silicon", stable: [28, 29, 30] },
  { symbol: "P", name: "phosphorus", stable: [31] },
  { symbol: "S", name: "sulfur", stable: [32, 33, 34, 36] },
  { symbol: "Cl", name: "chlorine", stable: [35, 37] },
  { symbol: "Ar", name: "argon", stable: [36, 38, 40] },
  { symbol: "K", name: "potassium", stable: [39, 41] },
  { symbol: "Ca", name: "calcium", stable: [40, 42, 43, 44, 46] },
];

export const MAX_P = 20;
export const MAX_N = 22;
export const MAX_E = 20;

/** Shell capacities used for the first twenty elements (simplified). */
export const SHELLS = [2, 8, 8, 2];

const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻" };
export const superscript = (s) => String(s).replace(/[0-9+-]/g, (c) => SUP[c]);

/** Everything the lesson shows about a set of particles. */
export function describeAtom(p, n, e) {
  const A = p + n;
  const charge = p - e;
  const el = ELEMENTS[p] ?? null;
  const chargeText = charge === 0 ? "" : `${Math.abs(charge) === 1 ? "" : Math.abs(charge)}${charge > 0 ? "+" : "-"}`;
  let stability;
  if (!el) stability = A === 0 ? "empty" : "not an element";
  else stability = el.stable.includes(A) ? "stable" : "unstable";
  return {
    p, n, e, A, charge, element: el,
    notation: el ? `${superscript(A)}${el.symbol}${superscript(chargeText)}` : "",
    stability,
    kind: !el ? "none" : charge === 0 ? "atom" : charge > 0 ? "positive ion" : "negative ion",
  };
}

/** How many electrons sit in each shell for a given electron count. */
export function shellFill(e) {
  const out = [];
  let left = e;
  for (const cap of SHELLS) {
    if (left <= 0) break;
    out.push(Math.min(cap, left));
    left -= cap;
  }
  return out;
}
