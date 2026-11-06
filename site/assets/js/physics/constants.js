// Physical constants (SI, CODATA 2018). Mirrors labs/constants.py so the
// website and the Python labs always agree.

export const h = 6.62607015e-34;          // Planck constant, J·s
export const hbar = h / (2 * Math.PI);    // reduced Planck constant, J·s
export const c = 299792458;               // speed of light, m/s
export const e = 1.602176634e-19;         // elementary charge, C
export const k = 8.9875517923e9;          // Coulomb constant, N·m²/C²
export const m_e = 9.1093837015e-31;      // electron mass, kg
export const m_p = 1.67262192369e-27;     // proton mass, kg
export const m_n = 1.67492749804e-27;     // neutron mass, kg
export const u = 1.6605390666e-27;        // atomic mass unit, kg
export const a_0 = 5.29177210903e-11;     // Bohr radius, m
export const alpha = 7.2973525693e-3;     // fine-structure constant
export const E_R = 13.605693122994;       // Rydberg energy, eV

export const eV = e;                      // 1 eV in joules
export const hc_eV_nm = (h * c) / e / 1e-9; // ≈ 1239.84 eV·nm

export const photonEnergyEV = (nm) => hc_eV_nm / nm;
export const photonWavelengthNM = (eVal) => hc_eV_nm / eVal;
export const frequencyFromNM = (nm) => c / (nm * 1e-9);
